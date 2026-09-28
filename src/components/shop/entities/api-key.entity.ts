import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class ApiCredential {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  prefix: string;

  @Column({ select: false })
  key_hash: string;

  @Column({ type: 'varchar', nullable: true, select: false })
  token: string;

  @Column({ type: 'simple-array' })
  scopes: string[];

  @Column({ default: true })
  is_active: boolean;

  @Column({ nullable: true })
  last_used_at: Date;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
