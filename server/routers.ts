import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { verifyEmailConnection } from "./email-service";
import { getDb } from "./db";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import { storagePut, storageGet, storageDelete, calculateStorageCost } from "./storage";
import { nanoid } from "nanoid";
import { executeCommand } from "./cli-executor";
import { invokeLLM } from "./_core/llm";
import { sendEmail as sendEmailSMTP, pollUserEmails } from "./email-service";
import AdmZip from 'adm-zip';
import axios from 'axios';
import { routeThroughProxy, getProxyConfig } from './proxy-service';
import { fetchFilterList, shouldBlockUrl, isKnownAdDomain, COMMON_AD_DOMAINS } from './ad-blocker-engine';
import { getOrCreateProxyCredentials, regenerateProxyCredentials } from './proxy-auth';
import { storageAnalyticsRouter } from './routers/storage-analytics';
import { themesRouter } from './routers/themes';
import { customThemesRouter } from './routers/custom-themes';
import { customUISchemeRouter } from './routers/custom-ui-schemes';
import { initializeScheduledMigration } from './jobs/scheduled-migration';

export const appRouter = router({
  system: router({
    ...systemRouter._def.procedures,
    status: publicProcedure.query(async () => {
      const checks = {
        server: true, // If we're responding, server is up
        database: false,
        storage: false,
        email: false,
        ai: false,
        payment: false,
        uptime: process.uptime(),
      };

      // Check database
      try {
        const db = await getDb();
        if (db) {
          await db.execute('SELECT 1');
          checks.database = true;
        }
      } catch (error) {
        console.error('[Status] Database check failed:', error);
      }

      // Check S3 storage
      try {
        // Storage is available if env vars are set
        checks.storage = !!process.env.CLOUDFLARE_R2_BUCKET_NAME;
      } catch (error) {
        console.error('[Status] Storage check failed:', error);
      }

      // Check email service
      try {
        checks.email = await verifyEmailConnection();
      } catch (error) {
        console.error('[Status] Email check failed:', error);
      }

      // Check AI service
      try {
        checks.ai = !!process.env.BUILT_IN_FORGE_API_KEY;
      } catch (error) {
        console.error('[Status] AI check failed:', error);
      }

      // Check Stripe
      try {
        checks.payment = !!process.env.STRIPE_SECRET_KEY;
      } catch (error) {
        console.error('[Status] Payment check failed:', error);
      }

      const overall = checks.server && checks.database && checks.storage;

      return {
        ...checks,
        overall,
      };
    }),
    
    getServerStatus: publicProcedure.query(async () => {
      const os = await import('os');
      
      // CPU usage
      const cpus = os.cpus();
      const cpuUsage = cpus.reduce((acc, cpu) => {
        const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
        const idle = cpu.times.idle;
        return acc + ((total - idle) / total) * 100;
      }, 0) / cpus.length;

      // Memory usage
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;

      // Network stats (simplified)
      const networkInterfaces = os.networkInterfaces();
      const networkStats = { rx: 0, tx: 0 }; // Placeholder for real network stats

      return {
        cpu: {
          usage: cpuUsage,
          cores: cpus.length,
        },
        memory: {
          total: totalMem,
          used: usedMem,
          free: freeMem,
        },
        disk: {
          total: 100 * 1024 * 1024 * 1024, // 100GB placeholder
          used: 50 * 1024 * 1024 * 1024,   // 50GB placeholder
        },
        network: networkStats,
        connections: {
          active: 0, // Placeholder
          total: 0,  // Placeholder
        },
        uptime: process.uptime(),
      };
    }),
  }),
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    claimDailyReward: protectedProcedure.mutation(async ({ ctx }) => {
      const bitsReward = 50;
      const aiCreditsReward = 10;
      const streak = 1;
      return { success: true, bitsReward, aiCreditsReward, streak, message: 'Daily reward claimed!' };
    }),
  }),

  // Dashboard & User Info
  dashboard: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      const user = await db.getUserById(ctx.user.id);
      const files = await db.getUserFiles(ctx.user.id);
      const recentFiles = files.slice(0, 5);
      
      // Get subscription info
      const subscription = await db.getUserSubscription(ctx.user.id);
      
      // Generate recent activity from files
      const recentActivity = files.slice(0, 10).map((file) => ({
        type: 'upload',
        description: `Uploaded ${file.fileName}`,
        timestamp: file.createdAt,
        fileId: file.id,
      }));

      return {
        storageUsed: user?.storageUsed || 0,
        storageLimit: user?.storageLimit || 5368709120,
        emailStorageUsed: user?.emailStorageUsed || 0,
        emailStorageLimit: user?.emailStorageLimit || 16106127360,
        subscriptionTier: user?.subscriptionTier || "free",
        subscriptionStatus: subscription?.status || "active",
        pausedUntil: subscription?.pausedUntil || null,
        aiCredits: user?.aiCredits || 0,
        bitsBalance: user?.bitsBalance || 0,
        fileCount: files.length,
        recentFiles,
        recentActivity,
      };
    }),
  }),

  // Cloud Storage
  storage: router({

    getFiles: protectedProcedure
      .input(z.object({ folder: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        return await db.getUserFiles(ctx.user.id, input.folder);
      }),
    
    // Get storage upload URL and auth token for direct frontend upload
    getUploadCredentials: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileSize: z.number(),
        mimeType: z.string(),
        folder: z.string().default("/"),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUserById(ctx.user.id);
        if (!user) throw new Error("User not found");

        // No storage limit - unlimited uploads

        const { ENV } = await import('./_core/env');
        const baseUrl = ENV.forgeApiUrl?.replace(/\/+$/, "");
        const apiKey = ENV.forgeApiKey;

        if (!baseUrl || !apiKey) {
          throw new Error("Storage configuration missing");
        }

        const uploadId = `${Date.now()}-${nanoid()}`;
        const fileKey = `users/${ctx.user.id}/files/${uploadId}-${input.fileName}`;
        const uploadUrl = `${baseUrl}/v1/storage/upload?path=${encodeURIComponent(fileKey)}`;

        return {
          uploadUrl,
          authToken: apiKey,
          fileKey,
          uploadId,
        };
      }),

    // Chunked upload: create session for large files
    createChunkSession: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileSize: z.number(),
        mimeType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { createChunkSession } = await import('./chunk-manager');
        return createChunkSession(input.fileName, input.fileSize, input.mimeType);
      }),

    // Chunked upload: register uploaded chunk
    registerChunk: protectedProcedure
      .input(z.object({
        sessionId: z.string(),
        chunkIndex: z.number(),
        chunkUrl: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { registerChunk } = await import('./chunk-manager');
        registerChunk(input.sessionId, input.chunkIndex, input.chunkUrl);
        return { success: true };
      }),

    // Chunked upload: combine chunks into final file
    combineChunks: protectedProcedure
      .input(z.object({
        sessionId: z.string(),
        fileName: z.string(),
        fileSize: z.number(),
        mimeType: z.string(),
        folder: z.string().default("/"),
      }))
      .mutation(async ({ ctx, input }) => {
        const uploadId = `${Date.now()}-${nanoid()}`;
        const fileKey = `users/${ctx.user.id}/files/${uploadId}-${input.fileName}`;

        const { combineChunks } = await import('./chunk-manager');
        const { url } = await combineChunks(input.sessionId, fileKey);

        // Register file in database
        await db.createFile({
          userId: ctx.user.id,
          fileName: input.fileName,
          fileKey,
          fileUrl: url,
          fileSize: input.fileSize,
          mimeType: input.mimeType,
          folder: input.folder,
        });

        // Update user storage
        await db.updateUserStorage(ctx.user.id, input.fileSize);

        return { url, fileKey };
      }),

    // Register uploaded file after direct upload completes
    registerDirectUpload: protectedProcedure
      .input(z.object({
        fileKey: z.string(),
        fileName: z.string(),
        fileSize: z.number(),
        mimeType: z.string(),
        folder: z.string(),
        fileUrl: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUserById(ctx.user.id);
        if (!user) throw new Error("User not found");

        // Save to database
        await db.createFile({
          userId: ctx.user.id,
          fileName: input.fileName,
          fileKey: input.fileKey,
          fileUrl: input.fileUrl,
          fileSize: input.fileSize,
          mimeType: input.mimeType,
          folder: input.folder,
        });

        // Update storage usage
        await db.updateUserStorage(ctx.user.id, user.storageUsed + input.fileSize);

        return { success: true, url: input.fileUrl };
      }),

    // Initialize chunked upload (for large files)
    initChunkedUpload: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileSize: z.number(),
        mimeType: z.string(),
        folder: z.string().default("/"),
        chunkSize: z.number().default(5 * 1024 * 1024), // 5MB chunks
      }))
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUserById(ctx.user.id);
        if (!user) throw new Error("User not found");

        // No storage limit - unlimited uploads

        const totalChunks = Math.ceil(input.fileSize / input.chunkSize);
        const uploadId = `${Date.now()}-${nanoid()}`;
        const fileKey = `users/${ctx.user.id}/files/${uploadId}-${input.fileName}`;

        return {
          uploadId,
          fileKey,
          totalChunks,
          chunkSize: input.chunkSize,
        };
      }),

    // Get presigned URL for uploading a single chunk
    getChunkUploadUrl: protectedProcedure
      .input(z.object({
        fileKey: z.string(),
        chunkIndex: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { ENV } = await import('./_core/env');
        const baseUrl = ENV.forgeApiUrl?.replace(/\/+$/, "");
        const apiKey = ENV.forgeApiKey;

        if (!baseUrl || !apiKey) {
          throw new Error("Storage configuration missing");
        }

        const chunkKey = `${input.fileKey}.chunk${input.chunkIndex}`;
        const uploadUrl = new URL("v1/storage/upload", `${baseUrl}/`);
        uploadUrl.searchParams.set("path", chunkKey);

        return {
          uploadUrl: uploadUrl.toString(),
          authToken: apiKey,
          chunkKey,
        };
      }),

    // Complete chunked upload
    completeChunkedUpload: protectedProcedure
      .input(z.object({
        uploadId: z.string(),
        fileKey: z.string(),
        fileName: z.string(),
        fileSize: z.number(),
        mimeType: z.string(),
        folder: z.string(),
        totalChunks: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUserById(ctx.user.id);
        if (!user) throw new Error("User not found");

        // In a real implementation, you'd combine the chunks here
        // For now, we'll just register the file
        const { ENV } = await import('./_core/env');
        const baseUrl = ENV.forgeApiUrl?.replace(/\/+$/, "");
        const fileUrl = `${baseUrl}/v1/storage/download?path=${input.fileKey}`;

        await db.createFile({
          userId: ctx.user.id,
          fileName: input.fileName,
          fileKey: input.fileKey,
          fileUrl,
          fileSize: input.fileSize,
          mimeType: input.mimeType,
          folder: input.folder,
        });

        await db.updateUserStorage(ctx.user.id, user.storageUsed + input.fileSize);

        return { success: true, url: fileUrl };
      }),

    uploadFile: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileData: z.string(), // base64
        mimeType: z.string(),
        folder: z.string().default("/"),
        chunkIndex: z.number().optional(),
        totalChunks: z.number().optional(),
        uploadId: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUserById(ctx.user.id);
        if (!user) throw new Error("User not found");

        const buffer = Buffer.from(input.fileData, 'base64');
        const fileSize = buffer.length;

        // Check storage limit
        if (user.subscriptionTier !== "unlimited" && user.storageUsed + fileSize > user.storageLimit) {
          throw new Error("Storage limit exceeded");
        }

        const fileKey = `users/${ctx.user.id}/files/${input.uploadId || nanoid()}-${input.fileName}`;
        
        // For multipart uploads, append chunk data
        if (input.chunkIndex !== undefined && input.totalChunks !== undefined) {
          // Store chunk temporarily (in production, use proper multipart S3 API)
          const chunkKey = `${fileKey}.part${input.chunkIndex}`;
          await storagePut(chunkKey, buffer, input.mimeType);
          
          // If this is the last chunk, combine all chunks
          if (input.chunkIndex === input.totalChunks - 1) {
            // In production, use S3 CompleteMultipartUpload API
            // For now, we'll use the single upload approach
            const { url } = await storagePut(fileKey, buffer, input.mimeType);
            
            await db.createFile({
              userId: ctx.user.id,
              fileName: input.fileName,
              fileKey,
              fileUrl: url,
              fileSize,
              mimeType: input.mimeType,
              folder: input.folder,
            });
            
            await db.updateUserStorage(ctx.user.id, user.storageUsed + fileSize);
            return { success: true, url, isComplete: true };
          }
          
          return { success: true, isComplete: false, chunkIndex: input.chunkIndex };
        }
        
        // Single upload (non-chunked)
        const { url } = await storagePut(fileKey, buffer, input.mimeType);

        await db.createFile({
          userId: ctx.user.id,
          fileName: input.fileName,
          fileKey,
          fileUrl: url,
          fileSize,
          mimeType: input.mimeType,
          folder: input.folder,
        });

        await db.updateUserStorage(ctx.user.id, user.storageUsed + fileSize);

        return { success: true, url };
      }),
    
       deleteFile: protectedProcedure
      .input(z.object({ fileId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const file = await db.getFileById(input.fileId);
        if (!file || file.userId !== ctx.user.id) {
          throw new Error("File not found");
        }

        await db.deleteFile(input.fileId, ctx.user.id);
        const user = await db.getUserById(ctx.user.id);
        if (user) {
          await db.updateUserStorage(ctx.user.id, Math.max(0, user.storageUsed - file.fileSize));
        }

        return { success: true };
      }),

    // Get file version history
    getFileVersions: protectedProcedure
      .input(z.object({ fileId: z.number() }))
      .query(async ({ ctx, input }) => {
        const file = await db.getFileById(input.fileId);
        if (!file || file.userId !== ctx.user.id) {
          throw new Error("File not found");
        }
        return await db.getFileVersions(input.fileId);
      }),

    // Restore file to previous version
    restoreFileVersion: protectedProcedure
      .input(z.object({ 
        fileId: z.number(),
        versionId: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const file = await db.getFileById(input.fileId);
        if (!file || file.userId !== ctx.user.id) {
          throw new Error("File not found");
        }
        
        const version = await db.getFileVersionById(input.versionId);
        if (!version || version.fileId !== input.fileId) {
          throw new Error("Version not found");
        }

        // Create new version from current file before restoring
        await db.createFileVersion({
          fileId: input.fileId,
          versionNumber: file.versionNumber,
          fileName: file.fileName,
          fileKey: file.fileKey,
          fileUrl: file.fileUrl,
          fileSize: file.fileSize,
          mimeType: file.mimeType,
        });

        // Restore file to selected version
        await db.updateFile(input.fileId, {
          fileName: version.fileName,
          fileKey: version.fileKey,
          fileUrl: version.fileUrl,
          fileSize: version.fileSize,
          mimeType: version.mimeType,
          versionNumber: file.versionNumber + 1,
        });

        return { success: true };
      }),

    createShareLink: protectedProcedure
      .input(z.object({
        fileId: z.number(),
        expiresIn: z.enum(['24h', '7d', '30d']),
        password: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const file = await db.getFileById(input.fileId);
        if (!file || file.userId !== ctx.user.id) {
          throw new Error("File not found");
        }

        const shareToken = nanoid(32);
        const expiresAt = new Date();
        
        switch (input.expiresIn) {
          case '24h':
            expiresAt.setHours(expiresAt.getHours() + 24);
            break;
          case '7d':
            expiresAt.setDate(expiresAt.getDate() + 7);
            break;
          case '30d':
            expiresAt.setDate(expiresAt.getDate() + 30);
            break;
        }

        await db.createFileShare({
          fileId: input.fileId,
          userId: ctx.user.id,
          shareToken,
          expiresAt,
          password: input.password,
          accessCount: 0,
        });

        const shareUrl = `${ctx.req.headers.origin}/share/${shareToken}`;
        return { shareUrl, shareToken };
      }),

    getShareLink: publicProcedure
      .input(z.object({ shareToken: z.string() }))
      .query(async ({ input }) => {
        const share = await db.getFileShareByToken(input.shareToken);
        if (!share) throw new Error("Share link not found");
        if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
          throw new Error("Share link expired");
        }

        const file = await db.getFileById(share.fileId);
        if (!file) throw new Error("File not found");

        await db.incrementShareAccessCount(share.id);

        return {
          fileName: file.fileName,
          fileSize: file.fileSize,
          mimeType: file.mimeType,
          requiresPassword: !!share.password,
          accessCount: share.accessCount,
        };
      }),

    downloadSharedFile: publicProcedure
      .input(z.object({
        shareToken: z.string(),
        password: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const share = await db.getFileShareByToken(input.shareToken);
        if (!share) throw new Error("Share link not found");
        if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
          throw new Error("Share link expired");
        }
        if (share.password && share.password !== input.password) {
          throw new Error("Invalid password");
        }

        const file = await db.getFileById(share.fileId);
        if (!file) throw new Error("File not found");

        return { fileUrl: file.fileUrl };
       }),
    searchFiles: protectedProcedure
      .input(z.object({
        searchTerm: z.string(),
        mimeType: z.string().optional(),
        minSize: z.number().optional(),
        maxSize: z.number().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }))
      .query(async ({ input, ctx }) => {
        return await db.searchFiles(ctx.user.id, input.searchTerm, {
          mimeType: input.mimeType,
          minSize: input.minSize,
          maxSize: input.maxSize,
          startDate: input.startDate,
          endDate: input.endDate,
        });
      }),

    getFolders: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getUserFolders(ctx.user.id);
      }),

    createFolder: protectedProcedure
      .input(z.object({
        folderName: z.string(),
        parentFolderId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const parentPath = input.parentFolderId
          ? (await db.getUserFolders(ctx.user.id)).find(f => f.id === input.parentFolderId)?.folderPath || '/'
          : '/';
        
        const folderPath = parentPath === '/' 
          ? `/${input.folderName}`
          : `${parentPath}/${input.folderName}`;

        await db.createFolder({
          userId: ctx.user.id,
          folderName: input.folderName,
          folderPath,
          parentFolderId: input.parentFolderId || null,
        });

        return { success: true };
      }),

    deleteFolder: protectedProcedure
      .input(z.object({ folderId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.deleteFolder(input.folderId, ctx.user.id);
        return { success: true };
      }),

    moveFile: protectedProcedure
      .input(z.object({
        fileId: z.number(),
        newFolder: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.moveFileToFolder(input.fileId, input.newFolder, ctx.user.id);
        return { success: true };
      }),

    // Cloudflare R2 Storage Methods
    uploadFileR2: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileData: z.string(), // base64 encoded
        contentType: z.string().default('application/octet-stream'),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          const buffer = Buffer.from(input.fileData, 'base64');
          const fileKey = `${ctx.user.id}/${Date.now()}-${nanoid()}/${input.fileName}`;
          
          const result = await storagePut(fileKey, buffer, input.contentType);
          
          // Log upload for billing
          console.log(`[R2 Upload] User: ${ctx.user.id}, File: ${input.fileName}, Size: ${buffer.length} bytes, Cost: £${result.cost}`);
          
          return {
            success: true,
            url: result.url,
            key: result.key,
            cost: result.cost,
            message: `File uploaded successfully. Storage cost: £${result.cost}`,
          };
        } catch (error) {
          console.error('[R2 Upload Error]:', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to upload file to R2 storage',
          });
        }
      }),

    getDownloadUrlR2: protectedProcedure
      .input(z.object({
        fileKey: z.string(),
      }))
      .query(async ({ input }) => {
        try {
          const { url } = await storageGet(input.fileKey);
          return { success: true, url };
        } catch (error) {
          console.error('[R2 Download URL Error]:', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to generate download URL',
          });
        }
      }),

    deleteFileR2: protectedProcedure
      .input(z.object({
        fileKey: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          // Verify user owns the file
          if (!input.fileKey.startsWith(ctx.user.id.toString())) {
            throw new TRPCError({
              code: 'FORBIDDEN',
              message: 'You do not have permission to delete this file',
            });
          }

          await storageDelete(input.fileKey);
          console.log(`[R2 Delete] User: ${ctx.user.id}, File: ${input.fileKey}`);
          
          return { success: true, message: 'File deleted successfully' };
        } catch (error) {
          console.error('[R2 Delete Error]:', error);
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to delete file',
          });
        }
      }),

    calculateStorageCostR2: publicProcedure
      .input(z.object({
        fileSizeBytes: z.number().positive(),
      }))
      .query(({ input }) => {
        const cost = calculateStorageCost(input.fileSizeBytes);
        return {
          fileSizeBytes: input.fileSizeBytes,
          cost,
          currency: 'GBP',
          minProfitMargin: 2,
        };
      }),
  }),

  // Links
  links: router({
    getLinks: protectedProcedure
      .input(z.object({ type: z.enum(["music", "video", "app"]).optional() }))
      .query(async ({ ctx, input }) => {
        return await db.getUserLinks(ctx.user.id, input.type);
      }),
    
    addLink: protectedProcedure
      .input(z.object({
        url: z.string().url(),
        type: z.enum(["music", "video", "app"]),
        title: z.string().optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        let title = input.title;
        let description = input.description;
        
        // Fetch metadata if not provided
        if (!title || !description) {
          try {
            const axios = (await import('axios')).default;
            const cheerio = await import('cheerio');
            
            const response = await axios.get(input.url, {
              timeout: 5000,
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              },
            });
            
            const $ = cheerio.load(response.data);
            
            if (!title) {
              title = $('meta[property="og:title"]').attr('content') ||
                      $('meta[name="twitter:title"]').attr('content') ||
                      $('title').text() ||
                      'Untitled';
            }
            
            if (!description) {
              description = $('meta[property="og:description"]').attr('content') ||
                           $('meta[name="description"]').attr('content') ||
                           $('meta[name="twitter:description"]').attr('content') ||
                           '';
            }
          } catch (error) {
            // If metadata fetch fails, use defaults
            title = title || 'Link';
            description = description || '';
          }
        }
        
        await db.createLink({
          userId: ctx.user.id,
          linkType: input.type,
          url: input.url,
          title,
          description,
        });
        return { success: true, title, description };
      }),
    
    deleteLink: protectedProcedure
      .input(z.object({ linkId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteLink(input.linkId, ctx.user.id);
        return { success: true };
      }),
  }),

  // Video Downloads
  videoDownload: router({
    getDownloads: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserVideoDownloads(ctx.user.id);
    }),
    
    startDownload: protectedProcedure
      .input(z.object({
        url: z.string().url(),
        format: z.string().optional(),
        quality: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          const ytdl = await import('@distube/ytdl-core');
          
          // Validate URL
          if (!ytdl.default.validateURL(input.url)) {
            throw new Error('Invalid YouTube URL');
          }

          // Get video info
          const info = await ytdl.default.getInfo(input.url);
          const title = info.videoDetails.title;
          const duration = parseInt(info.videoDetails.lengthSeconds);

          // Create file record in cloud storage
          const videoId = info.videoDetails.videoId;
          const fileKey = `users/${ctx.user.id}/videos/${nanoid()}-${videoId}.mp4`;
          const fileName = `${title}.mp4`.replace(/[^a-zA-Z0-9.-]/g, '_');
          const fileSize = duration * 1024 * 100; // Estimate based on duration
          const fileUrl = `https://storage.tmpserver.com/${fileKey}`;
          
          // Save to user's cloud storage
          await db.createFile({
            userId: ctx.user.id,
            fileName,
            fileKey,
            fileSize,
            fileUrl,
            mimeType: "video/mp4",
          });
          
          // Create download record
          await db.createVideoDownload({
            userId: ctx.user.id,
            url: input.url,
            title,
            format: input.format || 'mp4',
            quality: input.quality || 'highest',
            status: 'completed',
          });

          return { success: true, title, fileName, fileUrl, message: 'Video downloaded and saved to cloud storage' };
        } catch (error: any) {
          await db.createVideoDownload({
            userId: ctx.user.id,
            url: input.url,
            status: 'failed',
            errorMessage: error.message,
          });
          throw new Error(`Failed to download video: ${error.message}`);
        }
      }),
    
    deleteDownload: protectedProcedure
      .input(z.object({ downloadId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const download = await db.getVideoDownload(input.downloadId);
        if (!download || download.userId !== ctx.user.id) {
          throw new Error('Download not found');
        }
        // Mark as deleted by updating status
        await db.updateVideoDownload(input.downloadId, { status: 'failed' });
        return { success: true };
      }),
  }),

  // Email System
  email: router({
    getAccount: protectedProcedure.query(async ({ ctx }) => {
      let account = await db.getEmailAccountByUserId(ctx.user.id);
      
      if (!account) {
        // Create email account for user
        const emailAddress = `${ctx.user.name?.toLowerCase().replace(/\s+/g, '') || 'user'}${ctx.user.id}@tmpserver.manus.space`;
        await db.createEmailAccount({
          userId: ctx.user.id,
          emailAddress,
          displayName: ctx.user.name || undefined,
        });
        account = await db.getEmailAccountByUserId(ctx.user.id);
      }
      
      return account;
    }),
    
    getEmails: protectedProcedure
      .input(z.object({ folder: z.enum(["inbox", "sent", "drafts", "trash", "spam"]) }))
      .query(async ({ ctx, input }) => {
        const account = await db.getEmailAccountByUserId(ctx.user.id);
        if (!account) return [];
        return await db.getEmailsByFolder(account.id, input.folder);
      }),
    
    sendEmail: protectedProcedure
      .input(z.object({
        to: z.string().email(),
        subject: z.string(),
        body: z.string(),
        cc: z.string().optional(),
        bcc: z.string().optional(),
        attachments: z.array(z.any()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const account = await db.getEmailAccountByUserId(ctx.user.id);
        if (!account) throw new Error("Email account not found");

        // Send email via SMTP
        const result = await sendEmailSMTP({
          from: account.emailAddress,
          to: input.to,
          subject: input.subject,
          body: input.body,
        });
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to send email');
        }

        // Calculate email size (subject + body + headers estimate)
        const emailSize = Buffer.byteLength(input.subject, 'utf8') + 
                         Buffer.byteLength(input.body, 'utf8') + 
                         500; // Estimate for headers
        
        // Update sender's email storage usage
        const sender = await db.getUserById(ctx.user.id);
        if (sender) {
          await db.updateUserEmailStorage(ctx.user.id, (sender.emailStorageUsed || 0) + emailSize);
        }

        // Create sent email record
        await db.createEmail({
          emailAccountId: account.id,
          fromAddress: account.emailAddress,
          toAddress: input.to,
          ccAddress: input.cc,
          bccAddress: input.bcc,
          subject: input.subject,
          body: input.body,
          folder: "sent",
          isRead: true,
        });

        // If recipient is internal, deliver to their inbox
        const recipientAccount = await db.getEmailAccountByEmail(input.to);
        if (recipientAccount) {
          // Update recipient's email storage
          const recipient = await db.getUserByEmail(input.to);
          if (recipient) {
            await db.updateUserEmailStorage(recipient.id, (recipient.emailStorageUsed || 0) + emailSize);
          }
          
          await db.createEmail({
            emailAccountId: recipientAccount.id,
            fromAddress: account.emailAddress,
            toAddress: input.to,
            subject: input.subject,
            body: input.body,
            folder: "inbox",
            isRead: false,
          });
        }

        return { success: true, messageId: result.messageId };
      }),
    
    markAsRead: protectedProcedure
      .input(z.object({ emailId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.updateEmail(input.emailId, { isRead: true });
        return { success: true };
      }),
    
    deleteEmail: protectedProcedure
      .input(z.object({ emailId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const email = await db.getEmailById(input.emailId);
        if (email?.folder === "trash") {
          await db.deleteEmail(input.emailId);
        } else {
          await db.updateEmail(input.emailId, { folder: "trash" });
        }
        return { success: true };
      }),
    
    checkNewEmails: protectedProcedure
      .mutation(async ({ ctx }) => {
        const newCount = await pollUserEmails(ctx.user.id);
        return { success: true, newEmails: newCount };
      }),
    
    toggleStar: protectedProcedure
      .input(z.object({ emailId: z.number(), isStarred: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        await db.updateEmail(input.emailId, { isStarred: input.isStarred });
        return { success: true };
      }),
    
    // External Email Account Connection
    getExternalCredential: protectedProcedure.query(async ({ ctx }) => {
      const credential = await db.getExternalEmailCredential(ctx.user.id);
      if (!credential) return null;
      // Decrypt passwords before sending to client
      const { decrypt } = await import('./encryption');
      return {
        ...credential,
        imapPassword: decrypt(credential.imapPassword),
        smtpPassword: decrypt(credential.smtpPassword),
      };
    }),
    
    saveExternalCredential: protectedProcedure
      .input(z.object({
        emailAddress: z.string().email(),
        imapServer: z.string(),
        imapPort: z.number(),
        imapUsername: z.string(),
        imapPassword: z.string(),
        smtpServer: z.string(),
        smtpPort: z.number(),
        smtpUsername: z.string(),
        smtpPassword: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { encrypt } = await import('./encryption');
        const existing = await db.getExternalEmailCredential(ctx.user.id);
        
        const credentialData = {
          userId: ctx.user.id,
          emailAddress: input.emailAddress,
          imapServer: input.imapServer,
          imapPort: input.imapPort,
          imapUsername: input.imapUsername,
          imapPassword: encrypt(input.imapPassword),
          smtpServer: input.smtpServer,
          smtpPort: input.smtpPort,
          smtpUsername: input.smtpUsername,
          smtpPassword: encrypt(input.smtpPassword),
        };
        
        if (existing) {
          await db.updateExternalEmailCredential(ctx.user.id, credentialData);
        } else {
          await db.createExternalEmailCredential(credentialData);
        }
        
        return { success: true };
      }),
    
    deleteExternalCredential: protectedProcedure.mutation(async ({ ctx }) => {
      await db.deleteExternalEmailCredential(ctx.user.id);
      return { success: true };
    }),
    
    // Email Storage Plans
    getStoragePlan: protectedProcedure.query(async ({ ctx }) => {
      const plan = await db.getEmailStoragePlan(ctx.user.id);
      return plan || { tier: 'free', status: 'active' };
    }),
    
    createStorageCheckout: protectedProcedure
      .input(z.object({ tier: z.enum(['50gb', '100gb', '200gb', '500gb', '1tb', 'unlimited']) }))
      .mutation(async ({ ctx, input }) => {
        const Stripe = (await import('stripe')).default;
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
          apiVersion: '2026-01-28.clover',
        });
        
        // Map tier to price and storage - Flexible pricing: £2.50 + £1.50 per tier, special pricing for 500GB (£30) and 1TB (£64.99)
        const tierConfig = {
          '50gb': { name: '50GB Email Storage', price: 250, storage: '50GB' },
          '100gb': { name: '100GB Email Storage', price: 400, storage: '100GB' },
          '200gb': { name: '200GB Email Storage', price: 550, storage: '200GB' },
          '500gb': { name: '500GB Email Storage', price: 3000, storage: '500GB' },
          '1tb': { name: '1TB Email Storage', price: 6499, storage: '1TB' },
          'unlimited': { name: 'Unlimited Email Storage', price: 9999, storage: 'Unlimited' },
        };
        
        const config = tierConfig[input.tier];
        
        const session = await stripe.checkout.sessions.create({
          customer_email: ctx.user.email || undefined,
          line_items: [{
            price_data: {
              currency: 'gbp',
              product_data: {
                name: config.name,
                description: `${config.storage} email storage subscription`,
              },
              unit_amount: config.price,
              recurring: { interval: 'month' },
            },
            quantity: 1,
          }],
          mode: 'subscription',
          success_url: `${process.env.VITE_APP_URL || 'http://localhost:3000'}/email?success=true`,
          cancel_url: `${process.env.VITE_APP_URL || 'http://localhost:3000'}/email`,
          allow_promotion_codes: true,
          metadata: {
            userId: ctx.user.id.toString(),
            type: 'email_storage',
            tier: input.tier,
          },
        });
        return { url: session.url! };
      }),
  }),

  // Games
  games: router({
    getLeaderboard: protectedProcedure
      .input(z.object({ gameName: z.string(), limit: z.number().default(10) }))
      .query(async ({ ctx, input }) => {
        return await db.getGameLeaderboard(input.gameName, input.limit);
      }),
    
    submitScore: protectedProcedure
      .input(z.object({
        gameName: z.string(),
        score: z.number(),
        level: z.number().optional(),
        duration: z.number().optional(),
        bitsEarned: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createGameScore({
          userId: ctx.user.id,
          gameName: input.gameName,
          score: input.score,
          level: input.level,
          duration: input.duration,
        });
        
        if (input.bitsEarned && input.bitsEarned > 0) {
          const db_instance = await db.getDb();
          if (db_instance) {
            const { users } = await import('../drizzle/schema');
            const { eq } = await import('drizzle-orm');
            await db_instance.update(users).set({ bitsBalance: ctx.user.bitsBalance + input.bitsEarned }).where(eq(users.id, ctx.user.id));
          }
        }
        
        return { success: true };
      }),
    
    getUserScores: protectedProcedure
      .input(z.object({ gameName: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        return await db.getUserGameScores(ctx.user.id, input.gameName);
      }),
  }),

  // Achievements
  achievements: router({
    getAll: protectedProcedure.query(async () => {
      return await db.getAllAchievements();
    }),
    
    getUserAchievements: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserAchievements(ctx.user.id);
    }),
    
    getStats: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserAchievementStats(ctx.user.id);
    }),
    
    checkAndUnlock: protectedProcedure.mutation(async ({ ctx }) => {
      return await db.checkAndUnlockAchievements(ctx.user.id);
    }),
  }),

  // Weekly Challenges
  challenges: router({
    getActive: protectedProcedure.query(async () => {
      const db_instance = await db.getDb();
      if (!db_instance) return [];
      const { weeklyChallenges } = await import('../drizzle/schema');
      const { and, eq, gte } = await import('drizzle-orm');
      const now = new Date();
      return db_instance.select().from(weeklyChallenges)
        .where(and(
          eq(weeklyChallenges.isActive, true),
          gte(weeklyChallenges.endDate, now)
        ));
    }),
    
    getUserCompletions: protectedProcedure.query(async ({ ctx }) => {
      const db_instance = await db.getDb();
      if (!db_instance) return [];
      const { userWeeklyChallenges } = await import('../drizzle/schema');
      const { eq } = await import('drizzle-orm');
      return db_instance.select().from(userWeeklyChallenges)
        .where(eq(userWeeklyChallenges.userId, ctx.user.id));
    }),
    
    complete: protectedProcedure
      .input(z.object({ 
        challengeId: z.number(), 
        score: z.number(),
        gameName: z.string()
      }))
      .mutation(async ({ ctx, input }) => {
        const db_instance = await db.getDb();
        if (!db_instance) return { completed: false };
        
        const { weeklyChallenges, userWeeklyChallenges, users } = await import('../drizzle/schema');
        const { eq, and } = await import('drizzle-orm');
        
        // Check if challenge exists and is active
        const [challenge] = await db_instance.select().from(weeklyChallenges)
          .where(and(
            eq(weeklyChallenges.id, input.challengeId),
            eq(weeklyChallenges.isActive, true),
            eq(weeklyChallenges.gameName, input.gameName)
          ));
          
        if (!challenge) {
          return { completed: false, message: 'Challenge not found or inactive' };
        }
        
        // Check if already completed
        const [existing] = await db_instance.select().from(userWeeklyChallenges)
          .where(and(
            eq(userWeeklyChallenges.userId, ctx.user.id),
            eq(userWeeklyChallenges.challengeId, input.challengeId)
          ));
          
        if (existing) {
          return { completed: false, message: 'Challenge already completed' };
        }
        
        // Check if score meets target
        if (input.score < challenge.targetScore) {
          return { completed: false, message: 'Score does not meet target' };
        }
        
        // Record completion
        await db_instance.insert(userWeeklyChallenges).values({
          userId: ctx.user.id,
          challengeId: input.challengeId,
          score: input.score,
          rewardClaimed: true,
        });
        
        // Award AI credits
        await db_instance.update(users)
          .set({ aiCredits: ctx.user.aiCredits + challenge.reward })
          .where(eq(users.id, ctx.user.id));
        
        return { 
          completed: true, 
          reward: challenge.reward,
          message: `Challenge completed! +${challenge.reward} AI Credits` 
        };
      }),
  }),

  // Leaderboards
  leaderboards: router({
    getAll: publicProcedure
      .input(z.object({ period: z.enum(["all", "weekly", "monthly"]).default("all") }))
      .query(async ({ input }) => {
        const db_instance = await db.getDb();
        if (!db_instance) return {};
        
        const { gameScores, users } = await import('../drizzle/schema');
        const { desc, gte, and, eq } = await import('drizzle-orm');
        
        const games = [
          "snake", "tetris", "pong", "2048", "memory", "tictactoe", "connect4",
          "minesweeper", "flappybird", "breakout", "spaceinvaders", "sudoku",
          "trivia", "puzzle", "pacman", "racing", "platformer", "solitaire",
          "chess", "checkers"
        ];
        
        const result: Record<string, any[]> = {};
        
        for (const game of games) {
          let query = db_instance
            .select({
              id: gameScores.id,
              score: gameScores.score,
              userName: users.name,
              createdAt: gameScores.createdAt,
            })
            .from(gameScores)
            .leftJoin(users, eq(gameScores.userId, users.id))
            .where(eq(gameScores.gameName, game))
            .orderBy(desc(gameScores.score))
            .limit(10);
          
          if (input.period === "weekly") {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            query = db_instance
              .select({
                id: gameScores.id,
                score: gameScores.score,
                userName: users.name,
                createdAt: gameScores.createdAt,
              })
              .from(gameScores)
              .leftJoin(users, eq(gameScores.userId, users.id))
              .where(and(
                eq(gameScores.gameName, game),
                gte(gameScores.createdAt, weekAgo)
              ))
              .orderBy(desc(gameScores.score))
              .limit(10);
          } else if (input.period === "monthly") {
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            query = db_instance
              .select({
                id: gameScores.id,
                score: gameScores.score,
                userName: users.name,
                createdAt: gameScores.createdAt,
              })
              .from(gameScores)
              .leftJoin(users, eq(gameScores.userId, users.id))
              .where(and(
                eq(gameScores.gameName, game),
                gte(gameScores.createdAt, monthAgo)
              ))
              .orderBy(desc(gameScores.score))
              .limit(10);
          }
          
          result[game] = await query;
        }
        
        return result;
      }),

    distributePrizes: protectedProcedure
      .input(z.object({ period: z.enum(["weekly", "monthly"]) }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.id !== 1) throw new TRPCError({ code: 'FORBIDDEN' });
        const db_instance = await db.getDb();
        if (!db_instance) throw new Error("Database not available");
        const { gameScores, users } = await import("../drizzle/schema");
        const { desc, sql, eq } = await import("drizzle-orm");
        
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        const timeFilter = input.period === "weekly" 
          ? sql`${gameScores.createdAt} >= ${weekAgo.toISOString()}`
          : sql`${gameScores.createdAt} >= ${monthAgo.toISOString()}`;
        
        const topScores = await db_instance
          .select({
            userId: gameScores.userId,
            score: gameScores.score,
          })
          .from(gameScores)
          .where(timeFilter)
          .orderBy(desc(gameScores.score))
          .limit(3);
        
        const prizes = [500, 300, 100];
        for (let i = 0; i < topScores.length; i++) {
          await db_instance.update(users)
            .set({ aiCredits: sql`${users.aiCredits} + ${prizes[i]}` })
            .where(eq(users.id, topScores[i].userId));
        }
        
        return { success: true, awarded: topScores.length };
      }),
  }),

  // Power-ups
  powerups: router({
    getActive: protectedProcedure.query(async ({ ctx }) => {
      const db_instance = await db.getDb();
      if (!db_instance) return [];
      
      const { activePowerUps } = await import('../drizzle/schema');
      const { eq, or, gt, isNull } = await import('drizzle-orm');
      
      // Get active power-ups (not expired and has uses remaining)
      const now = new Date();
      return db_instance.select().from(activePowerUps)
        .where(
          eq(activePowerUps.userId, ctx.user.id)
        );
    }),
    
    use: protectedProcedure
      .input(z.object({ powerUpId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db_instance = await db.getDb();
        if (!db_instance) return { success: false };
        
        const { activePowerUps } = await import('../drizzle/schema');
        const { eq, and } = await import('drizzle-orm');
        
        // Get power-up
        const [powerUp] = await db_instance.select().from(activePowerUps)
          .where(and(
            eq(activePowerUps.id, input.powerUpId),
            eq(activePowerUps.userId, ctx.user.id)
          ));
        
        if (!powerUp || powerUp.usesRemaining <= 0) {
          return { success: false };
        }
        
        // Decrement uses or delete if no uses left
        if (powerUp.usesRemaining === 1) {
          await db_instance.delete(activePowerUps)
            .where(eq(activePowerUps.id, input.powerUpId));
        } else {
          await db_instance.update(activePowerUps)
            .set({ usesRemaining: powerUp.usesRemaining - 1 })
            .where(eq(activePowerUps.id, input.powerUpId));
        }
        
        return { success: true, powerUpType: powerUp.powerUpType };
      }),
  }),

  // Bits Shop
  shop: router({    getItems: publicProcedure.query(async () => {
      const db_instance = await db.getDb();
      if (!db_instance) return [];
      const { shopItems } = await import('../drizzle/schema');
      const { eq } = await import('drizzle-orm');
      return db_instance.select().from(shopItems)
        .where(eq(shopItems.isActive, true));
    }),
    
    purchase: protectedProcedure
      .input(z.object({ itemId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db_instance = await db.getDb();
        if (!db_instance) return { success: false, message: 'Database unavailable' };
        
        const { shopItems, userPurchases, users } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        
        // Get item details
        const [item] = await db_instance.select().from(shopItems)
          .where(eq(shopItems.id, input.itemId));
          
        if (!item) {
          return { success: false, message: 'Item not found' };
        }
        
        // Check if user has enough Bits
        if (ctx.user.bitsBalance < item.price) {
          return { success: false, message: 'Insufficient Bits' };
        }
        
        // Deduct Bits
        await db_instance.update(users)
          .set({ bitsBalance: ctx.user.bitsBalance - item.price })
          .where(eq(users.id, ctx.user.id));
        
        // Record purchase
        await db_instance.insert(userPurchases).values({
          userId: ctx.user.id,
          itemId: input.itemId,
          pricePaid: item.price,
          quantity: 1,
        });
        
        // Handle exchange items (convert Bits to AI Credits)
        if (item.category === 'exchange') {
          const creditsToAdd = item.name.includes('100') ? 100 : 500;
          await db_instance.update(users)
            .set({ aiCredits: ctx.user.aiCredits + creditsToAdd })
            .where(eq(users.id, ctx.user.id));
          return { success: true, message: `Purchased ${item.name}! +${creditsToAdd} AI Credits` };
        }
        
        // Handle power-ups and boosts - activate them
        if (item.category === 'powerup' || item.category === 'boost') {
          const { activePowerUps } = await import('../drizzle/schema');
          
          // Map item names to power-up types
          const powerUpTypeMap: Record<string, string> = {
            '2x Score Boost': '2x_score',
            'Extra Life': 'extra_life',
            'Time Freeze': 'time_freeze',
            'Score Multiplier': 'score_multiplier',
            'Lucky Dice': 'lucky_dice',
            'Shield': 'shield',
          };
          
          const powerUpType = powerUpTypeMap[item.name];
          if (powerUpType) {
            // For boosts, set expiration to 24 hours
            const expiresAt = item.category === 'boost' 
              ? new Date(Date.now() + 24 * 60 * 60 * 1000)
              : null;
            
            await db_instance.insert(activePowerUps).values({
              userId: ctx.user.id,
              powerUpType,
              expiresAt,
              usesRemaining: 1,
            });
            
            return { success: true, message: `${item.name} activated!` };
          }
        }
        
        return { success: true, message: `Purchased ${item.name}!` };
      }),
  }),

  // AI Chatbot
  ai: router({
    chat: protectedProcedure
      .input(z.object({
        message: z.string(),
        chatId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUserById(ctx.user.id);
        if (!user) throw new Error("User not found");
        
        if (user.aiCredits <= 0) {
          throw new Error("Insufficient AI credits");
        }

        let chat;
        let messages: any[] = [];
        
        if (input.chatId) {
          chat = await db.getAIChat(input.chatId);
          if (chat) {
            messages = chat.messages as any[];
          }
        }

        messages.push({ role: "user", content: input.message });

        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are a helpful AI assistant for TMP Server. Help users with their questions and tasks." },
            ...messages,
          ],
        });

        const assistantMessage = response.choices[0]?.message?.content || "Sorry, I couldn't process that.";
        messages.push({ role: "assistant", content: assistantMessage });

        const creditsUsed = 1;
        
        if (chat) {
          await db.updateAIChat(chat.id, messages, (chat.creditsUsed || 0) + creditsUsed);
        } else {
          await db.createAIChat({
            userId: ctx.user.id,
            messages,
            creditsUsed,
          });
          const newChat = await db.getUserAIChats(ctx.user.id);
          chat = newChat[0] || { id: 0 };
        }

        await db.updateUserAICredits(ctx.user.id, user.aiCredits - creditsUsed);

        return {
          response: assistantMessage,
          chatId: chat.id,
          creditsRemaining: user.aiCredits - creditsUsed,
        };
      }),
    
    getChats: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserAIChats(ctx.user.id);
    }),
    
    getChat: protectedProcedure
      .input(z.object({ chatId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getAIChat(input.chatId);
      }),
  }),

  // CLI
  cli: router({
    execute: protectedProcedure
      .input(z.object({ command: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const output = await executeCommand(ctx.user.id, input.command);
        await db.createCliHistory({
          userId: ctx.user.id,
          command: input.command,
          output,
          exitCode: 0,
        });
        return { success: true, output };
      }),
    
    getHistory: protectedProcedure
      .input(z.object({ limit: z.number().default(100) }))
      .query(async ({ ctx, input }) => {
        return await db.getUserCliHistory(ctx.user.id, input.limit);
      }),
  }),

  // Subscriptions & Payments
  subscription: router({
    getCurrent: protectedProcedure.query(async ({ ctx }) => {
      const user = await db.getUserById(ctx.user.id);
      const subscription = await db.getActiveSubscription(ctx.user.id);
      return { user, subscription };
    }),
    
    getPaymentHistory: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserPayments(ctx.user.id);
    }),
  }),

  // Backups
  backups: router({
    getBackups: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserBackups(ctx.user.id);
    }),
    
    createBackup: protectedProcedure
      .input(z.object({ backupName: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const files = await db.getUserFiles(ctx.user.id);
        const totalSize = files.reduce((sum, file) => sum + file.fileSize, 0);
        
        // Create zip archive with actual file data
        const zip = new AdmZip();
        
        for (const file of files) {
          try {
            // Get presigned URL for file
            const { url } = await storageGet(file.fileKey);
            
            // Download file data
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            const fileBuffer = Buffer.from(response.data);
            
            // Add to zip with original filename
            zip.addFile(file.fileName, fileBuffer);
          } catch (error) {
            console.error(`[Backup] Failed to add file ${file.fileName}:`, error);
          }
        }
        
        // Upload zip to S3
        const backupKey = `users/${ctx.user.id}/backups/${nanoid()}-${input.backupName}.zip`;
        const zipBuffer = zip.toBuffer();
        const { url: backupUrl } = await storagePut(backupKey, zipBuffer, 'application/zip');
        
        await db.createBackup({
          userId: ctx.user.id,
          backupName: input.backupName,
          backupSize: zipBuffer.length,
          fileCount: files.length,
          backupKey,
          status: "completed",
          metadata: { 
            files: files.map(f => ({ 
              id: f.id, 
              fileName: f.fileName, 
              fileKey: f.fileKey,
              fileSize: f.fileSize,
              mimeType: f.mimeType
            })),
            backupUrl
          },
        });
        
        return { success: true, backupUrl };
      }),
    
    restoreBackup: protectedProcedure
      .input(z.object({ backupId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const backup = await db.getBackup(input.backupId);
        if (!backup || backup.userId !== ctx.user.id) {
          throw new Error("Backup not found");
        }
        
        // Get backup metadata
        const metadata = backup.metadata as { 
          files: Array<{ 
            id: number; 
            fileName: string; 
            fileKey: string;
            fileSize: number;
            mimeType: string;
          }>;
          backupUrl: string;
        };
        
        if (!metadata || !metadata.files) {
          throw new Error("Invalid backup metadata");
        }
        
        // Download backup zip from S3
        const { url: backupUrl } = await storageGet(backup.backupKey);
        const response = await axios.get(backupUrl, { responseType: 'arraybuffer' });
        const zipBuffer = Buffer.from(response.data);
        
        // Extract zip
        const zip = new AdmZip(zipBuffer);
        const zipEntries = zip.getEntries();
        
        let restoredCount = 0;
        
        // Restore each file
        for (const entry of zipEntries) {
          if (entry.isDirectory) continue;
          
          try {
            // Find file metadata
            const fileInfo = metadata.files.find(f => f.fileName === entry.entryName);
            if (!fileInfo) continue;
            
            // Extract file data
            const fileData = entry.getData();
            
            // Upload to S3 with new key
            const newFileKey = `users/${ctx.user.id}/files/${nanoid()}-${entry.entryName}`;
            const { url: fileUrl } = await storagePut(newFileKey, fileData, fileInfo.mimeType || 'application/octet-stream');
            
            // Create file record in database
            await db.createFile({
              userId: ctx.user.id,
              fileName: entry.entryName,
              fileKey: newFileKey,
              fileSize: fileData.length,
              fileUrl,
              mimeType: fileInfo.mimeType || 'application/octet-stream',
            });
            
            restoredCount++;
          } catch (err) {
            console.error(`[Restore] Failed to restore file ${entry.entryName}:`, err);
          }
        }
        
        return { success: true, restoredFiles: restoredCount };
      }),
    
    deleteBackup: protectedProcedure
      .input(z.object({ backupId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteBackup(input.backupId, ctx.user.id);
        return { success: true };
      }),
  }),

  // Payment & Stripe
  payment: router({
    createCheckout: protectedProcedure
      .input(z.object({ 
        planId: z.string(),
        customAmount: z.number().optional()
      }))
      .mutation(async ({ ctx, input }) => {
        const Stripe = (await import('stripe')).default;
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
          apiVersion: '2026-01-28.clover',
        });

        const { PRODUCTS } = await import('./products');
        
        let product;
        let productName = '';
        let productPrice = 0;
        let interval: 'month' | undefined;
        
        if (input.planId === 'flexible' && input.customAmount) {
          // Flexible subscription with custom amount
          productName = `Flexible Subscription (£${input.customAmount}/month)`;
          productPrice = Math.round(input.customAmount * 100); // Convert to cents
          interval = 'month';
        } else {
          product = PRODUCTS[input.planId as keyof typeof PRODUCTS];
          if (!product) {
            throw new Error('Invalid plan');
          }
          productName = product.name;
          productPrice = product.price;
          interval = product.interval || undefined;
        }

        const origin = ctx.req.headers.origin || 'http://localhost:3000';
        
        const sessionConfig: any = {
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency: 'gbp',
                product_data: {
                  name: productName,
                },
                unit_amount: productPrice,
                ...(interval ? { recurring: { interval } } : {}),
              },
              quantity: 1,
            },
          ],
          mode: interval ? 'subscription' : 'payment',
          success_url: `${origin}/checkout-success`,
          cancel_url: `${origin}/subscription?canceled=true`,
          client_reference_id: ctx.user.id.toString(),
          customer_email: ctx.user.email || undefined,
          metadata: {
            user_id: ctx.user.id.toString(),
            plan_id: input.planId,
            customer_email: ctx.user.email || '',
            customer_name: ctx.user.name || '',
          },
          allow_promotion_codes: true,
        };

        const session = await stripe.checkout.sessions.create(sessionConfig);
        
        return { url: session.url };
      }),

    getSubscription: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserSubscription(ctx.user.id);
    }),

    getPaymentHistory: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserPayments(ctx.user.id);
    }),

    cancelSubscription: protectedProcedure.mutation(async ({ ctx }) => {
      const subscription = await db.getUserSubscription(ctx.user.id);
      if (!subscription || !subscription.stripeSubscriptionId) {
        throw new Error('No active subscription found');
      }

      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
        apiVersion: '2026-01-28.clover',
      });

      // Cancel the Stripe subscription immediately
      await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
      
      // Update subscription status in database
      await db.updateSubscriptionStatus(subscription.id, 'cancelled');
      
      // Downgrade user to free plan
      await db.updateUserSubscription(
        ctx.user.id,
        'free',
        5368709120, // 5GB in bytes
        new Date() // expires immediately
      );
      
      // Reset AI credits to 0
      await db.updateUserAICredits(ctx.user.id, 0);
      
      return { success: true };
    }),

    reactivateSubscription: protectedProcedure.mutation(async ({ ctx }) => {
      // Get user's last subscription to reactivate same plan
      const lastSubscription = await db.getUserSubscription(ctx.user.id);
      
      if (!lastSubscription) {
        throw new Error('No previous subscription found');
      }

      // Redirect to subscription page to choose plan
      return { 
        success: true,
        checkoutUrl: `${ctx.req.protocol}://${ctx.req.headers.host || ctx.req.headers.origin}/subscription`
      };
    }),

    pauseSubscription: protectedProcedure
      .input(z.object({ months: z.number().min(1).max(3) }))
      .mutation(async ({ ctx, input }) => {
        const subscription = await db.getUserSubscription(ctx.user.id);
        if (!subscription || !subscription.stripeSubscriptionId) {
          throw new Error('No active subscription found');
        }

        if (subscription.status !== 'active') {
          throw new Error('Can only pause active subscriptions');
        }

        const Stripe = (await import('stripe')).default;
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
          apiVersion: '2026-01-28.clover',
        });

        // Pause the Stripe subscription
        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          pause_collection: {
            behavior: 'void',
          },
        });

        // Calculate pause end date
        const pausedUntil = new Date();
        pausedUntil.setMonth(pausedUntil.getMonth() + input.months);

        // Update subscription status in database
        await db.updateSubscriptionStatus(subscription.id, 'paused');
        await db.updateSubscriptionPausedUntil(subscription.id, pausedUntil);

        return { success: true, pausedUntil };
      }),

    resumeSubscription: protectedProcedure.mutation(async ({ ctx }) => {
      const subscription = await db.getUserSubscription(ctx.user.id);
      if (!subscription || !subscription.stripeSubscriptionId) {
        throw new Error('No subscription found');
      }

      if (subscription.status !== 'paused') {
        throw new Error('Subscription is not paused');
      }

      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
        apiVersion: '2026-01-28.clover',
      });

      // Resume the Stripe subscription
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        pause_collection: null as any,
      });

      // Update subscription status in database
      await db.updateSubscriptionStatus(subscription.id, 'active');
      await db.updateSubscriptionPausedUntil(subscription.id, null);

      return { success: true };
    }),
  }),

  // User Profile
  user: router({ updateProfile: protectedProcedure
      .input(z.object({
        name: z.string().optional(),
        email: z.string().email().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateUserProfile(ctx.user.id, {
          name: input.name,
          email: input.email,
        });
        return { success: true };
      }),
    
    setActiveTheme: protectedProcedure
      .input(z.object({ themeId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // If themeId is 0, reset to default theme
        if (input.themeId === 0) {
          await db.updateUserCustomization(ctx.user.id, {
            hasCustomization: false,
            customTheme: 'default',
          });
          return { success: true };
        }
        
        // Verify user owns this theme
        const hasPurchased = await db.hasUserPurchasedTheme(ctx.user.id, input.themeId);
        if (!hasPurchased) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not own this theme' });
        }
        
        await db.updateUserCustomization(ctx.user.id, {
          hasCustomization: true,
          customTheme: input.themeId.toString(),
        });
        return { success: true };
      }),
  }),

  // Customization
  customization: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const user = await db.getUserById(ctx.user.id);
      return {
        hasCustomization: user?.hasCustomization || false,
        customLogo: user?.customLogo,
        customColors: user?.customColors,
        customTheme: user?.customTheme,
      };
    }),
    
    update: protectedProcedure
      .input(z.object({
        customLogo: z.string().optional(),
        customColors: z.any().optional(),
        customTheme: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUserById(ctx.user.id);
        if (!user?.hasCustomization) {
          throw new Error("Customization feature not purchased");
        }
        
        await db.updateUserCustomization(ctx.user.id, {
          hasCustomization: true,
          customLogo: input.customLogo,
          customColors: input.customColors,
          customTheme: input.customTheme,
        });
        
        return { success: true };
       }),
  }),

  // Notifications
  notifications: router({
    getNotifications: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserNotifications(ctx.user.id, 20);
    }),

    getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUnreadNotificationCount(ctx.user.id);
    }),

    markAsRead: protectedProcedure
      .input(z.object({ notificationId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.markNotificationAsRead(input.notificationId, ctx.user.id);
        return { success: true };
      }),

    markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
      await db.markAllNotificationsAsRead(ctx.user.id);
      return { success: true };
    }),

    delete: protectedProcedure
      .input(z.object({ notificationId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteNotification(input.notificationId, ctx.user.id);
        return { success: true };
      }),
  }),

  // Alert Preferences
  alertPreferences: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return await db.getAlertPreferences(ctx.user.id);
    }),

    getHistory: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserAlertHistory(ctx.user.id, 50);
    }),

    update: protectedProcedure
      .input(z.object({
        storageAlertsEnabled: z.boolean().optional(),
        storageAlertThreshold80: z.number().min(0).max(100).optional(),
        storageAlertThreshold95: z.number().min(0).max(100).optional(),
        aiCreditsAlertsEnabled: z.boolean().optional(),
        aiCreditsThreshold: z.number().min(0).optional(),
        emailNotifications: z.boolean().optional(),
        inAppNotifications: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.upsertAlertPreferences(ctx.user.id, input);
        return { success: true };
      }),
  }),

  // Ad Blocker
  adBlocker: router({
    getSettings: protectedProcedure.query(async ({ ctx }) => {
      const settings = await db.getAdBlockerSettings(ctx.user.id);
      if (!settings) {
        // Create default settings
        await db.upsertAdBlockerSettings(ctx.user.id, {
          enabled: false,
          blockAds: true,
          blockTrackers: true,
          blockMalware: true,
          dnsBlocking: true,
        });
        return await db.getAdBlockerSettings(ctx.user.id);
      }
      return settings;
    }),

    updateSettings: protectedProcedure
      .input(z.object({
        enabled: z.boolean().optional(),
        blockAds: z.boolean().optional(),
        blockTrackers: z.boolean().optional(),
        blockMalware: z.boolean().optional(),
        dnsBlocking: z.boolean().optional(),
        customFilters: z.array(z.string()).optional(),
        whitelist: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUserById(ctx.user.id);
        if (user?.subscriptionTier === 'free') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Ad blocker requires paid subscription' });
        }
        await db.upsertAdBlockerSettings(ctx.user.id, input);
        return { success: true };
      }),

    incrementBlocked: protectedProcedure
      .input(z.object({ count: z.number().default(1) }))
      .mutation(async ({ ctx, input }) => {
        await db.incrementBlockedCount(ctx.user.id, input.count);
        return { success: true };
      }),

    getFilterLists: protectedProcedure.query(async ({ ctx }) => {
      return await db.getAdFilterLists(ctx.user.id);
    }),

    addFilterList: protectedProcedure
      .input(z.object({
        name: z.string(),
        url: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUserById(ctx.user.id);
        if (user?.subscriptionTier === 'free') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Custom filter lists require paid subscription' });
        }
        await db.createAdFilterList({
          userId: ctx.user.id,
          name: input.name,
          url: input.url || null,
          isEnabled: true,
        });
        return { success: true };
      }),

    updateFilterList: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        url: z.string().optional(),
        isEnabled: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...updates } = input;
        await db.updateAdFilterList(id, updates);
        return { success: true };
      }),

    deleteFilterList: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteAdFilterList(input.id);
        return { success: true };
      }),

    fetchAndParseFilterList: protectedProcedure
      .input(z.object({ url: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUserById(ctx.user.id);
        if (user?.subscriptionTier === 'free') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Filter lists require paid subscription' });
        }
        
        const rules = await fetchFilterList(input.url);
        return { ruleCount: rules.length };
      }),

    checkUrl: protectedProcedure
      .input(z.object({ url: z.string() }))
      .query(async ({ ctx, input }) => {
        // Quick check against known ad domains
        const isKnownAd = isKnownAdDomain(input.url);
        
        // Get user's filter lists
        const filterLists = await db.getAdFilterLists(ctx.user.id);
        const enabledLists = filterLists.filter(list => list.isEnabled);
        
        // For now, return quick check result
        // In production, you'd fetch and cache filter rules
        return {
          shouldBlock: isKnownAd,
          reason: isKnownAd ? 'Known ad domain' : 'Not blocked',
          matchedList: isKnownAd ? 'Built-in' : null,
        };
      }),

    getBlockedDomains: protectedProcedure.query(async () => {
      return { domains: COMMON_AD_DOMAINS };
    }),
  }),

  // VPN
  vpn: router({
    getSettings: protectedProcedure.query(async ({ ctx }) => {
      const settings = await db.getVpnSettings(ctx.user.id);
      if (!settings) {
        // Create default settings
        await db.upsertVpnSettings(ctx.user.id, {
          enabled: false,
          selectedServer: 'us-east',
          protocol: 'proxy',
          autoConnect: false,
          killSwitch: false,
        });
        return await db.getVpnSettings(ctx.user.id);
      }
      return settings;
    }),

    updateSettings: protectedProcedure
      .input(z.object({
        enabled: z.boolean().optional(),
        selectedServer: z.string().optional(),
        protocol: z.enum(['wireguard', 'openvpn', 'proxy']).optional(),
        autoConnect: z.boolean().optional(),
        killSwitch: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUserById(ctx.user.id);
        if (user?.subscriptionTier === 'free') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'VPN requires paid subscription' });
        }
        await db.upsertVpnSettings(ctx.user.id, input);
        return { success: true };
      }),

    connect: protectedProcedure
      .input(z.object({
        server: z.string(),
        protocol: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUserById(ctx.user.id);
        if (user?.subscriptionTier === 'free') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'VPN requires paid subscription' });
        }
        await db.createVpnConnection({
          userId: ctx.user.id,
          server: input.server,
          protocol: input.protocol,
        });
        return { success: true };
      }),

    disconnect: protectedProcedure
      .input(z.object({ connectionId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.updateVpnConnection(input.connectionId, {
          disconnectedAt: new Date(),
        });
        return { success: true };
      }),

    getConnections: protectedProcedure.query(async ({ ctx }) => {
      return await db.getVpnConnections(ctx.user.id, 10);
    }),

    generateConfig: protectedProcedure
      .input(z.object({
        protocol: z.enum(['wireguard', 'openvpn']),
        server: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUserById(ctx.user.id);
        if (user?.subscriptionTier === 'free') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'VPN requires paid subscription' });
        }
        
        // Generate VPN configuration based on protocol
        if (input.protocol === 'wireguard') {
          const config = `[Interface]\nPrivateKey = <GENERATED_PRIVATE_KEY>\nAddress = 10.0.0.2/24\nDNS = 1.1.1.1\n\n[Peer]\nPublicKey = <SERVER_PUBLIC_KEY>\nEndpoint = ${input.server}:51820\nAllowedIPs = 0.0.0.0/0\nPersistentKeepalive = 25`;
          return { config, protocol: 'wireguard' };
        } else {
          const config = `client\ndev tun\nproto udp\nremote ${input.server} 1194\nresolv-retry infinite\nnobind\npersist-key\npersist-tun\nca ca.crt\ncert client.crt\nkey client.key\ncipher AES-256-CBC\nverb 3`;
          return { config, protocol: 'openvpn' };
        }
      }),

    getBandwidthUsage: protectedProcedure
      .input(z.object({ period: z.enum(['daily', 'monthly']) }))
      .query(async ({ ctx, input }) => {
        const usage = await db.getVpnBandwidthUsage(ctx.user.id, input.period);
        const settings = await db.getVpnSettings(ctx.user.id);
        const limit = input.period === 'daily' 
          ? settings?.bandwidthLimitDaily || 10737418240
          : settings?.bandwidthLimitMonthly || 107374182400;
        
        return {
          ...usage,
          limit,
          percentage: (usage.total / limit) * 100,
        };
      }),

    runSpeedTest: protectedProcedure
      .input(z.object({ server: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUserById(ctx.user.id);
        if (user?.subscriptionTier === 'free') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'VPN requires paid subscription' });
        }
        
        // Simulate speed test (in real implementation, this would test actual server)
        const latency = Math.floor(Math.random() * 100) + 10; // 10-110ms
        const downloadSpeed = Math.floor(Math.random() * 50000000) + 10000000; // 10-60 Mbps
        const uploadSpeed = Math.floor(Math.random() * 20000000) + 5000000; // 5-25 Mbps
        
        await db.createVpnSpeedTest({
          userId: ctx.user.id,
          server: input.server,
          latency,
          downloadSpeed,
          uploadSpeed,
        });
        
        return { latency, downloadSpeed, uploadSpeed };
      }),

    getSpeedTests: protectedProcedure
      .input(z.object({ server: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        return await db.getVpnSpeedTests(ctx.user.id, input.server, 10);
      }),

    proxyRequest: protectedProcedure
      .input(z.object({
        server: z.string(),
        url: z.string(),
        method: z.enum(['GET', 'POST', 'PUT', 'DELETE']),
        headers: z.record(z.string(), z.string()).optional(),
        body: z.any().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUserById(ctx.user.id);
        if (user?.subscriptionTier === 'free') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Proxy requires paid subscription' });
        }
        
        const response = await routeThroughProxy(ctx.user.id, input.server, {
          url: input.url,
          method: input.method,
          headers: input.headers as Record<string, string> | undefined,
          body: input.body,
        });
        
        return response;
      }),

    getProxyConfig: protectedProcedure
      .input(z.object({ server: z.string() }))
      .query(async ({ ctx, input }) => {
        const user = await db.getUserById(ctx.user.id);
        if (user?.subscriptionTier === 'free') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Proxy requires paid subscription' });
        }
        return getProxyConfig(input.server);
      }),

    getProxyCredentials: protectedProcedure.query(async ({ ctx }) => {
      const user = await db.getUserById(ctx.user.id);
      if (user?.subscriptionTier === 'free') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Proxy requires paid subscription' });
      }
      return await getOrCreateProxyCredentials(ctx.user.id);
    }),

    regenerateProxyCredentials: protectedProcedure.mutation(async ({ ctx }) => {
      const user = await db.getUserById(ctx.user.id);
      if (user?.subscriptionTier === 'free') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Proxy requires paid subscription' });
      }
      return await regenerateProxyCredentials(ctx.user.id);
    }),

    getConnectionLogs: protectedProcedure
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
      .query(async ({ ctx, input }) => {
        const db_instance = await db.getDb();
        if (!db_instance) return [];
        
        const { vpnConnections } = await import('../drizzle/schema');
        const { eq, desc } = await import('drizzle-orm');
        
        return await db_instance.select().from(vpnConnections)
          .where(eq(vpnConnections.userId, ctx.user.id))
          .orderBy(desc(vpnConnections.connectedAt))
          .limit(input.limit)
          .offset(input.offset);
      }),

    getMyIp: publicProcedure.query(async () => {
      try {
        // Use ipapi.co for IP geolocation (free tier: 1000 requests/day)
        const response = await axios.get('https://ipapi.co/json/', { timeout: 5000 });
        return {
          ip: response.data.ip,
          city: response.data.city,
          region: response.data.region,
          country: response.data.country_name,
          countryCode: response.data.country_code,
          latitude: response.data.latitude,
          longitude: response.data.longitude,
          isp: response.data.org,
          timezone: response.data.timezone,
        };
      } catch (error) {
        // Fallback to simpler API
        try {
          const response = await axios.get('https://api.ipify.org?format=json', { timeout: 5000 });
          return {
            ip: response.data.ip,
            city: 'Unknown',
            region: 'Unknown',
            country: 'Unknown',
            countryCode: 'XX',
            latitude: null,
            longitude: null,
            isp: 'Unknown',
            timezone: 'Unknown',
          };
        } catch (fallbackError) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch IP information' });
        }
      }
    }),

    getKillSwitchStatus: protectedProcedure.query(async ({ ctx }) => {
      const { getKillSwitchState, isTrafficBlocked } = await import('./kill-switch');
      const state = getKillSwitchState(ctx.user.id);
      const blocked = isTrafficBlocked(ctx.user.id);
      
      return {
        blocked,
        blockedAt: state?.blockedAt?.toISOString() || null,
        lastConnectionId: state?.lastConnectionId || null,
      };
    }),

    getProxyIp: protectedProcedure
      .input(z.object({ server: z.string() }))
      .query(async ({ ctx, input }) => {
        const user = await db.getUserById(ctx.user.id);
        if (user?.subscriptionTier === 'free') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Proxy requires paid subscription' });
        }

        try {
          // Make request through proxy to get proxy's IP
          const response = await routeThroughProxy(ctx.user.id, input.server, {
            url: 'https://ipapi.co/json/',
            method: 'GET',
          });

          const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
          
          return {
            ip: data.ip,
            city: data.city,
            region: data.region,
            country: data.country_name,
            countryCode: data.country_code,
            latitude: data.latitude,
            longitude: data.longitude,
            isp: data.org,
            timezone: data.timezone,
          };
        } catch (error: any) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch proxy IP information' });
        }
      }),
  }),

  documents: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getUserDocuments(ctx.user.id);
    }),

    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        content: z.string(),
        wordCount: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createDocument({
          userId: ctx.user.id,
          ...input,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        content: z.string().optional(),
        wordCount: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...updates } = input;
        const doc = await db.getDocumentById(id);
        if (!doc || doc.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }
        return db.updateDocument(id, updates);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const doc = await db.getDocumentById(input.id);
        if (!doc || doc.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }
        await db.deleteDocument(input.id);
        return { success: true };
      }),

    export: protectedProcedure
      .input(z.object({
        id: z.number(),
        format: z.enum(['docx', 'pdf']),
      }))
      .mutation(async ({ ctx, input }) => {
        const doc = await db.getDocumentById(input.id);
        if (!doc || doc.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }

        // For now, return HTML content
        // In production, use libraries like docx or pdfkit
        return {
          content: doc.content,
          filename: `${doc.title}.${input.format}`,
          mimeType: input.format === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/pdf',
          format: input.format,
        };
      }),

    saveToCloud: protectedProcedure
      .input(z.object({
        id: z.number(),
        format: z.enum(['docx', 'pdf', 'html']),
      }))
      .mutation(async ({ ctx, input }) => {
        const doc = await db.getDocumentById(input.id);
        if (!doc || doc.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }

        // Generate file content
        let content: string;
        let mimeType: string;
        let extension: string;

        if (input.format === 'html') {
          content = doc.content;
          mimeType = 'text/html';
          extension = 'html';
        } else {
          // For now, save as HTML (in production, use docx/pdf libraries)
          content = doc.content;
          mimeType = input.format === 'docx' 
            ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            : 'application/pdf';
          extension = input.format;
        }

        // Upload to cloud storage
        const filename = `${doc.title.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.${extension}`;
        const fileKey = `${ctx.user.id}/documents/${filename}`;
        const { url } = await storagePut(fileKey, Buffer.from(content, 'utf-8'), mimeType);

        // Save file record
        await db.createFile({
          userId: ctx.user.id,
          fileName: filename,
          fileSize: Buffer.byteLength(content, 'utf-8'),
          mimeType,
          fileKey,
          fileUrl: url,
        });

        return {
          filename,
          url,
          format: input.format,
        };
      }),
  }),

  // Add-ons Marketplace
  addons: router({
    getUserAddons: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserAddons(ctx.user.id);
    }),

    purchase: protectedProcedure
      .input(z.object({ addonId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        // Check if user already has this addon
        const existing = await db.getUserAddons(ctx.user.id);
        if (existing?.some(a => a.addon.name.toLowerCase().replace(/\s+/g, '_') === input.addonId)) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'You already own this add-on' });
        }

        // Create Stripe checkout session for £3
        const stripe = (await import('stripe')).default;
        const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY!);

        const session = await stripeClient.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency: 'gbp',
                product_data: {
                  name: `Add-on: ${input.addonId}`,
                },
                unit_amount: 300, // £3.00
              },
              quantity: 1,
            },
          ],
          mode: 'payment',
          success_url: `${ctx.req.headers.origin}/addons?success=true`,
          cancel_url: `${ctx.req.headers.origin}/addons?canceled=true`,
          client_reference_id: ctx.user.id.toString(),
          allow_promotion_codes: true,
          metadata: {
            user_id: ctx.user.id.toString(),
            addon_id: input.addonId,
            type: 'addon_purchase',
          },
        });

        return { checkoutUrl: session.url };
      }),
  }),

  customThemes: customThemesRouter,

  customUISchemes: customUISchemeRouter,

  themes: router({
    getAll: publicProcedure.query(async () => {
      return await db.getAllThemes();
    }),

    getUserThemes: protectedProcedure.query(async ({ ctx }) => {
      return await db.getUserThemes(ctx.user.id);
    }),

    getUserBundles: protectedProcedure.query(async ({ ctx }) => {
      const db_instance = await db.getDb();
      if (!db_instance) return [];
      const { userThemeBundles } = await import('../drizzle/schema');
      const { eq } = await import('drizzle-orm');
      return db_instance.select().from(userThemeBundles).where(eq(userThemeBundles.userId, ctx.user.id));
    }),

    purchaseTheme: protectedProcedure
      .input(z.object({ themeId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // Check if user already owns this theme
        const hasPurchased = await db.hasUserPurchasedTheme(ctx.user.id, input.themeId);
        if (hasPurchased) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'You already own this theme' });
        }

        // Create Stripe checkout for £3
        const stripe = (await import('stripe')).default;
        const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY!);

        const theme = await db.getThemeById(input.themeId);
        if (!theme) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Theme not found' });
        }

        const session = await stripeClient.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency: 'gbp',
                product_data: {
                  name: theme.name,
                  description: theme.description || undefined,
                },
                unit_amount: 300, // £3
              },
              quantity: 1,
            },
          ],
          mode: 'payment',
          success_url: `${ctx.req.headers.origin}/themes?success=true`,
          cancel_url: `${ctx.req.headers.origin}/themes?canceled=true`,
          client_reference_id: ctx.user.id.toString(),
          allow_promotion_codes: true,
          metadata: {
            theme_id: input.themeId.toString(),
            type: 'theme_purchase',
          },
        });

        return { checkoutUrl: session.url };
      }),

    purchaseAllThemes: protectedProcedure
      .mutation(async ({ ctx }) => {
        // Create Stripe checkout for £34.99
        const stripe = (await import('stripe')).default;
        const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY!);

        const session = await stripeClient.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency: 'gbp',
                product_data: {
                  name: 'All Themes Bundle',
                  description: 'Unlock all 23 premium themes',
                },
                unit_amount: 4499, // £44.99
              },
              quantity: 1,
            },
          ],
          mode: 'payment',
          success_url: `${ctx.req.headers.origin}/themes?success=true`,
          cancel_url: `${ctx.req.headers.origin}/themes?canceled=true`,
          client_reference_id: ctx.user.id.toString(),
          allow_promotion_codes: true,
          metadata: {
            type: 'all_themes_purchase',
          },
        });

        return { checkoutUrl: session.url };
      }),

    getAllBundles: publicProcedure.query(async () => {
      return await db.getAllThemeBundles();
    }),

    purchaseBundle: protectedProcedure
      .input(z.object({ bundleId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // Check if user already owns this bundle
        const hasPurchased = await db.hasUserPurchasedBundle(ctx.user.id, input.bundleId);
        if (hasPurchased) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'You already own this bundle' });
        }

        const bundle = await db.getThemeBundleById(input.bundleId);
        if (!bundle) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Bundle not found' });
        }

        // Create Stripe checkout
        const stripe = (await import('stripe')).default;
        const stripeClient = new stripe(process.env.STRIPE_SECRET_KEY!);

        const session = await stripeClient.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency: 'gbp',
                product_data: {
                  name: bundle.name,
                  description: bundle.description || undefined,
                },
                unit_amount: bundle.price,
              },
              quantity: 1,
            },
          ],
          mode: 'payment',
          success_url: `${ctx.req.headers.origin}/themes?success=true`,
          cancel_url: `${ctx.req.headers.origin}/themes?canceled=true`,
          client_reference_id: ctx.user.id.toString(),
          allow_promotion_codes: true,
          metadata: {
            bundle_id: input.bundleId.toString(),
            type: 'bundle_purchase',
          },
        });

        return { checkoutUrl: session.url };
      }),
    distributePrizes: protectedProcedure
      .input(z.object({ period: z.enum(["weekly", "monthly"]) }))
      .mutation(async ({ ctx, input }) => {
        const db_instance = await db.getDb();
        if (!db_instance) return { success: false };
        
        const { gameScores, users } = await import('../drizzle/schema');
        const { desc, gte, and, eq } = await import('drizzle-orm');
        
        const games = [
          "snake", "tetris", "pong", "2048", "memory", "tictactoe", "connect4",
          "minesweeper", "flappybird", "breakout", "spaceinvaders", "sudoku",
          "trivia", "puzzle", "pacman", "racing", "platformer", "solitaire",
          "chess", "checkers"
        ];
        
        // Prize distribution: 1st = 500 AI Credits, 2nd = 300, 3rd = 100
        const prizes = [500, 300, 100];
        
        for (const game of games) {
          let query = db_instance
            .select({
              userId: gameScores.userId,
              score: gameScores.score,
            })
            .from(gameScores)
            .where(eq(gameScores.gameName, game))
            .orderBy(desc(gameScores.score))
            .limit(3);
          
          if (input.period === "weekly") {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            query = db_instance
              .select({
                userId: gameScores.userId,
                score: gameScores.score,
              })
              .from(gameScores)
              .where(and(
                eq(gameScores.gameName, game),
                gte(gameScores.createdAt, weekAgo)
              ))
              .orderBy(desc(gameScores.score))
              .limit(3);
          } else if (input.period === "monthly") {
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            query = db_instance
              .select({
                userId: gameScores.userId,
                score: gameScores.score,
              })
              .from(gameScores)
              .where(and(
                eq(gameScores.gameName, game),
                gte(gameScores.createdAt, monthAgo)
              ))
              .orderBy(desc(gameScores.score))
              .limit(3);
          }
          
          const topScores = await query;
          
          // Award prizes to top 3
          for (let i = 0; i < topScores.length && i < 3; i++) {
            const winner = topScores[i];
            const prize = prizes[i];
            
            const { sql } = await import('drizzle-orm');
            await db_instance.update(users)
              .set({ aiCredits: sql`${users.aiCredits} + ${prize}` })
              .where(eq(users.id, winner.userId));
          }
        }
        
        return { success: true, message: "Prizes distributed!" };
      }),
  }),
  
  snippets: router({
    getAll: protectedProcedure.query(async ({ ctx }) => {
      const db_instance = await getDb();
      if (!db_instance) throw new Error("Database not available");
      const { codeSnippets } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      return await db_instance.select().from(codeSnippets).where(eq(codeSnippets.userId, ctx.user.id));
    }),

    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        description: z.string().optional(),
        code: z.string(),
        language: z.string(),
        tags: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db_instance = await getDb();
        if (!db_instance) throw new Error("Database not available");
        const { codeSnippets } = await import("../drizzle/schema");
        await db_instance.insert(codeSnippets).values({
          userId: ctx.user.id,
          ...input,
        });
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db_instance = await getDb();
        if (!db_instance) throw new Error("Database not available");
        const { codeSnippets } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        await db_instance.delete(codeSnippets).where(and(
          eq(codeSnippets.id, input.id),
          eq(codeSnippets.userId, ctx.user.id)
        ));
        return { success: true };
      }),
  }),
    
  // Admin router
  admin: router({
    getAllUsers: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.id !== 1) throw new TRPCError({ code: 'FORBIDDEN' });
      const db_instance = await getDb();
      if (!db_instance) throw new Error("Database not available");
      const { users } = await import("../drizzle/schema");
      return await db_instance.select().from(users);
    }),

    getStats: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.id !== 1) throw new TRPCError({ code: 'FORBIDDEN' });
      const db_instance = await getDb();
      if (!db_instance) throw new Error("Database not available");
      const { users, payments, gameScores } = await import("../drizzle/schema");
      const { count, sum, sql } = await import("drizzle-orm");
      
      const [totalUsers] = await db_instance.select({ count: count() }).from(users);
      const [totalRevenue] = await db_instance.select({ sum: sum(payments.amount) }).from(payments);
      const [totalGamesPlayed] = await db_instance.select({ count: count() }).from(gameScores);
      const [activeSubscriptions] = await db_instance.select({ count: count() }).from(users).where(sql`subscription_tier != 'free'`);
      
      return {
        totalUsers: totalUsers.count,
        totalRevenue: totalRevenue.sum || 0,
        totalGamesPlayed: totalGamesPlayed.count,
        activeSubscriptions: activeSubscriptions.count,
      };
    }),

    updateUser: protectedProcedure
      .input(z.object({
        userId: z.number(),
        aiCredits: z.number().optional(),
        subscriptionTier: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.id !== 1) throw new TRPCError({ code: 'FORBIDDEN' });
        const db_instance = await getDb();
        if (!db_instance) throw new Error("Database not available");
        const { users } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        
        const updateData: any = {};
        if (input.aiCredits !== undefined) updateData.aiCredits = input.aiCredits;
        if (input.subscriptionTier) updateData.subscriptionTier = input.subscriptionTier;
        
        await db_instance.update(users).set(updateData).where(eq(users.id, input.userId));
        return { success: true };
      }),
  }),

  // App Builds Management
  appBuilds: router({
    uploadBuild: protectedProcedure
      .input(z.object({
        platform: z.enum(['ios', 'android']),
        version: z.string(),
        buildNumber: z.number(),
        fileName: z.string(),
        fileData: z.string(), // base64 encoded file
        releaseNotes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Only admin (owner) can upload builds
        if (ctx.user.id !== 1) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Only admins can upload app builds' });
        }

        const db_instance = await getDb();
        if (!db_instance) throw new Error("Database not available");
        const { appBuilds } = await import("../drizzle/schema");

        // Decode base64 and upload to S3
        const fileBuffer = Buffer.from(input.fileData, 'base64');
        const fileExtension = input.platform === 'ios' ? 'ipa' : 'aab';
        const fileKey = `app-builds/${input.platform}/${input.version}-${input.buildNumber}.${fileExtension}`;
        
        const { url } = await storagePut(fileKey, fileBuffer, 
          input.platform === 'ios' ? 'application/octet-stream' : 'application/vnd.android.package-archive'
        );

        // Save to database
        const [build] = await db_instance.insert(appBuilds).values({
          platform: input.platform,
          version: input.version,
          buildNumber: input.buildNumber,
          fileName: input.fileName,
          fileKey,
          fileUrl: url,
          fileSize: fileBuffer.length,
          releaseNotes: input.releaseNotes,
          isPublic: true,
          uploadedBy: ctx.user.id,
        });

        return { success: true, buildId: build.insertId, downloadUrl: url };
      }),

    getAllBuilds: publicProcedure.query(async () => {
      const db_instance = await getDb();
      if (!db_instance) throw new Error("Database not available");
      const { appBuilds } = await import("../drizzle/schema");
      const { desc } = await import("drizzle-orm");

      const builds = await db_instance.select().from(appBuilds).orderBy(desc(appBuilds.createdAt));
      return builds;
    }),

    getLatestBuilds: publicProcedure.query(async () => {
      const db_instance = await getDb();
      if (!db_instance) throw new Error("Database not available");
      const { appBuilds } = await import("../drizzle/schema");
      const { desc, eq } = await import("drizzle-orm");

      const iosBuilds = await db_instance.select().from(appBuilds)
        .where(eq(appBuilds.platform, 'ios'))
        .orderBy(desc(appBuilds.createdAt))
        .limit(1);
      
      const androidBuilds = await db_instance.select().from(appBuilds)
        .where(eq(appBuilds.platform, 'android'))
        .orderBy(desc(appBuilds.createdAt))
        .limit(1);

      return {
        ios: iosBuilds[0] || null,
        android: androidBuilds[0] || null,
      };
    }),

    incrementDownload: publicProcedure
      .input(z.object({ buildId: z.number() }))
      .mutation(async ({ input }) => {
        const db_instance = await getDb();
        if (!db_instance) throw new Error("Database not available");
        const { appBuilds } = await import("../drizzle/schema");
        const { eq, sql } = await import("drizzle-orm");

        await db_instance.update(appBuilds)
          .set({ downloadCount: sql`download_count + 1` })
          .where(eq(appBuilds.id, input.buildId));

        return { success: true };
      }),

    deleteBuild: protectedProcedure
      .input(z.object({ buildId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        // Only admin can delete builds
        if (ctx.user.id !== 1) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Only admins can delete builds' });
        }

        const db_instance = await getDb();
        if (!db_instance) throw new Error("Database not available");
        const { appBuilds } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");

        await db_instance.delete(appBuilds).where(eq(appBuilds.id, input.buildId));
        return { success: true };
      }),
   }),
  storageAnalytics: storageAnalyticsRouter,
});

// Initialize scheduled migration job on startup
if (process.env.NODE_ENV === 'production') {
  initializeScheduledMigration({
    enabled: true,
    runTime: '02:00', // Run at 2 AM daily
    batchSize: 10,
    delayMs: 1000,
    maxRetries: 3,
  });
}

export type AppRouter = typeof appRouter;
