import { createHash } from 'crypto';
import { extname } from 'path';
import { promisify } from 'util';
import { pipeline } from 'stream';
import { createWriteStream, unlink } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { fileTypeFromFile } from 'file-type';
import { PrismaClient } from '@prisma/client';

const pipelineAsync = promisify(pipeline);
const unlinkAsync = promisify(unlink);
const prisma = new PrismaClient();

// Allowed file types with MIME types and extensions
const ALLOWED_FILE_TYPES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-powerpoint': '.ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
};

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// File type categories
const FILE_CATEGORIES = {
  IMAGE: ['image/jpeg', 'image/png'],
  DOCUMENT: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
};

/**
 * Validate file before processing
 * @param {Object} file - Multer file object
 * @returns {Promise<{valid: boolean, error?: string}>}
 */
async function validateFile(file) {
  try {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: 'File size exceeds the maximum limit of 10MB' };
    }

    // Check file extension
    const ext = extname(file.originalname).toLowerCase();
    if (!Object.values(ALLOWED_FILE_TYPES).includes(ext)) {
      return { valid: false, error: 'File type not allowed' };
    }

    // Check MIME type using file-type
    const fileType = await fileTypeFromFile(file.path);
    if (!fileType || !ALLOWED_FILE_TYPES[fileType.mime]) {
      return { valid: false, error: 'Invalid file type' };
    }

    // Verify extension matches MIME type
    if (ALLOWED_FILE_TYPES[fileType.mime] !== ext) {
      return { 
        valid: false, 
        error: `File extension does not match its content type. Expected ${ALLOWED_FILE_TYPES[fileType.mime]}` 
      };
    }

    // Additional security checks for images
    if (FILE_CATEGORIES.IMAGE.includes(fileType.mime)) {
      // TODO: Add image validation (dimensions, EXIF data stripping, etc.)
    }

    // Additional security checks for documents
    if (FILE_CATEGORIES.DOCUMENT.includes(fileType.mime)) {
      // TODO: Add document validation (macro scanning, etc.)
    }

    return { valid: true };
  } catch (error) {
    console.error('File validation error:', error);
    return { valid: false, error: 'Error validating file' };
  }
}

/**
 * Generate a secure filename
 * @param {string} originalname - Original filename
 * @param {string} mimeType - File MIME type
 * @returns {string} Secure filename
 */
function generateSecureFilename(originalname, mimeType) {
  const ext = ALLOWED_FILE_TYPES[mimeType] || extname(originalname) || '';
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${randomString}${ext}`;
}

/**
 * Calculate file hash
 * @param {Buffer} buffer - File buffer
 * @returns {Promise<string>} File hash
 */
async function calculateFileHash(buffer) {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    hash.on('error', reject);
    hash.on('readable', () => {
      const data = hash.read();
      if (data) {
        resolve(data.toString('hex'));
      }
    });
    hash.write(buffer);
    hash.end();
  });
}

/**
 * Check for duplicate files using hash
 * @param {string} hash - File hash
 * @returns {Promise<boolean>} True if duplicate exists
 */
async function isDuplicateFile(hash) {
  const existingFile = await prisma.file.findFirst({
    where: { hash },
    select: { id: true },
  });
  return !!existingFile;
}

/**
 * File upload middleware with security validations
 * @param {Object} options - Upload options
 * @returns {Function} Express middleware
 */
const secureUpload = (options = {}) => {
  const { 
    fieldName = 'file', 
    maxCount = 1,
    allowedTypes = Object.keys(ALLOWED_FILE_TYPES),
    maxSize = MAX_FILE_SIZE,
  } = options;

  return async (req, res, next) => {
    try {
      if (!req.files || !req.files[fieldName]) {
        return res.status(400).json({ error: 'No files were uploaded' });
      }

      const files = Array.isArray(req.files[fieldName]) 
        ? req.files[fieldName] 
        : [req.files[fieldName]];

      // Check file count
      if (files.length > maxCount) {
        return res.status(400).json({ 
          error: `Maximum ${maxCount} file(s) allowed` 
        });
      }

      const processedFiles = [];
      const errors = [];

      // Process each file
      for (const file of files) {
        try {
          // Validate file
          const validation = await validateFile(file);
          if (!validation.valid) {
            errors.push(`File ${file.originalname}: ${validation.error}`);
            await unlinkAsync(file.path).catch(console.error);
            continue;
          }

          // Calculate file hash
          const fileBuffer = await promisify(file.buffer);
          const fileHash = await calculateFileHash(fileBuffer);

          // Check for duplicates
          if (await isDuplicateFile(fileHash)) {
            errors.push(`File ${file.originalname}: Duplicate file detected`);
            await unlinkAsync(file.path).catch(console.error);
            continue;
          }

          // Generate secure filename
          const secureFilename = generateSecureFilename(
            file.originalname,
            file.mimetype
          );

          // Save file to storage (e.g., S3, local filesystem)
          // This is a simplified example - in production, use a proper storage service
          const filePath = `/uploads/${secureFilename}`;
          await pipelineAsync(
            file.stream,
            createWriteStream(`./public${filePath}`)
          );

          // Add to processed files
          processedFiles.push({
            originalname: file.originalname,
            filename: secureFilename,
            path: filePath,
            size: file.size,
            mimetype: file.mimetype,
            hash: fileHash,
          });

        } catch (error) {
          console.error(`Error processing file ${file.originalname}:`, error);
          errors.push(`Error processing ${file.originalname}`);
          await unlinkAsync(file.path).catch(console.error);
        }
      }

      // If all files failed validation
      if (processedFiles.length === 0 && errors.length > 0) {
        return res.status(400).json({ 
          error: 'File upload failed',
          details: errors 
        });
      }

      // Attach processed files to request
      req.processedFiles = processedFiles;
      
      // If there were some errors but some files were processed successfully
      if (errors.length > 0) {
        req.fileUploadWarnings = errors;
      }

      next();
    } catch (error) {
      console.error('File upload error:', error);
      res.status(500).json({ 
        error: 'An error occurred during file upload',
        details: error.message 
      });
    }
  };
};

export default secureUpload;
