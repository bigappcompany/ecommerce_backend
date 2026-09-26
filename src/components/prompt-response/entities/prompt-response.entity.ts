import { Agent } from 'src/components/agent/entities/agent.entity';
import { User } from 'src/components/users/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class PromptResponse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  prompt: string;

  @Column()
  response: string;

  @ManyToOne(() => User, (user) => user.promptResponses)
  user: User;

  @ManyToOne(() => Agent, (agent) => agent.promptResponses)
  agent: Agent;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
