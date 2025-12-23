import { S3Client, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, AbortMultipartUploadCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import path from 'path';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;
const UPLOAD_EXPIRY = 60 * 60; // 1 hour

// Track multipart uploads
const activeUploads = new Map();

// Allowed file types and their corresponding content types
const ALLOWED_FILE_TYPES = {
  // Video
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
  'video/x-msvideo': 'avi',
  'video/x-ms-wmv': 'wmv',
  
  // Documents
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'text/plain': 'txt',
  'application/json': 'json',
  
  // Images
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
};

// Maximum file size (5GB in bytes)
const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024;

// Helper to get file extension
const getFileExtension = (filename) => {
  return path.extname(filename).toLowerCase().substring(1);
};

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

    const { filename, fileType, fileSize, chunkIndex, totalChunks, uploadId, parts } = await request.json();

    // Validate file type
    if (!ALLOWED_FILE_TYPES[fileType]) {
      return NextResponse.json(
        { error: 'File type not supported' },
        { status: 400 }
      );
    }

    // Validate file size
    if (fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds maximum limit of 5GB' },
        { status: 400 }
      );
    }

    // Generate a unique file key with original extension
    const fileExtension = getFileExtension(filename) || ALLOWED_FILE_TYPES[fileType];
    const fileKey = `uploads/${uuidv4()}.${fileExtension}`;

    // Initialize a new multipart upload if this is the first chunk
    if (!uploadId) {
      const createUploadCommand = new CreateMultipartUploadCommand({
        Bucket: BUCKET_NAME,
        Key: fileKey,
        ContentType: fileType,
        Metadata: {
          originalName: filename,
          uploadedBy: session.user.id,
        },
      });

      const { UploadId } = await s3Client.send(createUploadCommand);
      
      // Store the upload ID and other metadata
      activeUploads.set(UploadId, {
        fileKey,
        fileType,
        parts: [],
        createdAt: new Date().toISOString(),
      });

      // Generate a signed URL for the first chunk
      const uploadPartCommand = new UploadPartCommand({
        Bucket: BUCKET_NAME,
        Key: fileKey,
        UploadId: UploadId,
        PartNumber: 1,
      });

      const uploadUrl = await getSignedUrl(s3Client, uploadPartCommand, { expiresIn: UPLOAD_EXPIRY });

      return NextResponse.json({
        uploadId: UploadId,
        fileKey,
        uploadUrl,
        chunkIndex: 0,
      });
    }

    // For subsequent chunks, generate signed URLs
    const uploadPartCommand = new UploadPartCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
      UploadId: uploadId,
      PartNumber: chunkIndex + 1,
    });

    const uploadUrl = await getSignedUrl(s3Client, uploadPartCommand, { expiresIn: UPLOAD_EXPIRY });

    // If this is the last chunk, prepare to complete the upload
    if (chunkIndex === totalChunks - 1) {
      return NextResponse.json({
        uploadId,
        fileKey,
        uploadUrl,
        chunkIndex,
        isComplete: true,
        parts: parts.map((part, index) => ({
          PartNumber: index + 1,
          ETag: part.etag,
        })),
      });
    }

    return NextResponse.json({
      uploadId,
      fileKey,
      uploadUrl,
      chunkIndex,
    });
  } catch (error) {
    console.error('Chunked upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process chunked upload', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { uploadId, fileKey, parts, title, description, topicId, isFree } = await request.json();

    // Complete the multipart upload
    const completeCommand = new CompleteMultipartUploadCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts,
      },
    });

    const { Location, Bucket, Key } = await s3Client.send(completeCommand);
    
    // Create a record in the database
    const content = await prisma.contentItem.create({
      data: {
        title: title || path.basename(fileKey),
        description: description || '',
        type: 'video', // You might want to detect this based on file type
        url: Location,
        thumbnailUrl: '', // You can generate a thumbnail here
        duration: 0, // You can extract duration from the video
        size: 0, // You can get this from the upload
        isFree: isFree || false,
        topicId: topicId,
        uploadedById: session.user.id,
      },
    });

    // Clean up
    activeUploads.delete(uploadId);

    return NextResponse.json({
      success: true,
      content,
      location: Location,
    });
  } catch (error) {
    console.error('Error completing upload:', error);
    
    // Attempt to abort the upload on error
    try {
      const { uploadId, fileKey } = await request.json();
      if (uploadId && fileKey) {
        const abortCommand = new AbortMultipartUploadCommand({
          Bucket: BUCKET_NAME,
          Key: fileKey,
          UploadId: uploadId,
        });
        await s3Client.send(abortCommand);
      }
    } catch (abortError) {
      console.error('Error aborting failed upload:', abortError);
    }

    return NextResponse.json(
      { error: 'Failed to complete upload', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { uploadId, fileKey } = await request.json();

    // Abort the multipart upload
    const abortCommand = new AbortMultipartUploadCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
      UploadId: uploadId,
    });

    await s3Client.send(abortCommand);
    activeUploads.delete(uploadId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error aborting upload:', error);
    return NextResponse.json(
      { error: 'Failed to abort upload', details: error.message },
      { status: 500 }
    );
  }
}
