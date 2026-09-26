import { MediaUploadFileTypesEnum } from './constants/media-uploads.enum';
import * as crypto from 'crypto';

export function getFileTypeFromMimeType(mimeType) {
  if (mimeType.includes(MediaUploadFileTypesEnum.AUDIO)) {
    return MediaUploadFileTypesEnum.AUDIO;
  } else if (mimeType.includes(MediaUploadFileTypesEnum.IMAGE)) {
    return MediaUploadFileTypesEnum.IMAGE;
  } else if (mimeType.includes(MediaUploadFileTypesEnum.VIDEO)) {
    return MediaUploadFileTypesEnum.VIDEO;
  } else {
    return MediaUploadFileTypesEnum.DOCUMENT;
  }
}

export function generateCode() {
  return crypto.randomBytes(16).toString('hex');
}
