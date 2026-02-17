import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME!;

/**
 * Calculate storage cost based on file size
 * R2 pricing: $0.015 per GB per month
 * Add £2 minimum profit margin
 */
export function calculateStorageCost(fileSizeBytes: number): number {
  const fileSizeGB = fileSizeBytes / (1024 * 1024 * 1024);
  const r2CostPerGB = 0.015; // USD per GB per month
  const usdToGbp = 0.79; // Approximate conversion rate
  
  const monthlyCost = fileSizeGB * r2CostPerGB * usdToGbp;
  const minProfitMargin = 2; // £2 minimum profit
  
  // Price per GB per month with minimum profit
  const pricePerGB = Math.max(monthlyCost / fileSizeGB + minProfitMargin / fileSizeGB, 0.05);
  return parseFloat((fileSizeGB * pricePerGB).toFixed(2));
}

/**
 * Upload file to Cloudflare R2
 */
export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array | string,
  contentType: string = 'application/octet-stream'
): Promise<{ key: string; url: string; cost: number }> {
  const bodyBuffer = typeof body === 'string' ? Buffer.from(body) : Buffer.from(body);
  const cost = calculateStorageCost(bodyBuffer.length);

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: bodyBuffer,
    ContentType: contentType,
    Metadata: {
      'upload-cost': cost.toString(),
      'upload-date': new Date().toISOString(),
    },
  });

  await s3Client.send(command);

  const publicUrl = `https://${BUCKET_NAME}.r2.dev/${key}`;

  return {
    key,
    url: publicUrl,
    cost,
  };
}

/**
 * Get signed URL for file download (expires in 1 hour)
 */
export async function getDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Delete file from R2
 */
export async function deleteFromR2(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
}

/**
 * Get file metadata
 */
export async function getFileMetadata(key: string): Promise<{
  size: number;
  cost: number;
  uploadDate: string;
} | null> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const response = await s3Client.send(command);
    const size = response.ContentLength || 0;
    const cost = calculateStorageCost(size);
    const uploadDate = response.Metadata?.['upload-date'] || new Date().toISOString();

    return { size, cost, uploadDate };
  } catch (error) {
    console.error(`Failed to get metadata for ${key}:`, error);
    return null;
  }
}
