import { describe, it, expect } from 'vitest';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';

describe('Cloudflare R2 Integration', () => {
  it('should validate R2 credentials and bucket access', async () => {
    const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
    const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
    const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME;

    // Verify all credentials are present
    expect(accountId).toBeDefined();
    expect(accessKeyId).toBeDefined();
    expect(secretAccessKey).toBeDefined();
    expect(bucketName).toBeDefined();

    // Create S3 client configured for Cloudflare R2
    const s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKeyId!,
        secretAccessKey: secretAccessKey!,
      },
    });

    try {
      // Test bucket access
      const command = new HeadBucketCommand({ Bucket: bucketName });
      await s3Client.send(command);
      
      console.log('✓ Cloudflare R2 credentials validated successfully');
      expect(true).toBe(true);
    } catch (error: any) {
      console.error('✗ Failed to validate R2 credentials:', error.message);
      throw new Error(`R2 credential validation failed: ${error.message}`);
    }
  });
});
