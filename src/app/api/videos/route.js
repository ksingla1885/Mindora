import { S3Client, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Get list of videos
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get videos from database
    const videos = await prisma.video.findMany({
      where: {
        uploadedById: session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(videos);
  } catch (error) {
    console.error('Error fetching videos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    );
  }
}

// Create a new video record
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await request.json();
    
    // Create video record in database
    const video = await prisma.video.create({
      data: {
        title: data.title,
        description: data.description,
        fileKey: data.fileKey,
        thumbnailKey: data.thumbnailKey,
        duration: data.duration,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        isPublic: data.isPublic || false,
        uploadedById: session.user.id,
        metadata: data.metadata || {},
      },
    });

    return NextResponse.json(video);
  } catch (error) {
    console.error('Error creating video:', error);
    return NextResponse.json(
      { error: 'Failed to create video' },
      { status: 500 }
    );
  }
}

// Delete a video
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400 }
      );
    }

    // Get video from database
    const video = await prisma.video.findUnique({
      where: { id },
    });

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    // Check if user has permission to delete
    if (video.uploadedById !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Delete from S3
    try {
      const deleteParams = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: video.fileKey,
      };
      
      await s3Client.send(new DeleteObjectCommand(deleteParams));
      
      // Delete thumbnail if exists
      if (video.thumbnailKey) {
        const deleteThumbnailParams = {
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Key: video.thumbnailKey,
        };
        await s3Client.send(new DeleteObjectCommand(deleteThumbnailParams));
      }
    } catch (s3Error) {
      console.error('Error deleting from S3:', s3Error);
      // Continue to delete from database even if S3 delete fails
    }

    // Delete from database
    await prisma.video.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting video:', error);
    return NextResponse.json(
      { error: 'Failed to delete video' },
      { status: 500 }
    );
  }
}
