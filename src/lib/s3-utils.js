import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

// Generate a unique file name
export const generateFileName = (bytes = 32) => {
  return crypto.randomBytes(bytes).toString('hex');
};

// Upload file to S3
export const uploadFile = async (file, folder = 'uploads') => {
  const fileName = generateFileName();
  const fileExt = file.name.split('.').pop();
  const key = `${folder}/${fileName}.${fileExt}`;
  
  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
    Body: await file.arrayBuffer(),
    ContentType: file.type,
  };

  await s3Client.send(new PutObjectCommand(params));
  
  return {
    key,
    url: `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
  };
};

// Generate a signed URL for private files
export const getSignedFileUrl = async (key, expiresIn = 3600) => {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
};

// Delete file from S3
export const deleteFile = async (key) => {
  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
  };

  await s3Client.send(new DeleteObjectCommand(params));
  return true;
};

// Get file type from MIME type
export const getFileType = (mimeType) => {
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.startsWith('image/')) return 'image';
  return 'file';
};
