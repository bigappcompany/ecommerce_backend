import { Transform } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  isBoolean,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';
import {
  ActionTypeEnum,
  MediaUploadFileTypesEnum,
} from '../constants/media-uploads.enum';

export class CreateMediaUpload {
  @IsEnum(MediaUploadFileTypesEnum)
  file_type: MediaUploadFileTypesEnum;

  @IsBoolean()
  is_private: boolean;
}

export class CreatePresignedUrl {
  @IsNotEmpty()
  @IsEnum(ActionTypeEnum)
  action: ActionTypeEnum;

  @IsOptional()
  key: string;
}

export class CreateS3DirectUpload {
  @IsArray()
  @ArrayNotEmpty()
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value;
    } else {
      return value.split(',');
    }
  })
  s3_upload_data: s3UploadData[];
}

export class s3UploadData {
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  key: string;

  @IsNotEmpty()
  mime_type: string;

  @IsNotEmpty()
  extension: string;

  @IsBoolean()
  is_s3_direct_upload: boolean;
}
