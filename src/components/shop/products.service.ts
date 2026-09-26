import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';

export const PRODUCT_SCOPES = [
  'products:read',
  'products:write',
  'products:delete',
  'orders:read',
  'orders:write',
  'cart:read',
  'cart:write',
];

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly products: Repository<Product>,
  ) {}

  async list(query: { search?: string; category?: string; includeInactive?: boolean }) {
    const qb = this.products.createQueryBuilder('product');
    if (!query.includeInactive) {
      qb.where('product.is_active = :active', { active: true });
    }
    if (query.category) {
      qb.andWhere('product.category = :category', { category: query.category });
    }
    if (query.search) {
      qb.andWhere(
        '(product.name ILIKE :search OR product.description ILIKE :search OR product.sku ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }
    qb.orderBy('product.created_at', 'DESC');
    const products = await qb.getMany();
    const categories = [
      ...new Set((await this.products.find({ select: ['category'] })).map((p) => p.category)),
    ];
    return { products, categories };
  }

  async findOne(id: string) {
    const product = await this.products.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async create(dto: Partial<Product>) {
    if (!dto.name || dto.price == null || !dto.sku) {
      throw new BadRequestException('Name, price, and SKU are required');
    }
    const existing = await this.products.findOne({ where: { sku: dto.sku } });
    if (existing) {
      throw new BadRequestException('SKU already exists');
    }
    const product = this.products.create({
      name: dto.name,
      description: dto.description || '',
      price: Number(dto.price),
      compare_at_price: dto.compare_at_price ? Number(dto.compare_at_price) : null,
      category: dto.category || 'General',
      stock: Number(dto.stock || 0),
      image_url: dto.image_url || '',
      sku: dto.sku,
      rating: dto.rating ? Number(dto.rating) : 4.5,
      is_active: dto.is_active !== false,
    });
    return this.products.save(product);
  }

  async update(id: string, dto: Partial<Product>) {
    const product = await this.findOne(id);
    if (dto.sku && dto.sku !== product.sku) {
      const existing = await this.products.findOne({ where: { sku: dto.sku } });
      if (existing) {
        throw new BadRequestException('SKU already exists');
      }
    }
    Object.assign(product, {
      ...dto,
      price: dto.price != null ? Number(dto.price) : product.price,
      stock: dto.stock != null ? Number(dto.stock) : product.stock,
    });
    return this.products.save(product);
  }

  async remove(id: string) {
    const product = await this.findOne(id);
    await this.products.remove(product);
    return { deleted: true };
  }
}
