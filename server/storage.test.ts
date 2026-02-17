import { describe, it, expect, beforeAll, vi } from 'vitest';
import {
  calculateStorageCost,
  storagePut,
  storageGet,
  storageDelete,
  storageExists,
  storageGetMetadata,
  verifyStorageConnection,
  calculateTotalStorageCost,
} from './storage';

// Mock fetch for testing
global.fetch = vi.fn();

describe('R2 Storage - Pure HTTP/REST Implementation', () => {
  beforeAll(() => {
    process.env.CLOUDFLARE_R2_BUCKET_NAME = 'test-bucket';
    process.env.CLOUDFLARE_R2_ACCOUNT_ID = 'test-account';
    process.env.CLOUDFLARE_R2_ACCESS_KEY_ID = 'test-key';
    process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY = 'test-secret';
  });

  describe('calculateStorageCost', () => {
    it('should calculate cost for small file', () => {
      const oneByte = 1;
      const cost = calculateStorageCost(oneByte);
      expect(cost).toBeGreaterThanOrEqual(2.0);
    });

    it('should ensure minimum profit of £2', () => {
      const smallFile = 100;
      const cost = calculateStorageCost(smallFile);
      expect(cost).toBeCloseTo(2.0, 1);
    });

    it('should scale cost with file size', () => {
      const cost1GB = calculateStorageCost(1024 * 1024 * 1024);
      const cost10GB = calculateStorageCost(10 * 1024 * 1024 * 1024);
      expect(cost10GB).toBeGreaterThan(cost1GB);
    });
  });

  describe('storagePut', () => {
    it('should upload file to R2', async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true }), { status: 200 })
      );

      const fileData = Buffer.from('test content');
      const result = await storagePut('test-file.txt', fileData, 'text/plain');

      expect(result.key).toBe('test-file.txt');
      expect(result.url).toContain('r2.dev');
      expect(result.cost).toBeGreaterThanOrEqual(2.0);
    });

    it('should normalize key paths', async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValueOnce(
        new Response(JSON.stringify({ success: true }), { status: 200 })
      );

      const result = await storagePut('///test-file.txt', Buffer.from('data'), 'text/plain');
      expect(result.key).toBe('test-file.txt');
    });
  });

  describe('storageGet', () => {
    it('should return public URL for file', async () => {
      const result = await storageGet('test-file.txt');
      expect(result.key).toBe('test-file.txt');
      expect(result.url).toContain('r2.dev/test-file.txt');
    });
  });

  describe('storageDelete', () => {
    it('should delete file from R2', async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValueOnce(new Response('', { status: 200 }));

      await storageDelete('test-file.txt');
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('storageExists', () => {
    it('should return true for existing files', async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValueOnce(new Response('', { status: 200 }));

      const exists = await storageExists('test-file.txt');
      expect(exists).toBe(true);
    });

    it('should return false for non-existent files', async () => {
      const mockFetch = vi.mocked(global.fetch);
      mockFetch.mockResolvedValueOnce(new Response('', { status: 404 }));

      const exists = await storageExists('non-existent.txt');
      expect(exists).toBe(false);
    });
  });

  describe('calculateTotalStorageCost', () => {
    it('should calculate total cost for user storage', () => {
      const totalBytes = 5 * 1024 * 1024 * 1024;
      const cost = calculateTotalStorageCost(totalBytes);
      expect(cost).toBeGreaterThanOrEqual(2.0);
    });
  });

  describe('Function Exports', () => {
    it('should export all storage functions', () => {
      expect(typeof storagePut).toBe('function');
      expect(typeof storageGet).toBe('function');
      expect(typeof storageDelete).toBe('function');
      expect(typeof storageExists).toBe('function');
      expect(typeof storageGetMetadata).toBe('function');
      expect(typeof verifyStorageConnection).toBe('function');
      expect(typeof calculateStorageCost).toBe('function');
    });
  });
});
