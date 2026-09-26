import { isEnum } from 'class-validator';
import { GptModel } from 'src/components/gpt-model/entities/gpt-model.entity';
import { KnowledgeBase } from 'src/components/knowledge-base/entities/knowledge-base.entity';
import { PromptResponse } from 'src/components/prompt-response/entities/prompt-response.entity';
import { Subscription } from 'src/components/subscriptions/entities/subscription.entity';
import { LLmModel } from 'src/components/llm-models/entities/llmModel.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { WebCrawler } from 'src/components/web-crawler/entities/web-crawler.entity';
import { VectorStore } from 'src/components/vector-store/entities/vector-store.entity';
import { Embedding } from 'src/components/embedding/entities/embedding.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  first_name: string;

  @Column()
  last_name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({
    type: 'jsonb',
    array: false,
    default: () => "'[]'",
    nullable: false,
  })
  profile_pic: Array<{ url: string }>;

  @Column({ nullable: true })
  phone_number: string;

  @Column({ nullable: true, select: false })
  password_hash: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ nullable: true })
  subscription_id: string;

  @Column({ nullable: true })
  subscription_plan: string;

  @Column({ default: false })
  is_paid: boolean;

  @Column({ default: true })
  is_free_trail: boolean;

  @Column({ default: 'user' })
  role: string;

  @OneToMany(() => GptModel, (gptModel) => gptModel.user)
  gptModels: GptModel[];

  @OneToMany(() => LLmModel, (apiKey) => apiKey.user)
  apiKeys: LLmModel[];

  @OneToMany(() => PromptResponse, (promptResponse) => promptResponse.user)
  promptResponses: PromptResponse[];

  @OneToMany(() => WebCrawler, (webCrawler) => webCrawler.user)
  webCrawler: WebCrawler[];

  @OneToMany(() => Embedding, (embedding) => embedding.user)
  embeddings: Embedding[];

  @OneToMany(() => VectorStore, (vectorStore) => vectorStore.user)
  vectorStores: VectorStore[];
  
  @OneToMany(() => KnowledgeBase, (knowledgeBases) => knowledgeBases.user)
  knowledgeBases: KnowledgeBase[];

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
