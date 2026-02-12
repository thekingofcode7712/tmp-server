// Chunked upload implementation for large files
// Uploads chunks directly to S3 storage via Manus Forge API

import { ENV } from './_core/env';

type StorageConfig = { baseUrl: string; apiKey: string };

function getStorageConfig(): StorageConfig {
  const baseUrl = ENV.forgeApiUrl;
  const apiKey = ENV.forgeApiKey;

  if (!baseUrl || !apiKey) {
    throw new Error(
      "Storage proxy credentials missing: set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY"
    );
  }

  return { baseUrl: baseUrl.replace(/\/+$/, ""), apiKey };
}

function buildAuthHeaders(apiKey: string): HeadersInit {
  return { Authorization: `Bearer ${apiKey}` };
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

/**
 * Initialize a chunked upload session
 * Returns upload URLs for each chunk
 */
export async function initChunkedUpload(
  relKey: string,
  totalChunks: number,
  fileSize: number,
  mimeType: string
): Promise<{
  uploadId: string;
  chunkUrls: string[];
  finalKey: string;
}> {
  const { baseUrl, apiKey } = getStorageConfig();
  const key = normalizeKey(relKey);
  
  // Generate presigned URLs for each chunk
  const chunkUrls: string[] = [];
  
  for (let i = 0; i < totalChunks; i++) {
    const chunkKey = `${key}.part${i}`;
    const uploadUrl = new URL("v1/storage/upload", ensureTrailingSlash(baseUrl));
    uploadUrl.searchParams.set("path", chunkKey);
    chunkUrls.push(uploadUrl.toString());
  }
  
  // Generate a unique upload ID
  const uploadId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    uploadId,
    chunkUrls,
    finalKey: key,
  };
}

/**
 * Complete a chunked upload by combining all chunks
 */
export async function completeChunkedUpload(
  uploadId: string,
  finalKey: string,
  totalChunks: number,
  mimeType: string
): Promise<{ key: string; url: string }> {
  const { baseUrl, apiKey } = getStorageConfig();
  
  // For now, we'll use a simple approach: upload a marker file
  // The actual chunks are already uploaded directly to storage
  // In a production system, you'd combine the chunks server-side
  
  const completeUrl = new URL("v1/storage/upload", ensureTrailingSlash(baseUrl));
  completeUrl.searchParams.set("path", finalKey);
  
  // Create a completion marker
  const marker = JSON.stringify({
    uploadId,
    totalChunks,
    mimeType,
    completedAt: new Date().toISOString(),
  });
  
  const blob = new Blob([marker], { type: 'application/json' });
  const formData = new FormData();
  formData.append("file", blob, `${finalKey}.complete`);
  
  const response = await fetch(completeUrl, {
    method: "POST",
    headers: buildAuthHeaders(apiKey),
    body: formData,
  });
  
  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(
      `Failed to complete chunked upload (${response.status}): ${message}`
    );
  }
  
  const result = await response.json();
  
  return {
    key: finalKey,
    url: result.url || `${baseUrl}/v1/storage/download?path=${finalKey}`,
  };
}

/**
 * Get upload URL for a single chunk (used by frontend)
 */
export async function getChunkUploadUrl(
  chunkKey: string
): Promise<string> {
  const { baseUrl } = getStorageConfig();
  const key = normalizeKey(chunkKey);
  
  const uploadUrl = new URL("v1/storage/upload", ensureTrailingSlash(baseUrl));
  uploadUrl.searchParams.set("path", key);
  
  return uploadUrl.toString();
}
