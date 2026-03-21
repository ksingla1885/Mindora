import { PrismaClient } from '@prisma/client';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const prisma = new PrismaClient();


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
  const contents = await prisma.contentItem.findMany({
    where: { id: { in: contentIds } },
  });

  const jsonString = JSON.stringify(contents, null, 2);
  const buffer = Buffer.from(jsonString, 'utf-8');

  return {
    filename: generateExportFilename('json'),
    buffer,
    type: 'application/json',
  };
}

/**
 * Export content to CSV format
 * @param {Array<string>} contentIds - Array of content IDs to export
 * @returns {Promise<{filename: string, stream: Readable, type: string}>} Export result
 */
async function exportToCsv(contentIds) {
  const contents = await prisma.contentItem.findMany({
    where: { id: { in: contentIds } },
  });

  const rows = [['ID','Title','Type','Status','Created At'].join(',')];
  for (const c of contents) {
    rows.push([
      `"${c.id}"`,
      `"${(c.title || '').replace(/"/g, '""')}"`,
      `"${c.type || ''}"`,
      `"${c.status || ''}"`,
      `"${c.createdAt?.toISOString() || ''}"`,
    ].join(','));
  }

  const buffer = Buffer.from(rows.join('\n'), 'utf-8');
  return {
    filename: generateExportFilename('csv'),
    buffer,
    type: 'text/csv',
  };
}

/**
 * Export content to a ZIP file with all associated files
 * @param {Array<string>} contentIds - Array of content IDs to export
 * @returns {Promise<{filename: string, stream: Readable, type: string}>} Export result
 */
// ZIP export requires Node.js streams (archiver) — not supported on Vercel serverless.
// Falls back to JSON export.
async function exportToZip(contentIds) {
  console.warn('[content-export-utils] ZIP export not supported on serverless. Falling back to JSON.');
  return exportToJson(contentIds);
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
