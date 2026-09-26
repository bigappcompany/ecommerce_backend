import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebCrawlerService } from './web-crawler.service';
import { WebCrawlerController } from './web-crawler.controller';
import { Agent } from '../agent/entities/agent.entity';
import { WebCrawler } from './entities/web-crawler.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WebCrawler, Agent, User])],
  controllers: [WebCrawlerController],
  providers: [WebCrawlerService],
})
export class WebCrawlerModule {}
