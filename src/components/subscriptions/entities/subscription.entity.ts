import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { IsEnum } from 'class-validator';
import { subscriptionEnum } from '../enums/price.enum';

@Entity()
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  @IsEnum(subscriptionEnum)
  plan_type: string;

  @Column({ nullable: true })
  plan_key: string;

  @Column({ nullable: true })
  start_date: Date;

  @Column({ nullable: true })
  end_date: Date;

  @Column({ nullable: true })
  user_id: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: true })
  is_free_trial: boolean;

  @Column({ default: false })
  is_paid: boolean;

  @Column({ default: null })
  order_id: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
