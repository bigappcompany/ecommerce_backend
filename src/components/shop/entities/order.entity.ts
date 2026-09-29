import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrderItem } from './order-item.entity';
import { OrderEvent } from './order-event.entity';

@Entity()
export class ShopOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true, nullable: true })
  order_number: string;

  @Column()
  user_id: string;

  @Column({ default: 'pending' })
  status: string;

  @Column({ type: 'float', default: 0 })
  total: number;

  @Column({ nullable: true })
  shipping_name: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  pincode: string;

  @Column({ nullable: true })
  razorpay_order_id: string;

  @Column({ nullable: true })
  razorpay_payment_id: string;

  @Column({ default: 'unpaid' })
  payment_status: string;

  @Column({ default: 'none' })
  refund_status: string;

  @Column({ type: 'float', default: 0 })
  refunded_amount: number;

  @Column({ nullable: true })
  refund_reference: string;

  @Column({ nullable: true })
  tracking_id: string;

  @Column({ nullable: true })
  carrier: string;

  @Column({ type: 'text', nullable: true })
  cancel_reason: string;

  @Column({ type: 'timestamp', nullable: true })
  cancelled_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  delivered_at: Date;

  @Column({ type: 'text', nullable: true })
  return_reason: string;

  @Column({ type: 'timestamp', nullable: true })
  return_requested_at: Date;

  @Column({ default: false })
  stock_restored: boolean;

  @Column({ nullable: true })
  previous_status: string;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @OneToMany(() => OrderEvent, (event) => event.order, { cascade: true })
  events: OrderEvent[];

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
