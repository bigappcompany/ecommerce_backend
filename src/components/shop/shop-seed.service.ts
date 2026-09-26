import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Product } from './entities/product.entity';
import { hashData } from '../auth/helpers/auth-helper';

const SAMPLE_PRODUCTS = [
  {
    name: 'Noise-cancelling Headphones',
    description: 'Over-ear headphones with 30-hour battery and deep bass.',
    price: 2499,
    compare_at_price: 3999,
    category: 'Electronics',
    stock: 40,
    sku: 'BZ-HP-001',
    rating: 4.6,
    image_url:
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Everyday Running Shoes',
    description: 'Lightweight knit shoes for walking and daily runs.',
    price: 3299,
    compare_at_price: 4599,
    category: 'Fashion',
    stock: 28,
    sku: 'BZ-SH-002',
    rating: 4.4,
    image_url:
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Pour-over Coffee Maker',
    description: 'Glass carafe and stainless filter for a clean cup.',
    price: 1899,
    compare_at_price: 2499,
    category: 'Home',
    stock: 18,
    sku: 'BZ-CF-003',
    rating: 4.7,
    image_url:
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'City Backpack',
    description: 'Water-resistant 20L backpack with a laptop sleeve.',
    price: 2199,
    compare_at_price: 2799,
    category: 'Fashion',
    stock: 32,
    sku: 'BZ-BP-004',
    rating: 4.3,
    image_url:
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Fitness Smart Watch',
    description: 'Heart-rate, sleep, and step tracking with a 7-day battery.',
    price: 5999,
    compare_at_price: 7999,
    category: 'Electronics',
    stock: 15,
    sku: 'BZ-SW-005',
    rating: 4.5,
    image_url:
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Adjustable Desk Lamp',
    description: 'Warm and cool LED lamp for a work desk.',
    price: 999,
    compare_at_price: 1499,
    category: 'Home',
    stock: 50,
    sku: 'BZ-LP-006',
    rating: 4.2,
    image_url:
      'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80',
  },
];

@Injectable()
export class ShopSeedService implements OnModuleInit {
  private readonly logger = new Logger(ShopSeedService.name);

  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
    @InjectRepository(Product)
    private readonly products: Repository<Product>,
  ) {}

  async onModuleInit() {
    await this.ensureUser({
      email: 'admin@shop.com',
      password: 'Admin@123',
      first_name: 'Store',
      last_name: 'Admin',
      role: 'admin',
    });
    await this.ensureUser({
      email: 'user@shop.com',
      password: 'User@123',
      first_name: 'Alex',
      last_name: 'Shopper',
      role: 'user',
    });
    const count = await this.products.count();
    if (count === 0) {
      await this.products.save(SAMPLE_PRODUCTS.map((item) => this.products.create(item)));
      this.logger.log('Seeded sample products');
    }
  }

  private async ensureUser(input: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    role: string;
  }) {
    const existing = await this.users.findOne({ where: { email: input.email } });
    if (existing) {
      if (existing.role !== input.role) {
        existing.role = input.role;
        await this.users.save(existing);
      }
      return;
    }
    await this.users.save(
      this.users.create({
        email: input.email,
        password: await hashData(input.password),
        first_name: input.first_name,
        last_name: input.last_name,
        role: input.role,
        phone_number: '',
        profile_pic: [],
      }),
    );
    this.logger.log(`Seeded ${input.role} account ${input.email}`);
  }
}
