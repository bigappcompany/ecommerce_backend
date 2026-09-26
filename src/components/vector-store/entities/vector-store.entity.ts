import { User } from 'src/components/users/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum VectorProvider {
  MILVUS = 'milvus',
  PINECONE = 'pinecone',
  QDRANT = 'qdrant',
  WEAVIATE = 'weaviate',
  CHROMADB = 'chromadb',
}

@Entity()
export class VectorStore {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  apiKey: string;

  @Column({
    type: 'enum',
    enum: VectorProvider,
    nullable: true,
  })
  provider: string;

  @Column({nullable:true})
  model: string;

  @ManyToOne(() => User, (user) => user.vectorStores)
  user: User;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}