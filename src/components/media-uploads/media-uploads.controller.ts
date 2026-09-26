import {
  Controller,
  Post,
  UseInterceptors,
  Res,
  UploadedFile,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiHeader,
  ApiTags,
} from '@nestjs/swagger';
import { MediaUploadsService } from './media-uploads.service';
import { Express } from 'express';
import { JwtAccessTokenGuard } from '../auth/passport/jwt-access.guard';
// import { CustomFileInterceptor } from 'src/interceptors/file.interceptor';

@ApiTags('Media Upload')
@ApiHeader({ name: 'source' })
@ApiBearerAuth()
@UseGuards(JwtAccessTokenGuard)
@Controller('media-uploads')
export class MediaUploadsController {
  constructor(private readonly mediaUploadsService: MediaUploadsService) {}

  @Post('file/upload')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Res() res,
    @Req() req,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const upload = await this.mediaUploadsService.uploadFile(file,req.user);
    return res.status(HttpStatus.CREATED).json({
      statusCode: HttpStatus.CREATED,
      message: 'Uploaded File Successfully',
      data: { ...upload },
    });
  }
}
