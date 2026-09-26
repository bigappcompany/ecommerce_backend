import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Enquiry } from './entities/enquiry.entity';
import { EnquiryController } from './enquiry.controller';
import { EnquiryService } from './enquiry.service';

@Module({
  imports: [TypeOrmModule.forFeature([Enquiry])],
  controllers: [EnquiryController],
  providers: [EnquiryService],
  exports: [EnquiryService],
})
export class EnquiryModule {}
