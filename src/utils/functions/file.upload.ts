import { HttpException, HttpStatus } from '@nestjs/common';
import logger from '../logger';
import { S3 } from 'aws-sdk';
import { Express } from 'express';

const fs = require('fs');
const path = require('path');

export async function uploadFile(file: Express.Multer.File) {
  try {
    logger.info('-----FILES.SERVICE.UPLOADFILES-----id : ----INIT');
    if (file.size > 200000000)
      throw new HttpException(
        'La taille de fichier autorisée est de 200Mo maximum',
        HttpStatus.BAD_REQUEST,
      );

    const s3 = getS3();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);

    // Récupérer l'extension du fichier original
    let fileExtension = path.extname(file['originalname']).toLowerCase();
    // Enlever le point de l'extension
    if (fileExtension.startsWith('.')) {
      fileExtension = fileExtension.substring(1);
    }

    // Si pas d'extension, essayer de détecter depuis le mimetype ou utiliser 'bin'
    if (!fileExtension) {
      if (file.mimetype) {
        const mimeToExt: Record<string, string> = {
          'image/jpeg': 'jpg',
          'image/jpg': 'jpg',
          'image/png': 'png',
          'image/webp': 'webp',
          'application/pdf': 'pdf',
          'application/msword': 'doc',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
            'docx',
          'application/vnd.ms-excel': 'xls',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
            'xlsx',
        };
        fileExtension = mimeToExt[file.mimetype] || 'bin';
      } else {
        fileExtension = 'bin';
    }
    }

    const fileBuffer = fs.readFileSync(file.path);
    const uploadResult = await s3
      .upload({
        ACL: 'public-read',
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Body: fileBuffer,
        Key: `${uniqueSuffix}.${fileExtension}`,
      })
      .promise();
    deleteFileAfterSaveOnS3Bucket(file);
    return uploadResult.Location;
  } catch (error) {
    logger.error(`-----FILES.SERVICE.UPLOADFILES-----error : ----${error}`);
    throw new HttpException(error.message, error.status);
  }
}

function getS3() {
  return new S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  });
}

async function deleteFileAfterSaveOnS3Bucket(file) {
  await fs.unlink(file.path, (err) => {
    if (err)
      logger.info('--- deleteFileAfterSaveOnS3Bucket - erro delete file');
    else {
      logger.info('--- deleteFileAfterSaveOnS3Bucket - deleted successfully');
    }
  });
}
