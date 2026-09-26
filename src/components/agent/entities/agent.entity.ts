import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Feature } from './feature.entity';
import { User } from 'src/components/users/entities/user.entity';
import { PromptResponse } from 'src/components/prompt-response/entities/prompt-response.entity';
import { KnowledgeBase } from 'src/components/knowledge-base/entities/knowledge-base.entity';

@Entity()
export class Agent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  agent_role: string;

  @Column({ nullable: true })
  agent_instructions: string;

  @Column({ nullable: true })
  examples: string;

  @Column({ nullable: true })
  tool: string;

  @Column({ nullable: true })
  tool_usage_description: string;

  @ManyToOne(() => User, (user) => user.apiKeys)
  user: User;

  @Column({ nullable: true }) // Ensure this is non-nullable
  provider: string;

  @Column({ nullable: true }) // Ensure this is non-nullable
  model: string;

  @Column({ nullable: true })
  temperature: number;

  @Column({ nullable: true })
  top_p: number;

  @OneToMany(() => Feature, (feature) => feature.agent, { cascade: true })
  features: Feature[];

  @OneToMany(() => PromptResponse, (promptResponse) => promptResponse.agent)
  promptResponses: PromptResponse[];

  @ManyToOne(() => KnowledgeBase, (knowledgeBase) => knowledgeBase.agents)
  knowledgeBase: KnowledgeBase;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
  agent: { id: string };
}
