// feature.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Agent } from './agent.entity';

export enum FeatureType {
  KNOWLEDGE_BASE = 'KNOWLEDGE_BASE',
  SHORT_TERM_MEMORY = 'SHORT_TERM_MEMORY',
  LONG_TERM_MEMORY = 'LONG_TERM_MEMORY',
  HUMANIZER = 'HUMANIZER',
}

@Entity()
export class Feature {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: FeatureType,
  })
  type: FeatureType;

  @Column('json')
  config: Record<string, any>;

  @Column('int')
  priority: number;

  @ManyToOne(() => Agent, (agent) => agent.features)
  agent: Agent;
}
