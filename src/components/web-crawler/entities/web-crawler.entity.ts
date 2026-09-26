import { User } from 'src/components/users/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum CrawlerProvider {
  FIRECRAWL = 'firecrawl',
  SCRAPY = 'scrapy',
  PUPPETEER = 'puppeteer',
  SELENIUM = 'selenium',
  PLAYWRIGHT = 'playwright',
}

@Entity()
export class WebCrawler {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  apiKey: string;

  @Column({
    type: 'enum',
    enum: CrawlerProvider,
    nullable: true,
  })
  provider: string;

  @Column({nullable:true})
  model: string;

  @ManyToOne(() => User, (user) => user.webCrawler)
  user: User;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
