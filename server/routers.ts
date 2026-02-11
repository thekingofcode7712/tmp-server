import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";
import { invokeLLM } from "./_core/llm";

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
        await db.createLink({
          userId: ctx.user.id,
          linkType: input.type,
          url: input.url,
          title: input.title,
          description: input.description,
        });
        return { success: true };
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
        await db.createVideoDownload({
          userId: ctx.user.id,
          url: input.url,
          format: input.format,
          quality: input.quality,
          status: "pending",
        });
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

        // Create sent email
        await db.createEmail({
          emailAccountId: account.id,
          fromAddress: account.emailAddress,
          toAddress: input.to,
          ccAddress: input.cc,
          bccAddress: input.bcc,
          subject: input.subject,
          body: input.body,
          folder: "sent",
        });

        // Simulate receiving email for internal addresses
        const recipientAccount = await db.getEmailAccountByEmail(input.to);
        if (recipientAccount) {
          await db.createEmail({
            emailAccountId: recipientAccount.id,
            fromAddress: account.emailAddress,
            toAddress: input.to,
            subject: input.subject,
            body: input.body,
            folder: "inbox",
          });
        }

        return { success: true };
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
        // CLI command execution logic will be implemented in frontend
        await db.createCliHistory({
          userId: ctx.user.id,
          command: input.command,
          output: "Command executed",
          exitCode: 0,
        });
        return { success: true, output: "Command executed" };
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
        
        // Restore logic would go here
        return { success: true };
      }),
    
    deleteBackup: protectedProcedure
      .input(z.object({ backupId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteBackup(input.backupId, ctx.user.id);
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
});

export type AppRouter = typeof appRouter;
