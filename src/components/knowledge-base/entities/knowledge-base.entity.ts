import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from 'src/components/users/entities/user.entity';
import { Agent } from 'src/components/agent/entities/agent.entity';

@Entity()
export class KnowledgeBase {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  url: string;

  @Column('text')
  content: string;

  @ManyToOne(() => User, (user) => user.knowledgeBases)
  user: User;

  // @ManyToOne(() => VectorStore, (vectorDatabase) => vectorDatabase.knowledgeBases)
  // vectorDatabase: VectorStore;

  @OneToMany(() => Agent, (agent) => agent.knowledgeBase)
  agents: Agent[];


  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}
