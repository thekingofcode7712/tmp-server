import { storagePut, storageGet } from './storage';
import axios from 'axios';

const CHUNK_SIZE = 50 * 1024 * 1024; // 50MB chunks

interface ChunkSession {
  sessionId: string;
  fileName: string;
  totalChunks: number;
  uploadedChunks: Map<number, string>; // chunkIndex -> S3 URL
  fileSize: number;
  mimeType: string;
}

const sessions = new Map<string, ChunkSession>();

export function createChunkSession(fileName: string, fileSize: number, mimeType: string): {
  sessionId: string;
  totalChunks: number;
  chunkSize: number;
} {
  const sessionId = `chunk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const totalChunks = Math.ceil(fileSize / CHUNK_SIZE);
  
  sessions.set(sessionId, {
    sessionId,
    fileName,
    totalChunks,
    uploadedChunks: new Map(),
    fileSize,
    mimeType,
  });
  
  return {
    sessionId,
    totalChunks,
    chunkSize: CHUNK_SIZE,
  };
}

export function registerChunk(sessionId: string, chunkIndex: number, chunkUrl: string): void {
  const session = sessions.get(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }
  
  session.uploadedChunks.set(chunkIndex, chunkUrl);
}

export async function combineChunks(sessionId: string, finalFileKey: string): Promise<{ url: string }> {
  const session = sessions.get(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }
  
  if (session.uploadedChunks.size !== session.totalChunks) {
    throw new Error(`Missing chunks: ${session.uploadedChunks.size}/${session.totalChunks}`);
  }
  
  // Download all chunks and combine them
  const chunkBuffers: Buffer[] = [];
  
  for (let i = 0; i < session.totalChunks; i++) {
    const chunkUrl = session.uploadedChunks.get(i);
    if (!chunkUrl) {
      throw new Error(`Chunk ${i} not found`);
    }
    
    // Download chunk from S3
    const response = await axios.get(chunkUrl, { responseType: 'arraybuffer' });
    chunkBuffers.push(Buffer.from(response.data));
  }
  
  // Combine all chunks into one buffer
  const combinedBuffer = Buffer.concat(chunkBuffers);
  
  // Upload combined file to S3
  const { url } = await storagePut(finalFileKey, combinedBuffer, session.mimeType);
  
  // Clean up session
  sessions.delete(sessionId);
  
  return { url };
}

export function getSession(sessionId: string): ChunkSession | undefined {
  return sessions.get(sessionId);
}
