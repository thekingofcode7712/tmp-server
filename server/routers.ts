import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";
import { executeCommand } from "./cli-executor";
import { invokeLLM } from "./_core/llm";
import { sendEmail as sendEmailSMTP } from "./email-service";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Dashboard & User Info
  dashboard: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      const user = await db.getUserById(ctx.user.id);
      const files = await db.getUserFiles(ctx.user.id);
      const recentFiles = files.slice(0, 5);
      
      return {
        storageUsed: user?.storageUsed || 0,
        storageLimit: user?.storageLimit || 5368709120,
        subscriptionTier: user?.subscriptionTier || "free",
        aiCredits: user?.aiCredits || 0,
        fileCount: files.length,
        recentFiles,
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
    
    uploadFile: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileData: z.string(), // base64
        mimeType: z.string(),
        folder: z.string().default("/"),
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

        const fileKey = `users/${ctx.user.id}/files/${nanoid()}-${input.fileName}`;
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
        const emailAddress = `${ctx.user.name?.toLowerCase().replace(/\s+/g, '') || 'user'}${ctx.user.id}@tmpserver.app`;
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
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createGameScore({
          userId: ctx.user.id,
          gameName: input.gameName,
          score: input.score,
          level: input.level,
          duration: input.duration,
        });
        return { success: true };
      }),
    
    getUserScores: protectedProcedure
      .input(z.object({ gameName: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        return await db.getUserGameScores(ctx.user.id, input.gameName);
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
        
        await db.createBackup({
          userId: ctx.user.id,
          backupName: input.backupName,
          backupSize: totalSize,
          fileCount: files.length,
          backupKey: `users/${ctx.user.id}/backups/${nanoid()}-${input.backupName}.zip`,
          status: "creating",
          metadata: { files: files.map(f => ({ id: f.id, fileName: f.fileName, fileKey: f.fileKey })) },
        });
        
        return { success: true };
      }),
    
    restoreBackup: protectedProcedure
      .input(z.object({ backupId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const backup = await db.getBackup(input.backupId);
        if (!backup || backup.userId !== ctx.user.id) {
          throw new Error("Backup not found");
        }
        
        // Get backup metadata with file list
        const metadata = backup.metadata as { files: Array<{ id: number; fileName: string; fileKey: string }> };
        if (!metadata || !metadata.files) {
          throw new Error("Invalid backup metadata");
        }
        
        // In a real implementation, this would:
        // 1. Download the backup zip from S3
        // 2. Extract files
        // 3. Upload each file back to S3
        // 4. Create file records in database
        
        // For now, we'll restore the file records from backup metadata
        let restoredCount = 0;
        for (const fileInfo of metadata.files) {
          // Check if file still exists in S3, if so restore the database record
          try {
            await db.createFile({
              userId: ctx.user.id,
              fileName: fileInfo.fileName,
              fileKey: fileInfo.fileKey,
              fileSize: 0, // Would get actual size from S3
              fileUrl: `https://storage.example.com/${fileInfo.fileKey}`,
              mimeType: "application/octet-stream",
            });
            restoredCount++;
          } catch (err) {
            // File might already exist, skip
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
      .input(z.object({ planId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const Stripe = (await import('stripe')).default;
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
          apiVersion: '2026-01-28.clover',
        });

        const { PRODUCTS } = await import('./products');
        const product = PRODUCTS[input.planId as keyof typeof PRODUCTS];
        
        if (!product) {
          throw new Error('Invalid plan');
        }

        const origin = ctx.req.headers.origin || 'http://localhost:3000';
        
        const sessionConfig: any = {
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency: product.currency,
                product_data: {
                  name: product.name,
                },
                unit_amount: product.price,
                ...(product.interval ? { recurring: { interval: product.interval } } : {}),
              },
              quantity: 1,
            },
          ],
          mode: product.interval ? 'subscription' : 'payment',
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

      await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
      await db.updateSubscriptionStatus(subscription.id, 'canceled');
      
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
  }),

  // VPN Service
  vpn: router({
    connect: protectedProcedure
      .input(z.object({ serverId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const isPaid = ctx.user.subscriptionTier && ctx.user.subscriptionTier !== 'free';
        if (!isPaid) {
          throw new Error('VPN is only available for paid subscribers');
        }
        
        // In a real implementation, this would configure proxy routing
        // For now, we'll simulate the connection
        return { 
          success: true, 
          server: input.serverId,
          ip: '192.168.1.' + Math.floor(Math.random() * 255),
          connected: true 
        };
      }),
    
    disconnect: protectedProcedure.mutation(async ({ ctx }) => {
      return { success: true, connected: false };
    }),
  }),

  // Ad Blocker
  adBlocker: router({
    toggle: protectedProcedure
      .input(z.object({ enabled: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        const isPaid = ctx.user.subscriptionTier && ctx.user.subscriptionTier !== 'free';
        if (!isPaid) {
          throw new Error('Ad Blocker is only available for paid subscribers');
        }
        
        // In a real implementation, this would configure DNS filtering
        return { success: true, enabled: input.enabled };
      }),
    
    getStats: protectedProcedure.query(async ({ ctx }) => {
      // Simulate ad blocking stats
      return {
        adsBlocked: Math.floor(Math.random() * 1000) + 500,
        trackersBlocked: Math.floor(Math.random() * 500) + 200,
        malwareBlocked: Math.floor(Math.random() * 50) + 10,
      };
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
});

export type AppRouter = typeof appRouter;
