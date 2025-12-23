import { PrismaClient } from '@prisma/client';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import archiver from 'archiver';
import { Readable } from 'stream';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const pipeline = promisify(require('stream').pipeline);

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Supported export formats
const EXPORT_FORMATS = {
  JSON: 'json',
  CSV: 'csv',
  ZIP: 'zip',
  PDF: 'pdf',
};

/**
 * Generate a filename for the export
 * @param {string} format - Export format
 * @param {string} [prefix='content'] - Filename prefix
 * @returns {string} Generated filename
 */
function generateExportFilename(format, prefix = 'content') {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${prefix}-export-${timestamp}.${format}`;
}

/**
 * Export content to JSON format
 * @param {Array<string>} contentIds - Array of content IDs to export
 * @returns {Promise<{filename: string, stream: Readable, type: string}>} Export result
 */
async function exportToJson(contentIds) {
  const contents = await prisma.content.findMany({
    where: {
      id: { in: contentIds },
    },
    include: {
      topics: true,
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      updatedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  // Convert to JSON string with pretty printing
  const jsonString = JSON.stringify(contents, null, 2);
  const stream = new Readable();
  stream.push(jsonString);
  stream.push(null); // Signal end of stream

  return {
    filename: generateExportFilename('json'),
    stream,
    type: 'application/json',
  };
}

/**
 * Export content to CSV format
 * @param {Array<string>} contentIds - Array of content IDs to export
 * @returns {Promise<{filename: string, stream: Readable, type: string}>} Export result
 */
async function exportToCsv(contentIds) {
  const contents = await prisma.content.findMany({
    where: {
      id: { in: contentIds },
    },
    include: {
      topics: true,
      createdBy: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  // Flatten the data for CSV
  const rows = [
    [
      'ID',
      'Title',
      'Type',
      'Status',
      'Topics',
      'Created At',
      'Created By',
      'Updated At',
    ].join(','),
  ];

  for (const content of contents) {
    const topics = content.topics.map((t) => t.name).join('; ');
    const creator = content.createdBy ? `${content.createdBy.name} <${content.createdBy.email}>` : 'System';
    
    rows.push(
      [
        `"${content.id}"`,
        `"${content.title.replace(/"/g, '""')}"`,
        `"${content.type}"`,
        `"${content.status}"`,
        `"${topics}"`,
        `"${content.createdAt.toISOString()}"`,
        `"${creator}"`,
        `"${content.updatedAt.toISOString()}"`,
      ].join(',')
    );
  }

  const csvString = rows.join('\n');
  const stream = new Readable();
  stream.push(csvString);
  stream.push(null); // Signal end of stream

  return {
    filename: generateExportFilename('csv'),
    stream,
    type: 'text/csv',
  };
}

/**
 * Export content to a ZIP file with all associated files
 * @param {Array<string>} contentIds - Array of content IDs to export
 * @returns {Promise<{filename: string, stream: Readable, type: string}>} Export result
 */
async function exportToZip(contentIds) {
  const contents = await prisma.content.findMany({
    where: {
      id: { in: contentIds },
    },
    include: {
      topics: true,
      files: true,
    },
  });

  // Create a new archive
  const archive = archiver('zip', {
    zlib: { level: 9 }, // Maximum compression
  });

  // Add metadata file
  const metadata = {
    exportedAt: new Date().toISOString(),
    contentCount: contents.length,
    contents: contents.map((content) => ({
      id: content.id,
      title: content.title,
      type: content.type,
      status: content.status,
      topics: content.topics.map((t) => t.name),
      files: content.files.map((f) => ({
        id: f.id,
        filename: f.filename,
        mimeType: f.mimeType,
        size: f.size,
      })),
    })),
  };

  archive.append(JSON.stringify(metadata, null, 2), { name: 'metadata.json' });

  // Add each content item's files to the archive
  for (const content of contents) {
    const contentDir = `${content.id}_${content.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;
    
    // Add content metadata
    archive.append(JSON.stringify(content, null, 2), { 
      name: `${contentDir}/content.json` 
    });

    // Add files
    for (const file of content.files) {
      try {
        // Get signed URL for S3 file
        const command = new GetObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET,
          Key: file.s3Key,
        });
        
        const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        
        // Fetch the file and add it to the archive
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch file: ${file.filename}`);
        
        const buffer = await response.arrayBuffer();
        archive.append(Buffer.from(buffer), { 
          name: `${contentDir}/files/${file.filename}` 
        });
      } catch (error) {
        console.error(`Error adding file ${file.filename} to archive:`, error);
        // Add an error file instead
        archive.append(`Error: Could not include file: ${file.filename}\n${error.message}`, { 
          name: `${contentDir}/files/ERROR_${file.filename}.txt` 
        });
      }
    }
  }

  // Finalize the archive
  archive.finalize();

  return {
    filename: generateExportFilename('zip'),
    stream: archive,
    type: 'application/zip',
  };
}

/**
 * Export content to a specific format
 * @param {Array<string>} contentIds - Array of content IDs to export
 * @param {string} format - Export format (json, csv, zip, pdf)
 * @returns {Promise<{filename: string, stream: Readable, type: string}>} Export result
 */
export async function exportContent(contentIds, format = 'json') {
  if (!contentIds || !Array.isArray(contentIds) || contentIds.length === 0) {
    throw new Error('No content IDs provided for export');
  }

  switch (format.toLowerCase()) {
    case EXPORT_FORMATS.JSON:
      return exportToJson(contentIds);
    case EXPORT_FORMATS.CSV:
      return exportToCsv(contentIds);
    case EXPORT_FORMATS.ZIP:
      return exportToZip(contentIds);
    case EXPORT_FORMATS.PDF:
      // PDF export would be implemented here
      throw new Error('PDF export not yet implemented');
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

/**
 * Generate a temporary download link for exported content
 * @param {string} format - Export format
 * @param {Array<string>} contentIds - Array of content IDs to export
 * @returns {Promise<{url: string, expiresAt: Date}>} Temporary download link
 */
export async function generateExportLink(format, contentIds) {
  // In a real implementation, this would:
  // 1. Create a job in the database
  // 2. Process the export asynchronously
  // 3. Upload to S3 with a pre-signed URL
  // 4. Return the URL and expiration time
  
  // For now, we'll simulate this with a mock implementation
  return {
    url: `https://example.com/exports/${Date.now()}/content-export.${format}`,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
  };
}

/**
 * Get the status of an export job
 * @param {string} jobId - Export job ID
 * @returns {Promise<{status: string, progress: number, url?: string, expiresAt?: Date}>} Export status
 */
export async function getExportStatus(jobId) {
  // In a real implementation, this would check the status in the database
  // and return the current progress and download URL if complete
  
  // Mock implementation
  return {
    status: 'completed',
    progress: 100,
    url: `https://example.com/exports/${jobId}/content-export.zip`,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
  };
}
