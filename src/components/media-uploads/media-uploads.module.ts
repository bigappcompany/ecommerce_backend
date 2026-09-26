import { Module } from '@nestjs/common';
import { MediaUploadsService } from './media-uploads.service';
import { MediaUploadsController } from './media-uploads.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaUpload } from './entities/media-upload.entity';

@Module({
  imports:[TypeOrmModule.forFeature([MediaUpload])],
  controllers: [MediaUploadsController],
  providers: [MediaUploadsService],
  exports: [MediaUploadsService],
})
export class MediaUploadsModule {}
