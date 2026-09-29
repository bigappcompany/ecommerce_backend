import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ShopOrder } from './order.entity';

@Entity()
export class OrderEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ShopOrder, (order) => order.events, { onDelete: 'CASCADE' })
  order: ShopOrder;

  @Column()
  status: string;

  @Column()
  label: string;

  @Column({ type: 'text', nullable: true })
  note: string;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  tracking_id: string;

  @Column({ nullable: true })
  carrier: string;

  @Column({ nullable: true })
  actor_role: string;

  @Column({ nullable: true })
  actor_id: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
