import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'float' })
  price: number;

  @Column({ type: 'float', nullable: true })
  compare_at_price: number;

  @Column({ default: 'General' })
  category: string;

  @Column({ default: 0 })
  stock: number;

  @Column({ nullable: true })
  image_url: string;

  @Column({ unique: true })
  sku: string;

  @Column({ type: 'float', default: 4.5 })
  rating: number;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
