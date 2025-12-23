import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function uploadFileToS3(
  file: Buffer,
  fileName: string,
  contentType: string
): Promise<string> {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: fileName,
    Body: file,
    ContentType: contentType,
  };

  await s3Client.send(new PutObjectCommand(params));
  return fileName;
}

export async function getSignedFileUrl(fileName: string): Promise<string> {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: fileName,
  };

  const command = new GetObjectCommand(params);
  return getSignedUrl(s3Client, command, { expiresIn: 3600 }); // URL expires in 1 hour
}

export async function deleteFileFromS3(fileName: string): Promise<void> {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: fileName,
  };

  await s3Client.send(new DeleteObjectCommand(params));
}
