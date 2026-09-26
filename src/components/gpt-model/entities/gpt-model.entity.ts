import { User } from 'src/components/users/entities/user.entity';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';

@Entity('gpt_models')
export class GptModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToOne(() => User, (user) => user.gptModels, { nullable: false })
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}
