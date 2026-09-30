import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { ProductsService } from './products.service';
import { User } from '../users/entities/user.entity';
import { CustomerLookup, findCustomer } from './customer-lookup';

export type CartOwner = { userId?: string; guestToken?: string };

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private readonly carts: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly items: Repository<CartItem>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly productsService: ProductsService,
  ) {}

  async ownerFromCustomer(input: { guestToken?: string } & CustomerLookup): Promise<CartOwner> {
    const email = String(input.email || '').trim();
    const phone = String(input.phone || '').trim();
    if (email || phone) {
      const user = await findCustomer(this.users, { email, phone });
      return { userId: user.id };
    }
    if (!input.guestToken) {
      throw new BadRequestException('Send the customer email, phone number, or a guest_token');
    }
    return { guestToken: input.guestToken };
  }

  async getOrCreate(owner: CartOwner | string) {
    const target = this.normalize(owner);
    let cart = await this.carts.findOne({
      where: this.where(target),
      relations: ['items', 'items.product'],
    });
    if (!cart) {
      cart = await this.carts.save(
        this.carts.create({
          user_id: target.userId || null,
          guest_token: target.guestToken || null,
          items: [],
        }),
      );
      cart.items = [];
    }
    return this.present(cart);
  }

  private present(cart: Cart) {
    const items = (cart.items || []).filter((item) => item.product);
    const subtotal = items.reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity,
      0,
    );
    return {
      id: cart.id,
      items: items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        product: item.product,
        line_total: Number(item.product.price) * item.quantity,
      })),
      subtotal,
      item_count: items.reduce((sum, item) => sum + item.quantity, 0),
    };
  }

  private normalize(owner: CartOwner | string): CartOwner {
    if (typeof owner === 'string') {
      return { userId: owner };
    }
    if (!owner.userId && !owner.guestToken) {
      throw new BadRequestException('Missing guest session');
    }
    return owner;
  }

  private where(owner: CartOwner) {
    return owner.userId ? { user_id: owner.userId } : { guest_token: owner.guestToken };
  }

  async addItem(owner: CartOwner | string, productId: string, quantity = 1) {
    const target = this.normalize(owner);
    const product = await this.productsService.findOne(productId);
    if (!product.is_active) {
      throw new BadRequestException('This product is not available');
    }
    const qty = Math.max(1, Number(quantity) || 1);
    if (product.stock < qty) {
      throw new BadRequestException('Not enough stock');
    }
    let cart = await this.carts.findOne({
      where: this.where(target),
      relations: ['items', 'items.product'],
    });
    if (!cart) {
      cart = await this.carts.save(
        this.carts.create({
          user_id: target.userId || null,
          guest_token: target.guestToken || null,
        }),
      );
      cart.items = [];
    }
    const existing = cart.items.find((item) => item.product?.id === productId);
    if (existing) {
      const nextQty = existing.quantity + qty;
      if (product.stock < nextQty) {
        throw new BadRequestException('Not enough stock');
      }
      existing.quantity = nextQty;
      await this.items.save(existing);
    } else {
      const item = this.items.create({ cart, product, quantity: qty });
      await this.items.save(item);
    }
    return this.getOrCreate(target);
  }

  async updateItem(owner: CartOwner | string, itemId: string, quantity: number) {
    const target = this.normalize(owner);
    const cart = await this.carts.findOne({
      where: this.where(target),
      relations: ['items', 'items.product'],
    });
    const item = cart?.items?.find((entry) => entry.id === itemId);
    if (!item) {
      throw new NotFoundException('Cart item not found');
    }
    const qty = Number(quantity);
    if (qty <= 0) {
      await this.items.remove(item);
      return this.getOrCreate(target);
    }
    if (item.product.stock < qty) {
      throw new BadRequestException('Not enough stock');
    }
    item.quantity = qty;
    await this.items.save(item);
    return this.getOrCreate(target);
  }

  async removeItem(owner: CartOwner | string, itemId: string) {
    return this.updateItem(owner, itemId, 0);
  }

  async merge(userId: string, guestToken?: string) {
    if (!guestToken) {
      return this.getOrCreate({ userId });
    }
    await this.carts.manager.transaction(async (manager) => {
      await manager.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`guest:${guestToken}`]);
      const guest = await manager.findOne(Cart, {
        where: { guest_token: guestToken },
        relations: ['items', 'items.product'],
      });
      if (!guest) {
        return;
      }
      for (const item of guest.items || []) {
        if (!item.product?.is_active) {
          continue;
        }
        let userCart = await manager.findOne(Cart, {
          where: { user_id: userId },
          relations: ['items', 'items.product'],
        });
        if (!userCart) {
          userCart = await manager.save(
            manager.create(Cart, { user_id: userId, guest_token: null, items: [] }),
          );
          userCart.items = [];
        }
        const qty = Math.max(1, item.quantity);
        const existing = (userCart.items || []).find((entry) => entry.product?.id === item.product.id);
        if (existing) {
          existing.quantity = Math.min(item.product.stock, existing.quantity + qty);
          if (existing.quantity > 0) {
            await manager.save(existing);
          }
        } else if (item.product.stock >= 1) {
          await manager.save(
            manager.create(CartItem, {
              cart: userCart,
              product: item.product,
              quantity: Math.min(qty, item.product.stock),
            }),
          );
        }
      }
      await manager.remove(guest);
    });
    return this.getOrCreate({ userId });
  }

  async clear(userId: string) {
    const cart = await this.carts.findOne({
      where: { user_id: userId },
      relations: ['items'],
    });
    if (cart?.items?.length) {
      await this.items.remove(cart.items);
    }
    return this.getOrCreate(userId);
  }
}
