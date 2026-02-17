/**
 * Cloudflare R2 Storage - Pure HTTP/REST Implementation
 * No AWS SDK dependencies - uses native fetch API
 * All file operations use R2 exclusively
 */

const BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME || '';
const ACCOUNT_ID = process.env.CLOUDFLARE_R2_ACCOUNT_ID || '';
const ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '';
const SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '';

// R2 API endpoint
const R2_ENDPOINT = `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`;
const R2_PUBLIC_ENDPOINT = `https://${BUCKET_NAME}.r2.dev`;

/**
 * Calculate storage cost based on file size
 * R2 pricing: $0.015/GB per month
 * With £2 minimum profit margin
 */
export function calculateStorageCost(fileSizeBytes: number): number {
  const fileSizeGB = fileSizeBytes / (1024 * 1024 * 1024);
  const r2CostPerGB = 0.015; // USD per GB per month
  const usdToGbp = 0.79;
  const monthlyCost = fileSizeGB * r2CostPerGB * usdToGbp;
  const minProfitMargin = 2;
  
  // Ensure minimum profit of £2
  return Math.max(monthlyCost + minProfitMargin, 2.0);
}

/**
 * Upload file to R2 using HTTP PUT
 * @param relKey - Relative key path (e.g., "users/123/files/document.pdf")
 * @param data - File data as Buffer, Uint8Array, or string
 * @param contentType - MIME type of the file
 * @returns Object with key, url, and cost
 */
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = 'application/octet-stream'
): Promise<{ key: string; url: string; cost: number }> {
  try {
    if (!BUCKET_NAME || !ACCOUNT_ID || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY) {
      throw new Error('R2 credentials not configured. Set CLOUDFLARE_R2_* environment variables.');
    }

    const key = relKey.replace(/^\/+/, ''); // Normalize key
    const bodyBuffer = typeof data === 'string' ? Buffer.from(data) : Buffer.from(data);
    const cost = calculateStorageCost(bodyBuffer.length);

    const uploadUrl = `${R2_ENDPOINT}/${BUCKET_NAME}/${key}`;

    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${ACCESS_KEY_ID}:${SECRET_ACCESS_KEY}`,
        'Content-Type': contentType,
        'X-Amz-Meta-Upload-Cost': cost.toFixed(2),
        'X-Amz-Meta-Upload-Date': new Date().toISOString(),
      },
      body: bodyBuffer,
    });

    if (!response.ok) {
      throw new Error(`R2 upload failed: ${response.status} ${response.statusText}`);
    }

    const publicUrl = `${R2_PUBLIC_ENDPOINT}/${key}`;

    console.log(`[R2 Storage] Uploaded ${key} (${(bodyBuffer.length / 1024).toFixed(2)}KB) - Cost: £${cost.toFixed(2)}`);

    return {
      key,
      url: publicUrl,
      cost,
    };
  } catch (error) {
    console.error('[R2 Storage] Upload failed:', error);
    throw error;
  }
}

/**
 * Get download URL for R2 file
 * @param relKey - Relative key path
 * @returns Object with key and url
 */
export async function storageGet(
  relKey: string
): Promise<{ key: string; url: string }> {
  try {
    if (!BUCKET_NAME || !ACCOUNT_ID || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY) {
      throw new Error('R2 credentials not configured.');
    }

    const key = relKey.replace(/^\/+/, '');
    const publicUrl = `${R2_PUBLIC_ENDPOINT}/${key}`;

    console.log(`[R2 Storage] Generated URL for ${key}`);

    return { key, url: publicUrl };
  } catch (error) {
    console.error('[R2 Storage] Failed to generate URL:', error);
    throw error;
  }
}

/**
 * Delete file from R2 using HTTP DELETE
 * @param relKey - Relative key path
 */
export async function storageDelete(relKey: string): Promise<void> {
  try {
    if (!BUCKET_NAME || !ACCOUNT_ID || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY) {
      throw new Error('R2 credentials not configured.');
    }

    const key = relKey.replace(/^\/+/, '');
    const deleteUrl = `${R2_ENDPOINT}/${BUCKET_NAME}/${key}`;

    const response = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${ACCESS_KEY_ID}:${SECRET_ACCESS_KEY}`,
      },
    });

    if (!response.ok && response.status !== 404) {
      throw new Error(`R2 delete failed: ${response.status} ${response.statusText}`);
    }

    console.log(`[R2 Storage] Deleted ${key}`);
  } catch (error) {
    console.error('[R2 Storage] Delete failed:', error);
    throw error;
  }
}

/**
 * Check if file exists in R2 using HTTP HEAD
 * @param relKey - Relative key path
 * @returns true if file exists, false otherwise
 */
export async function storageExists(relKey: string): Promise<boolean> {
  try {
    if (!BUCKET_NAME || !ACCOUNT_ID || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY) {
      throw new Error('R2 credentials not configured.');
    }

    const key = relKey.replace(/^\/+/, '');
    const headUrl = `${R2_ENDPOINT}/${BUCKET_NAME}/${key}`;

    const response = await fetch(headUrl, {
      method: 'HEAD',
      headers: {
        'Authorization': `Bearer ${ACCESS_KEY_ID}:${SECRET_ACCESS_KEY}`,
      },
    });

    return response.ok;
  } catch (error) {
    console.error('[R2 Storage] Existence check failed:', error);
    return false;
  }
}

/**
 * Get file metadata from R2 using HTTP HEAD
 * @param relKey - Relative key path
 * @returns File metadata including size, content type, and upload date
 */
export async function storageGetMetadata(relKey: string): Promise<{
  key: string;
  size: number;
  contentType: string;
  uploadDate: string;
  cost: string;
}> {
  try {
    if (!BUCKET_NAME || !ACCOUNT_ID || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY) {
      throw new Error('R2 credentials not configured.');
    }

    const key = relKey.replace(/^\/+/, '');
    const headUrl = `${R2_ENDPOINT}/${BUCKET_NAME}/${key}`;

    const response = await fetch(headUrl, {
      method: 'HEAD',
      headers: {
        'Authorization': `Bearer ${ACCESS_KEY_ID}:${SECRET_ACCESS_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get metadata: ${response.status}`);
    }

    return {
      key,
      size: parseInt(response.headers.get('content-length') || '0', 10),
      contentType: response.headers.get('content-type') || 'application/octet-stream',
      uploadDate: response.headers.get('last-modified') || new Date().toISOString(),
      cost: response.headers.get('x-amz-meta-upload-cost') || '0.00',
    };
  } catch (error) {
    console.error('[R2 Storage] Metadata retrieval failed:', error);
    throw error;
  }
}

/**
 * Verify R2 connectivity and credentials
 */
export async function verifyStorageConnection(): Promise<boolean> {
  try {
    if (!BUCKET_NAME || !ACCOUNT_ID || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY) {
      console.error('[R2 Storage] R2 credentials not configured');
      return false;
    }

    const testUrl = `${R2_ENDPOINT}/${BUCKET_NAME}/.test-connection`;

    const response = await fetch(testUrl, {
      method: 'HEAD',
      headers: {
        'Authorization': `Bearer ${ACCESS_KEY_ID}:${SECRET_ACCESS_KEY}`,
      },
    });

    // 404 is okay - means bucket exists but file doesn't
    if (response.ok || response.status === 404) {
      console.log('[R2 Storage] R2 connection verified');
      return true;
    }

    throw new Error(`Connection verification failed: ${response.status}`);
  } catch (error) {
    console.error('[R2 Storage] Connection verification failed:', error);
    return false;
  }
}

/**
 * Calculate total storage cost for user
 * @param totalSizeBytes - Total file size in bytes
 * @returns Monthly cost in GBP
 */
export function calculateTotalStorageCost(totalSizeBytes: number): number {
  return calculateStorageCost(totalSizeBytes);
}

export default {
  storagePut,
  storageGet,
  storageDelete,
  storageExists,
  storageGetMetadata,
  verifyStorageConnection,
  calculateTotalStorageCost,
};
