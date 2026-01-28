import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!supabase) {
      console.error('Missing Supabase Configuration');
      return NextResponse.json(
        { error: 'Server storage configuration missing' },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const type = formData.get('type') || 'documents';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Prepare Supabase Upload
    const fileExtension = file.name.split('.').pop();
    // Sanitize type to be safe for bucket/folder names
    const safeType = type.replace(/[^a-zA-Z0-9-_]/g, '');
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = `${safeType}/${fileName}`;

    // Existing bucket is likely 'content' based on other files
    const bucketName = 'content';

    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload
    const { data, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);

      // Use meaningful error message
      if (uploadError.message.includes('Bucket not found')) {
        throw new Error("Storage bucket 'content' not found. Please create it in Supabase.");
      }
      throw new Error(uploadError.message);
    }

    // Get Public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: `Upload failed: ${error.message}` },
      { status: 500 }
    );
  }
}
