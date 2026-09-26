import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as path from 'path';
import { S3 } from 'aws-sdk';
import { ConfigService } from '@nestjs/config';
import { getHashSHA1 } from 'src/common/utils/hashing.util';
import { InjectRepository } from '@nestjs/typeorm';
import { getFileTypeFromMimeType } from './media-uploads.util';
import { v4 as uuidv4 } from 'uuid';
import { MediaUpload } from './entities/media-upload.entity';
import { Repository } from 'typeorm';
import { validate } from 'src/common/utils/file-validate.util';

@Injectable()
export class MediaUploadsService {
  constructor(
    @InjectRepository(MediaUpload)
    private mediaUploadRepository: Repository<MediaUpload>,

    private readonly configService: ConfigService,
  ) {}

  // async uploadFile(file: Express.Multer.File,user) {
  //   // try {
  //   await validate(file);
  //   const { buffer: fileBuffer, originalname, mimetype: mimeType } = file;
  //   const hash = getHashSHA1(fileBuffer);
  //   const mediaUploadFile = await this.findByHash(hash);
  //   if (mediaUploadFile) {
  //     return mediaUploadFile;
  //   }
  //   const name = path.parse(originalname).name;
  //   const extension = path.parse(originalname).ext;
  //   const fileType = getFileTypeFromMimeType(mimeType);
  //   const folder = `${fileType}s`;
  //   const fileKey = `${folder}/${name}${extension}`;
  //   const s3 = new S3();
  //   const { Key: key, Location: url } = await s3
  //     .upload({
  //       Bucket: this.configService.get('AWS_PUBLIC_BUCKET_NAME'),
  //       Body: fileBuffer,
  //       Key: fileKey,
  //       ContentType: mimeType,
  //       ACL: 'public-read',
  //     })
  //     .promise();
  //     let createUploadFile:any = {
  //       name,
  //       hash,
  //       extension,
  //       key,
  //       url,
  //       mime_type: mimeType,
  //       file_type: fileType,
  //       created_by:user?.id
  //     };

  // return this.mediaUploadRepository.save(createUploadFile);
  //   // } catch (err) {
  //   //   console.log('err::', err);
  //   // }
  // }

  async uploadFile(file: Express.Multer.File, user) {
    await validate(file);
    const { buffer: fileBuffer, originalname, mimetype: mimeType } = file;
    const hash = getHashSHA1(fileBuffer);
    const mediaUploadFile = await this.findByHash(hash);
    if (mediaUploadFile) {
      return mediaUploadFile;
    }

    const name = path.parse(originalname).name;
    const extension = path.parse(originalname).ext;
    const fileType = getFileTypeFromMimeType(mimeType);
    const folder = `${fileType}s`;
    const fileKey = `${folder}/${uuidv4()}${extension}`;
    const endpointHost = this.configService.get('AWS_ENDPOINT') || '';
    const endpoint = endpointHost.startsWith('http')
      ? endpointHost
      : `https://${endpointHost}`;
    const s3 = new S3({
      endpoint,
      region: this.configService.get('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
      },
      signatureVersion: 'v4',
    });
    const bucket = this.configService.get('AWS_BUCKET_NAME');
    const params = {
      Bucket: bucket,
      Body: fileBuffer,
      Key: fileKey,
      ContentType: mimeType,
    };
    let uploaded;
    try {
      uploaded = await s3.upload({ ...params, ACL: 'public-read' }).promise();
    } catch (error) {
      uploaded = await s3.upload(params).promise();
    }

    let createUploadFile: any = {
      name,
      hash,
      extension,
      key: uploaded.Key,
      url: this.publicUrl(uploaded.Key),
      mime_type: mimeType,
      file_type: fileType,
      created_by: user?.id,
    };

    return this.mediaUploadRepository.save(createUploadFile);
  }

  async findById(id: string) {
    const mediaUpload = await this.mediaUploadRepository
      .createQueryBuilder('media_upload')
      .where('media_upload.id = :id', { id })
      .getOne();
    if (!mediaUpload) {
      throw new HttpException(
        'Media Upload File Not Found',
        HttpStatus.NOT_FOUND,
      );
    }
    return mediaUpload;
  }

  async findByIds(ids: string[]): Promise<MediaUpload[]> {
    return this.mediaUploadRepository
      .createQueryBuilder('media_upload')
      .where('media_upload.id IN (:...ids)', { ids })
      .getMany();
  }

  async findByHash(hash) {
    return this.mediaUploadRepository.findOne({ where: { hash } });
  }

  private publicUrl(key: string) {
    const cdn = this.configService.get('ASSETS_CDN_ENDPOINT');
    const origin = this.configService.get('ASSETS_ORIGIN_ENDPOINT');
    const base = String(cdn || origin || '').replace(/\/$/, '');
    if (base) {
      return `${base}/${key}`;
    }
    const bucket = this.configService.get('AWS_BUCKET_NAME');
    const region = this.configService.get('AWS_REGION');
    return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
  }

}
