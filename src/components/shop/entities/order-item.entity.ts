import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ShopOrder } from './order.entity';

@Entity()
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ShopOrder, (order) => order.items, { onDelete: 'CASCADE' })
  order: ShopOrder;

  @Column({ nullable: true })
  product_id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  image_url: string;

  @Column({ type: 'float' })
  price: number;

  @Column({ default: 1 })
  quantity: number;

  @Column({ default: 0 })
  cancelled_quantity: number;
}
