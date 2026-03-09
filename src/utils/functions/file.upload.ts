import { HttpException, HttpStatus } from '@nestjs/common';
import logger from '../logger';
import { S3 } from 'aws-sdk';
import { Express } from 'express';

const fs = require('fs');
const path = require('path');

export async function uploadFile(file: Express.Multer.File) {
  try {
    logger.info('-----FILES.SERVICE.UPLOADFILES-----id : ----INIT');
    if (file.size > 70000000)
      throw new HttpException(
        'La taille de fichier autorisée est de 70Mo maximum',
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

// ----- minioUploadFile (MinIO S3-compatible, bucket esinteb) -----

function getMinioS3(): S3 {
  const endpoint = process.env.MINIO_ENDPOINT;
  return new S3({
    endpoint,
    accessKeyId: process.env.MINIO_ACCESS_KEY_ID,
    secretAccessKey: process.env.MINIO_SECRET_ACCESS_KEY,
    region: process.env.MINIO_REGION || 'us-east-1',
    s3ForcePathStyle: true,
    signatureVersion: 'v4',
  });
}

export async function minioUploadFile(
  file: Express.Multer.File,
): Promise<string> {
  try {
    logger.info('-----FILES.SERVICE.MINIO_UPLOAD-----INIT');
    if (file.size > 70000000)
      throw new HttpException(
        'La taille de fichier autorisée est de 70Mo maximum',
        HttpStatus.BAD_REQUEST,
      );

    const s3 = getMinioS3();
    const bucket = process.env.MINIO_BUCKET;
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);

    let fileExtension = path.extname(file['originalname']).toLowerCase();
    if (fileExtension.startsWith('.')) {
      fileExtension = fileExtension.substring(1);
    }
    if (!fileExtension) {
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
      fileExtension = (file.mimetype && mimeToExt[file.mimetype]) || 'bin';
    }

    const key = `${uniqueSuffix}.${fileExtension}`;
    const fileBuffer = fs.readFileSync(file.path);

    await s3
      .putObject({
        Bucket: bucket,
        Body: fileBuffer,
        Key: key,
        ContentType: file.mimetype || 'application/octet-stream',
      })
      .promise();

    deleteFileAfterSaveOnS3Bucket(file);

    const baseUrl = process.env.MINIO_URL || `${process.env.MINIO_ENDPOINT}/${bucket}`;
    const publicUrl = `${baseUrl}/${key}`;
    logger.info(`-----FILES.SERVICE.MINIO_UPLOAD-----SUCCESS url=${publicUrl}`);
    return publicUrl;
  } catch (error: any) {
    logger.error(
      `-----FILES.SERVICE.MINIO_UPLOAD-----error : ----${error?.message}`,
    );
    if (error instanceof HttpException) throw error;
    throw new HttpException(
      error?.message || 'Erreur upload MinIO',
      error?.status || HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
