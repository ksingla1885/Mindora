import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Generate a presigned URL for upload
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { fileName, fileType, folder = 'videos' } = await request.json();
    
    if (!fileName || !fileType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate a unique key for the file
    const fileKey = `${folder}/${Date.now()}-${fileName.replace(/\s+/g, '-').toLowerCase()}`;
    
    // Create a command to put an object in S3
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: fileKey,
      ContentType: fileType,
      ACL: 'private', // Make the file private
      Metadata: {
        uploadedBy: session.user.id,
        originalName: fileName,
      },
    });

    // Generate a presigned URL
    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    // Return the presigned URL and file key
    return NextResponse.json({
      presignedUrl,
      fileKey,
    });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}

// Generate a presigned URL for viewing
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileKey = searchParams.get('fileKey');
    
    if (!fileKey) {
      return NextResponse.json(
        { error: 'File key is required' },
        { status: 400 }
      );
    }

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: fileKey,
    });

    // Generate a presigned URL that expires in 1 hour
    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    return NextResponse.json({ url: presignedUrl });
  } catch (error) {
    console.error('Error generating view URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate view URL' },
      { status: 500 }
    );
  }
}
