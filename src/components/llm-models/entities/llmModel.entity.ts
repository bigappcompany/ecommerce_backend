import { User } from 'src/components/users/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum Provider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  COHERE = 'cohere',
  HUGGINGFACE = 'huggingface',
  GOOGLE = 'google',
}

@Entity()
export class LLmModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  apiKey: string;

  @Column({
    type: 'enum',
    enum: Provider,
    nullable: true,
  })
  provider: string;

  @Column()
  model: string;

  @ManyToOne(() => User, (user) => user.apiKeys)
  user: User;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}


// export class CreateCrawlerDto {
//   apiKey: string;
//   provider: CrawlerProvider;
//   name: string;
// }

// // src/components/vectors/dto/create-vector-store.dto.ts
// export class CreateVectorStoreDto {
//   apiKey: string;
//   provider: VectorProvider;
//   name: string;
// }

// // src/components/embeddings/dto/create-embedding.dto.ts
// export class CreateEmbeddingDto {
//   apiKey: string;
//   provider: EmbeddingProvider;
//   name: string;
// }
