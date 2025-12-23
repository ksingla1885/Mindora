import { S3Client, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createWriteStream, unlink } from 'fs';
import { promisify } from 'util';
import { spawn } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
ffmpeg.setFfmpegPath(ffmpegPath);

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;
const unlinkAsync = promisify(unlink);

// Generate thumbnail from video
const generateVideoThumbnail = async (inputPath, outputPath, time = '00:00:01') => {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .screenshots({
        timestamps: [time],
        folder: path.dirname(outputPath),
        filename: path.basename(outputPath),
        size: '640x360',
      })
      .on('end', () => resolve(outputPath))
      .on('error', (err) => reject(err));
  });
};

// Extract video metadata
export const extractVideoMetadata = async (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      
      const videoStream = metadata.streams.find(s => s.codec_type === 'video');
      const audioStream = metadata.streams.find(s => s.codec_type === 'audio');
      
      resolve({
        duration: metadata.format.duration,
        format: path.extname(filePath).toLowerCase().substring(1),
        size: metadata.format.size,
        video: videoStream ? {
          codec: videoStream.codec_name,
          width: videoStream.width,
          height: videoStream.height,
          aspectRatio: videoStream.display_aspect_ratio,
          bitrate: videoStream.bit_rate,
          fps: videoStream.avg_frame_rate,
        } : null,
        audio: audioStream ? {
          codec: audioStream.codec_name,
          channels: audioStream.channels,
          sampleRate: audioStream.sample_rate,
          bitrate: audioStream.bit_rate,
        } : null,
      });
    });
  });
};

// Process and optimize image
const processImage = async (inputPath, outputPath, options = {}) => {
  const { width, height, quality = 80 } = options;
  
  let image = sharp(inputPath);
  
  if (width || height) {
    image = image.resize(width, height, {
      fit: 'inside',
      withoutEnlargement: true,
    });
  }
  
  // Convert to webp if not already
  if (!outputPath.endsWith('.webp')) {
    outputPath = outputPath.replace(/\.[^/.]+$/, '.webp');
  }
  
  await image.webp({ quality }).toFile(outputPath);
  return outputPath;
};

// Upload file to S3
const uploadToS3 = async (filePath, key, contentType) => {
  const fileStream = createReadStream(filePath);
  
  const uploadParams = {
    Bucket: BUCKET_NAME,
    Key: key,
    Body: fileStream,
    ContentType: contentType,
  };
  
  try {
    await s3Client.send(new PutObjectCommand(uploadParams));
    return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw error;
  }
};

// Process uploaded file
export const processUploadedFile = async (file, userId, options = {}) => {
  const { generateThumbnail = true, optimize = true } = options;
  const fileExt = path.extname(file.originalname).toLowerCase();
  const fileId = uuidv4();
  const fileKey = `uploads/${userId}/${fileId}${fileExt}`;
  
  try {
    // 1. Upload original file
    const fileUrl = await uploadToS3(file.path, fileKey, file.mimetype);
    
    let thumbnailUrl = null;
    let metadata = {};
    
    // 2. Process based on file type
    if (file.mimetype.startsWith('video/')) {
      // Extract video metadata
      metadata = await extractVideoMetadata(file.path);
      
      // Generate thumbnail
      if (generateThumbnail) {
        const thumbPath = `/tmp/${fileId}-thumb.jpg`;
        await generateVideoThumbnail(file.path, thumbPath);
        
        // Upload thumbnail
        const thumbKey = `thumbnails/${userId}/${fileId}.jpg`;
        thumbnailUrl = await uploadToS3(thumbPath, thumbKey, 'image/jpeg');
        
        // Clean up
        await unlinkAsync(thumbPath);
      }
    } else if (file.mimetype.startsWith('image/') && optimize) {
      // Process image
      const optimizedPath = `/tmp/${fileId}-optimized.webp`;
      const processedPath = await processImage(file.path, optimizedPath, {
        width: 1920,
        quality: 85,
      });
      
      // Upload optimized version
      const optimizedKey = `optimized/${userId}/${fileId}.webp`;
      const optimizedUrl = await uploadToS3(processedPath, optimizedKey, 'image/webp');
      
      // Update file URL to use optimized version
      fileUrl = optimizedUrl;
      
      // Generate thumbnail
      const thumbPath = `/tmp/${fileId}-thumb.jpg`;
      await sharp(processedPath)
        .resize(320, 180, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toFile(thumbPath);
      
      const thumbKey = `thumbnails/${userId}/${fileId}.jpg`;
      thumbnailUrl = await uploadToS3(thumbPath, thumbKey, 'image/jpeg');
      
      // Clean up
      await Promise.all([
        unlinkAsync(processedPath),
        unlinkAsync(thumbPath)
      ]);
    }
    
    // 3. Save to database
    const fileRecord = await prisma.file.create({
      data: {
        id: fileId,
        name: file.originalname,
        url: fileUrl,
        thumbnailUrl,
        mimeType: file.mimetype,
        size: file.size,
        metadata: metadata,
        userId: userId,
      },
    });
    
    return fileRecord;
    
  } catch (error) {
    console.error('Error processing file:', error);
    throw error;
  } finally {
    // Clean up temp file
    if (file.path) {
      await unlinkAsync(file.path).catch(console.error);
    }
  }
};

// Generate signed URL for private files
export const getSignedFileUrl = async (fileKey, expiresIn = 3600) => {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileKey,
  });
  
  return getSignedUrl(s3Client, command, { expiresIn });
};

// Check if file exists in S3
export const fileExists = async (fileKey) => {
  try {
    await s3Client.send(
      new HeadObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileKey,
      })
    );
    return true;
  } catch (error) {
    if (error.name === 'NotFound') {
      return false;
    }
    throw error;
  }
};
