import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Allowed file types and their corresponding content types
const ALLOWED_FILE_TYPES = {
  'application/pdf': 'pdf',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/x-msvideo': 'avi',
  'video/x-ms-wmv': 'wmv',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'text/markdown': 'md',
  'text/plain': 'txt',
};

// Maximum file size (50MB in bytes)
const MAX_FILE_SIZE = 50 * 1024 * 1024;

export async function POST(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const title = formData.get('title');
    const description = formData.get('description') || '';
    const topicId = formData.get('topicId');
    const contentType = formData.get('contentType') || 'document';
    const isFree = formData.get('isFree') === 'true';
    const duration = formData.get('duration') || null;
    const thumbnailUrl = formData.get('thumbnailUrl') || null;

    // Validate required fields
    if (!file || !title || !topicId) {
      return NextResponse.json(
        { error: 'File, title, and topicId are required' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES[file.type]) {
      return NextResponse.json(
        { error: 'File type not supported' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds maximum limit of 50MB' },
        { status: 400 }
      );
    }

    // Check if topic exists
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
    });

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      );
    }

    // Generate a unique file key
    const fileExtension = ALLOWED_FILE_TYPES[file.type];
    const fileKey = `content/${uuidv4()}.${fileExtension}`;

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload to S3
    const uploadParams = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: fileKey,
      Body: buffer,
      ContentType: file.type,
      Metadata: {
        'x-amz-meta-title': title,
        'x-amz-meta-uploaded-by': session.user.id,
      },
    };

    await s3Client.send(new PutObjectCommand(uploadParams));

    // Generate a signed URL for the uploaded file
    const getObjectParams = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: fileKey,
    };

    const fileUrl = await getSignedUrl(
      s3Client,
      new GetObjectCommand(getObjectParams),
      { expiresIn: 60 * 60 * 24 * 7 } // 7 days
    );

    // Save to database
    const contentItem = await prisma.contentItem.create({
      data: {
        title,
        description,
        url: fileUrl,
        type: contentType,
        isFree,
        duration: duration ? parseInt(duration) : null,
        thumbnailUrl,
        topic: {
          connect: { id: topicId },
        },
        uploadedBy: {
          connect: { id: session.user.id },
        },
        metadata: {
          originalName: file.name,
          size: file.size,
          mimeType: file.type,
          s3Key: fileKey,
        },
      },
      include: {
        topic: {
          select: {
            id: true,
            name: true,
            subject: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: contentItem,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // List all content items (for admin)
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const contentItems = await prisma.contentItem.findMany({
      include: {
        topic: {
          select: {
            id: true,
            name: true,
            subject: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: contentItems,
    });
  } catch (error) {
    console.error('Error fetching content items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content items' },
      { status: 500 }
    );
  }
}
