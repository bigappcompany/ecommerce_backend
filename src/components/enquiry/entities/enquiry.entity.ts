import { IsEnum, isEnum } from 'class-validator';
import { FilterStatusDefaultEnum } from 'src/common/enum/filter.enum';
import { Subscription } from 'src/components/subscriptions/entities/subscription.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Enquiry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  full_name: string;

  @Column()
  email: string;

  @Column()
  phone: string;

  @Column()
  message: string;

  @Column({ default: 'active', nullable: true })
  @IsEnum(FilterStatusDefaultEnum)
  status: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
