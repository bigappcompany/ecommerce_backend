import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHmac, randomBytes, timingSafeEqual } from 'crypto';
import Razorpay from 'razorpay';
import { ShopOrder } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CartService } from './cart.service';
import { Product } from './entities/product.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(ShopOrder)
    private readonly orders: Repository<ShopOrder>,
    @InjectRepository(OrderItem)
    private readonly orderItems: Repository<OrderItem>,
    @InjectRepository(Product)
    private readonly products: Repository<Product>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
    private readonly cartService: CartService,
    private readonly configService: ConfigService,
  ) {}

  private razorpayKey() {
    return (
      this.configService.get<string>('RAZORPAY_KEY_ID') ||
      this.configService.get<string>('RAZORPAY_KEY') ||
      ''
    );
  }

  async checkout(userId: string, shipping: any) {
    const cart = await this.cartService.getOrCreate(userId);
    if (!cart.items.length) {
      throw new BadRequestException('Your cart is empty');
    }
    if (!shipping?.shipping_name || !shipping?.address || !shipping?.phone) {
      throw new BadRequestException('Name, phone, and address are required');
    }

    await this.orders
      .createQueryBuilder()
      .update(ShopOrder)
      .set({ status: 'cancelled' })
      .where('user_id = :userId AND status = :status', {
        userId,
        status: 'pending',
      })
      .execute();

    for (const item of cart.items) {
      if (item.product.stock < item.quantity) {
        throw new BadRequestException(`${item.product.name} is out of stock`);
      }
    }

    const order = await this.orders.save(
      this.orders.create({
        user_id: userId,
        status: 'pending',
        total: cart.subtotal,
        shipping_name: shipping.shipping_name,
        phone: shipping.phone,
        address: shipping.address,
        city: shipping.city || '',
        pincode: shipping.pincode || '',
        items: cart.items.map((item) =>
          this.orderItems.create({
            product_id: item.product.id,
            name: item.product.name,
            image_url: item.product.image_url,
            price: Number(item.product.price),
            quantity: item.quantity,
          }),
        ),
      }),
    );

    const amount = Math.round(Number(order.total) * 100);
    const secret = this.configService.get<string>('RAZORPAY_KEY_SECRET');
    const key = this.razorpayKey();
    let razorpayOrderId = null;
    if (key && secret) {
      const razorpay = new Razorpay({ key_id: key, key_secret: secret });
      const razorpayOrder = await razorpay.orders.create({
        amount,
        currency: 'INR',
        receipt: order.id.replace(/-/g, '').slice(0, 40),
      });
      razorpayOrderId = razorpayOrder.id;
      order.razorpay_order_id = razorpayOrderId;
      await this.orders.save(order);
    }

    return {
      order_id: order.id,
      amount,
      currency: 'INR',
      key,
      razorpay_order_id: razorpayOrderId,
      total: order.total,
    };
  }

  async confirm(userId: string, body: any) {
    const order = await this.orders.findOne({
      where: { id: body.order_id, user_id: userId },
      relations: ['items'],
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    if (order.status === 'paid') {
      return order;
    }
    if (!body.razorpay_payment_id) {
      throw new BadRequestException('Payment id is required');
    }

    const secret = this.configService.get<string>('RAZORPAY_KEY_SECRET');
    if (secret) {
      const razorpayOrderId = body.razorpay_order_id || order.razorpay_order_id;
      const payload = `${razorpayOrderId}|${body.razorpay_payment_id}`;
      const expected = createHmac('sha256', secret).update(payload).digest('hex');
      const given = String(body.razorpay_signature || '');
      const valid =
        expected.length === given.length &&
        timingSafeEqual(Buffer.from(expected), Buffer.from(given));
      if (!valid) {
        order.status = 'failed';
        await this.orders.save(order);
        throw new BadRequestException('Payment verification failed');
      }
    }

    for (const item of order.items) {
      if (!item.product_id) continue;
      const product = await this.products.findOne({ where: { id: item.product_id } });
      if (!product || product.stock < item.quantity) {
        order.status = 'failed';
        await this.orders.save(order);
        throw new BadRequestException(`${item.name} no longer has enough stock`);
      }
      product.stock -= item.quantity;
      await this.products.save(product);
    }

    order.status = 'paid';
    order.razorpay_payment_id = body.razorpay_payment_id;
    order.razorpay_order_id = body.razorpay_order_id || order.razorpay_order_id;
    await this.orders.save(order);
    await this.cartService.clear(userId);
    return this.findMineOne(userId, order.id);
  }

  async findMine(userId: string) {
    return this.orders.find({
      where: { user_id: userId },
      relations: ['items'],
      order: { created_at: 'DESC' },
    });
  }

  async findMineOne(userId: string, id: string) {
    const order = await this.orders.findOne({
      where: { id, user_id: userId },
      relations: ['items'],
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  async findAll() {
    const orders = await this.orders.find({
      relations: ['items'],
      order: { created_at: 'DESC' },
    });
    return this.attachCustomers(orders);
  }

  async checkoutForCustomer(email: string, shipping: any) {
    const user = await this.customerByEmail(email);
    return this.checkout(user.id, shipping);
  }

  async confirmForCustomer(email: string, body: any) {
    const user = await this.customerByEmail(email);
    const order = await this.confirm(user.id, body);
    const listed = await this.findByEmail(email);
    return { paid_order_id: order.id, ...listed };
  }

  async findByEmail(email: string) {
    const user = await this.customerByEmail(email);
    const orders = await this.orders.find({
      where: { user_id: user.id },
      relations: ['items'],
      order: { created_at: 'DESC' },
    });
    return {
      customer: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone_number: user.phone_number,
      },
      orders: orders.map((order) => this.presentOrder(order, user.email, user.first_name, user.last_name)),
    };
  }

  private async customerByEmail(email: string) {
    const normalized = String(email || '').trim().toLowerCase();
    if (!normalized) {
      throw new BadRequestException('email is required');
    }
    const user = await this.users
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.email',
        'user.first_name',
        'user.last_name',
        'user.phone_number',
      ])
      .where('LOWER(user.email) = :email', { email: normalized })
      .getOne();
    if (!user) {
      throw new NotFoundException('Customer not found');
    }
    return user;
  }

  private async attachCustomers(orders: ShopOrder[]) {
    const ids = [...new Set(orders.map((order) => order.user_id).filter(Boolean))];
    const users = ids.length
      ? await this.users
          .createQueryBuilder('user')
          .select([
            'user.id',
            'user.email',
            'user.first_name',
            'user.last_name',
          ])
          .where('user.id IN (:...ids)', { ids })
          .getMany()
      : [];
    const byId = new Map(users.map((user) => [user.id, user]));
    return orders.map((order) => {
      const customer = byId.get(order.user_id);
      return this.presentOrder(
        order,
        customer?.email,
        customer?.first_name,
        customer?.last_name,
      );
    });
  }

  private presentOrder(
    order: ShopOrder,
    email?: string,
    firstName?: string,
    lastName?: string,
  ) {
    return {
      id: order.id,
      user_id: order.user_id,
      status: order.status,
      total: order.total,
      shipping_name: order.shipping_name,
      phone: order.phone,
      address: order.address,
      city: order.city,
      pincode: order.pincode,
      razorpay_order_id: order.razorpay_order_id,
      razorpay_payment_id: order.razorpay_payment_id,
      created_at: order.created_at,
      updated_at: order.updated_at,
      customer_email: email || null,
      customer_name: `${firstName || ''} ${lastName || ''}`.trim() || null,
      items: (order.items || []).map((item) => ({
        id: item.id,
        product_id: item.product_id,
        name: item.name,
        image_url: item.image_url,
        price: item.price,
        quantity: item.quantity,
      })),
    };
  }

  async updateStatus(id: string, status: string) {
    const allowed = ['paid', 'shipped', 'delivered', 'cancelled', 'failed'];
    if (!allowed.includes(status)) {
      throw new BadRequestException('Invalid order status');
    }
    const order = await this.orders.findOne({ where: { id }, relations: ['items'] });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    order.status = status;
    return this.orders.save(order);
  }
}

export function createApiKeyMaterial() {
  const secret = randomBytes(24).toString('hex');
  return `zk_${secret}`;
}
