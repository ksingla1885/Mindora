import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { auth } from '@/auth';
import { supabase } from '@/lib/supabase';

// Allowed file types
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

// Maximum file size (50MB)
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const BUCKET_NAME = 'content';

export async function POST(request) {
  try {
    console.log('🚀 Upload/Create request received');

    // Check authentication
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const contentTypeHeader = request.headers.get('content-type') || '';

    let title, description, topicId, contentType, isFree, duration, thumbnailUrl, className;
    let publicUrl, slug, originalName, fileSize, mimeType, bucketName, filePath;

    // Handle JSON (Client-side Upload)
    if (contentTypeHeader.includes('application/json')) {
      const body = await request.json();
      title = body.title;
      description = body.description || '';
      topicId = body.topicId;
      contentType = body.contentType || 'document';
      isFree = body.isFree;
      duration = body.duration;
      thumbnailUrl = body.thumbnailUrl;
      className = body.class;

      // Upload details passed from client
      publicUrl = body.url;
      originalName = body.originalName;
      fileSize = body.size;
      mimeType = body.mimeType;
      bucketName = body.bucket || BUCKET_NAME;
      filePath = body.path;

      if (!title || !topicId || !publicUrl) {
        return NextResponse.json(
          { error: 'Title, topicId, and URL are required' },
          { status: 400 }
        );
      }

      // Generate Slug
      slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') + '-' + uuidv4().slice(0, 8);

    } else {
      // Handle Multipart (Server-side Upload - Legacy/Fallback)
      const formData = await request.formData();
      const file = formData.get('file');

      // ... (Existing variables extraction)
      title = formData.get('title');
      description = formData.get('description') || '';
      topicId = formData.get('topicId');
      contentType = formData.get('contentType') || 'document';
      isFree = formData.get('isFree') === 'true';
      duration = formData.get('duration') || null;
      thumbnailUrl = formData.get('thumbnailUrl') || null;
      className = formData.get('class');

      // ... (Existing validation)
      if (!file || !title || !topicId) {
        return NextResponse.json(
          { error: 'File, title, and topicId are required' },
          { status: 400 }
        );
      }

      // ... (Existing file validations and upload logic)
      // Check Supabase Client (Server)
      if (!supabase) {
        return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
      }

      const fileExtension = ALLOWED_FILE_TYPES[file.type];
      if (!fileExtension) return NextResponse.json({ error: 'File type not supported' }, { status: 400 });
      if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'File too large' }, { status: 400 });

      const fileName = `${uuidv4()}.${fileExtension}`;
      filePath = fileName;
      bucketName = BUCKET_NAME;

      // Ensure Bucket
      const { data: buckets } = await supabase.storage.listBuckets();
      if (!buckets?.find(b => b.name === BUCKET_NAME)) {
        await supabase.storage.createBucket(BUCKET_NAME, { public: true, fileSizeLimit: MAX_FILE_SIZE, allowedMimeTypes: Object.keys(ALLOWED_FILE_TYPES) });
      }

      // Upload
      const buffer = Buffer.from(await file.arrayBuffer());
      const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(filePath, buffer, { contentType: file.type, upsert: false });
      if (uploadError) throw new Error(`Storage Error: ${uploadError.message}`);

      const { data: { publicUrl: url } } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
      publicUrl = url;
      originalName = file.name;
      fileSize = file.size;
      mimeType = file.type;

      slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + uuidv4().slice(0, 8);
    }

    console.log('✅ Upload processed/verified. Creating DB record...');

    // Verify user exists before creating content
    const userExists = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true }
    });

    if (!userExists) {
      console.error('❌ User not found:', session.user.id);
      throw new Error('User account not found. Please log in again.');
    }

    console.log('✅ User verified:', session.user.id);

    // Save to database
    const contentItem = await prisma.contentItem.create({
      data: {
        title,
        slug,
        description,
        url: publicUrl,
        type: contentType,
        provider: 'supabase',
        topic: {
          connect: { id: topicId },
        },
        creator: {
          connect: { id: session.user.id },
        },
        metadata: {
          isFree: isFree, // Stored here instead
          duration: duration ? parseInt(duration) : null,
          thumbnailUrl: thumbnailUrl,
          originalName: originalName,
          size: fileSize,
          mimeType: mimeType,
          bucket: BUCKET_NAME,
          path: filePath,
          ...(className && { class: className }),
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

    console.log('✅ Database record created successfully');

    return NextResponse.json({
      success: true,
      data: contentItem,
    });

  } catch (error) {
    console.error('❌ Upload handler error:', error);

    // Determine status code
    const status = error.message === 'Unauthorized' ? 401 :
      error.message?.includes('File size') ? 400 :
        500;

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'An unexpected error occurred during upload.',
        details: typeof error === 'object' ? JSON.stringify(error, Object.getOwnPropertyNames(error)) : String(error),
      },
      { status }
    );
  }
}
