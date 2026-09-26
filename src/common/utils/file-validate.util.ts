import { HttpException, HttpStatus } from '@nestjs/common';
import * as path from 'path';

export function validate(file: Express.Multer.File) {
  const { originalname, mimetype: mimeType, size } = file;
  const MB = 10;
  const MAX_FILE_SIZE = MB * 1024 * 1024;
  const ALLOWED_EXTENSIONS = [
    '.jpg',
    '.jpeg',
    '.png',
    '.pdf',
    '.xls',
    '.xlsx',
    '.csv',
    '.docx',
    '.mp4'
  ];
  if (
    !ALLOWED_EXTENSIONS.includes(path.parse(originalname).ext.toLowerCase())
  ) {
    throw new HttpException(
      `File type not allowed. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`,
      HttpStatus.BAD_REQUEST,
    );
  }

  if (size > MAX_FILE_SIZE) {
    throw new HttpException(
      `File size exceeds the allowed limit (${MB} MB)`,
      HttpStatus.BAD_REQUEST,
    );
  }
  return;
}
