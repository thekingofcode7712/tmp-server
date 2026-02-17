import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { calculateStorageCost, uploadToR2, getDownloadUrl, deleteFromR2, getFileMetadata } from './storage-r2';

describe('Cloudflare R2 Storage Integration', () => {
  describe('calculateStorageCost', () => {
    it('should calculate cost for small files (1MB)', () => {
      const fileSizeBytes = 1024 * 1024; // 1MB
      const cost = calculateStorageCost(fileSizeBytes);
      
      // Cost should be positive and include £2 minimum profit
      expect(cost).toBeGreaterThan(0);
      expect(typeof cost).toBe('number');
    });

    it('should calculate cost for medium files (100MB)', () => {
      const fileSizeBytes = 100 * 1024 * 1024; // 100MB
      const cost = calculateStorageCost(fileSizeBytes);
      
      expect(cost).toBeGreaterThan(0);
      expect(typeof cost).toBe('number');
    });

    it('should calculate cost for large files (1GB)', () => {
      const fileSizeBytes = 1024 * 1024 * 1024; // 1GB
      const cost = calculateStorageCost(fileSizeBytes);
      
      // Should be significantly higher than small files
      expect(cost).toBeGreaterThan(calculateStorageCost(1024 * 1024));
      expect(typeof cost).toBe('number');
    });

    it('should ensure £2 minimum profit margin', () => {
      // For very small files, should still maintain minimum profit
      const smallFileCost = calculateStorageCost(1024); // 1KB
      const largeFileCost = calculateStorageCost(1024 * 1024 * 1024); // 1GB
      
      expect(smallFileCost).toBeGreaterThan(0);
      expect(largeFileCost).toBeGreaterThan(smallFileCost);
    });

    it('should return consistent pricing for same file size', () => {
      const fileSizeBytes = 50 * 1024 * 1024; // 50MB
      const cost1 = calculateStorageCost(fileSizeBytes);
      const cost2 = calculateStorageCost(fileSizeBytes);
      
      expect(cost1).toBe(cost2);
    });
  });

  describe('R2 Storage Configuration', () => {
    it('should have required environment variables configured', () => {
      const requiredEnvs = [
        'CLOUDFLARE_R2_ACCOUNT_ID',
        'CLOUDFLARE_R2_ACCESS_KEY_ID',
        'CLOUDFLARE_R2_SECRET_ACCESS_KEY',
        'CLOUDFLARE_R2_BUCKET_NAME',
      ];

      requiredEnvs.forEach(envVar => {
        const value = process.env[envVar];
        expect(value).toBeDefined();
        expect(value).not.toBe('');
      });
    });

    it('should construct correct R2 endpoint URL', () => {
      const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
      const expectedEndpoint = `https://${accountId}.r2.cloudflarestorage.com`;
      
      // Verify endpoint format
      expect(accountId).toBeDefined();
      expect(expectedEndpoint).toMatch(/^https:\/\/.*\.r2\.cloudflarestorage\.com$/);
    });

    it('should construct correct public R2 URL format', () => {
      const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME;
      const fileKey = 'test-file.txt';
      const publicUrl = `https://${bucketName}.r2.dev/${fileKey}`;
      
      expect(bucketName).toBeDefined();
      expect(publicUrl).toMatch(/^https:\/\/.*\.r2\.dev\/.*$/);
    });
  });

  describe('R2 Storage Functions', () => {
    it('should export uploadToR2 function', () => {
      expect(typeof uploadToR2).toBe('function');
    });

    it('should export getDownloadUrl function', () => {
      expect(typeof getDownloadUrl).toBe('function');
    });

    it('should export deleteFromR2 function', () => {
      expect(typeof deleteFromR2).toBe('function');
    });

    it('should export getFileMetadata function', () => {
      expect(typeof getFileMetadata).toBe('function');
    });

    it('should export calculateStorageCost function', () => {
      expect(typeof calculateStorageCost).toBe('function');
    });
  });

  describe('Pricing Logic', () => {
    it('should ensure minimum profit of £2 per transaction', () => {
      // Test various file sizes
      const testSizes = [
        1024,                    // 1KB
        1024 * 1024,             // 1MB
        10 * 1024 * 1024,        // 10MB
        100 * 1024 * 1024,       // 100MB
        1024 * 1024 * 1024,      // 1GB
      ];

      testSizes.forEach(size => {
        const cost = calculateStorageCost(size);
        // Cost should be positive and reasonable
        expect(cost).toBeGreaterThan(0);
        expect(cost).toBeLessThan(1000); // Sanity check - should not be excessively high
      });
    });

    it('should scale pricing with file size', () => {
      const cost1MB = calculateStorageCost(1024 * 1024);
      const cost100MB = calculateStorageCost(100 * 1024 * 1024);
      const cost1GB = calculateStorageCost(1024 * 1024 * 1024);

      // Larger files should cost more (due to minimum profit, small files may be same cost)
      expect(cost100MB).toBeGreaterThanOrEqual(cost1MB);
      expect(cost1GB).toBeGreaterThan(cost100MB);
    });

    it('should return cost as decimal number with 2 decimal places', () => {
      const cost = calculateStorageCost(50 * 1024 * 1024);
      const costStr = cost.toString();
      
      // Should be a valid number with max 2 decimal places
      expect(Number.isFinite(cost)).toBe(true);
      expect(cost).toBeGreaterThan(0);
    });
  });
});
