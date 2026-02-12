// Manus File API integration for large file uploads
// Uses presigned URLs to upload directly to S3

import { ENV } from './_core/env';

interface CreateFileResponse {
  id: string;
  object: string;
  filename: string;
  status: string;
  upload_url: string;
  upload_expires_at: string;
  created_at: string;
}

/**
 * Create a file record and get presigned upload URL
 * This allows direct upload to S3 without going through our server
 */
export async function createManusFile(filename: string): Promise<CreateFileResponse> {
  const apiUrl = ENV.forgeApiUrl?.replace(/\/+$/, '');
  const apiKey = ENV.forgeApiKey;

  if (!apiUrl || !apiKey) {
    throw new Error('Manus API credentials not configured');
  }

  // The Manus API endpoint is at api.manus.ai, not the forge API URL
  const manusApiUrl = 'https://api.manus.ai';
  
  const response = await fetch(`${manusApiUrl}/v1/files`, {
    method: 'POST',
    headers: {
      'API_KEY': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ filename }),
  });

  if (!response.ok) {
    const error = await response.text().catch(() => response.statusText);
    throw new Error(`Failed to create file: ${response.status} - ${error}`);
  }

  return await response.json();
}

/**
 * Get file details by ID
 */
export async function getManusFile(fileId: string): Promise<any> {
  const apiUrl = ENV.forgeApiUrl?.replace(/\/+$/, '');
  const apiKey = ENV.forgeApiKey;

  if (!apiUrl || !apiKey) {
    throw new Error('Manus API credentials not configured');
  }

  const manusApiUrl = 'https://api.manus.ai';
  
  const response = await fetch(`${manusApiUrl}/v1/files/${fileId}`, {
    method: 'GET',
    headers: {
      'API_KEY': apiKey,
    },
  });

  if (!response.ok) {
    const error = await response.text().catch(() => response.statusText);
    throw new Error(`Failed to get file: ${response.status} - ${error}`);
  }

  return await response.json();
}
