import { User } from 'src/components/users/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum EmbeddingProvider {
  OPENAI = 'openai',
  COHERE = 'cohere',
  TOGETHERAI = 'togetherai',
  HUGGINGFACE = 'huggingface',
  GOOGLE = 'google',
}

@Entity()
export class Embedding {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  apiKey: string;

  @Column({
    type: 'enum',
    enum: EmbeddingProvider,
    nullable: true,
  })
  provider: string;

  @Column({nullable:true})
  model: string;

  @ManyToOne(() => User, (user) => user.embeddings)
  user: User;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
