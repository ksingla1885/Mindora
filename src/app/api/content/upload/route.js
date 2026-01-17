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
const MAX_FILE_SIZE = 50 * 1024 * 1024;
const BUCKET_NAME = 'content';

export async function POST(request) {
  try {
    console.log('🚀 Upload request received');

    // Check authentication
    const session = await auth();
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
    const className = formData.get('class');

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

    // Check if Topic Exists
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
    });

    if (!topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    // Check Supabase Client
    if (!supabase) {
      return NextResponse.json(
        { error: 'Server misconfiguration: Supabase client not initialized (missing keys).' },
        { status: 500 }
      );
    }

    // Ensure Bucket Exists (idempotent-ish)
    const { data: buckets } = await supabase.storage.listBuckets();
    if (!buckets?.find(b => b.name === BUCKET_NAME)) {
      await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: MAX_FILE_SIZE,
        allowedMimeTypes: Object.keys(ALLOWED_FILE_TYPES)
      });
    }

    // Generate path
    const fileExtension = ALLOWED_FILE_TYPES[file.type];
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = `${fileName}`;

    // Upload to Supabase
    const buffer = Buffer.from(await file.arrayBuffer());
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Supabase Upload Error:', uploadError);
      throw new Error(`Storage Error: ${uploadError.message}`);
    }

    // Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    // Create Slug from Title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') + '-' + uuidv4().slice(0, 8);


    console.log('✅ File uploaded to Supabase successfully');
    console.log('📝 Creating database record...');

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
          originalName: file.name,
          size: file.size,
          mimeType: file.type,
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
    console.error('Upload handler error:', error);
    return NextResponse.json(
      {
        error: 'Failed to upload file',
        details: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}
