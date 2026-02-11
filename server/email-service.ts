import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import * as db from './db';

// Email configuration
const EMAIL_DOMAIN = 'tmpserver.app';
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: SMTP_USER && SMTP_PASS ? {
        user: SMTP_USER,
        pass: SMTP_PASS,
      } : undefined,
    });
  }
  return transporter!;
}

/**
 * Generate email address for user
 */
export function generateUserEmail(userId: number, username: string): string {
  const sanitized = username.toLowerCase().replace(/[^a-z0-9]/g, '');
  return `${sanitized}${userId}@${EMAIL_DOMAIN}`;
}

/**
 * Send an email
 */
export async function sendEmail(params: {
  from: string;
  to: string;
  subject: string;
  body: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // If SMTP is not configured, simulate sending
    if (!SMTP_USER || !SMTP_PASS) {
      console.log('[Email] SMTP not configured, simulating send:', {
        from: params.from,
        to: params.to,
        subject: params.subject,
      });
      
      return {
        success: true,
        messageId: `simulated-${Date.now()}@${EMAIL_DOMAIN}`,
      };
    }

    const transport = getTransporter();
    
    const info = await transport.sendMail({
      from: params.from,
      to: params.to,
      subject: params.subject,
      text: params.body,
      html: params.html || params.body.replace(/\n/g, '<br>'),
      attachments: params.attachments,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('[Email] Send error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Receive emails (simulated - in production would use IMAP or webhook)
 */
export async function receiveEmails(userEmail: string): Promise<Array<{
  from: string;
  subject: string;
  body: string;
  receivedAt: Date;
}>> {
  // In a real implementation, this would:
  // 1. Connect to IMAP server
  // 2. Fetch unread emails for the user
  // 3. Parse and return email data
  
  // For now, return simulated emails
  return [];
}

/**
 * Poll for new emails and save to database
 */
export async function pollUserEmails(userId: number): Promise<number> {
  try {
    const user = await db.getUserById(userId);
    if (!user) return 0;

    const userEmail = generateUserEmail(userId, user.name || 'user');
    const newEmails = await receiveEmails(userEmail);

    let savedCount = 0;
    for (const email of newEmails) {
      // Create email account if not exists
      let emailAccount = await db.getEmailAccountByUserId(userId);
      if (!emailAccount) {
        const newAccount = await db.createEmailAccount({
          userId,
          emailAddress: userEmail,
        });
        if (newAccount) {
          emailAccount = await db.getEmailAccountByUserId(userId);
        }
      }
      
      if (emailAccount) {
        await db.createEmail({
          emailAccountId: emailAccount.id,
          fromAddress: email.from,
          toAddress: userEmail,
          subject: email.subject,
          body: email.body,
          folder: 'inbox',
          isRead: false,
        });
      }
      savedCount++;
    }

    return savedCount;
  } catch (error) {
    console.error('[Email] Poll error:', error);
    return 0;
  }
}

/**
 * Start email polling for all users (call this on server startup)
 */
export function startEmailPolling() {
  // Poll every 5 minutes
  setInterval(async () => {
    try {
      // Get all users and poll their emails
      // In production, this would be more sophisticated
      console.log('[Email] Polling for new emails...');
    } catch (error) {
      console.error('[Email] Polling error:', error);
    }
  }, 5 * 60 * 1000);
}

/**
 * Verify SMTP connection
 */
export async function verifyEmailConnection(): Promise<boolean> {
  try {
    if (!SMTP_USER || !SMTP_PASS) {
      console.log('[Email] SMTP not configured, using simulation mode');
      return true;
    }

    const transport = getTransporter();
    await transport.verify();
    console.log('[Email] SMTP connection verified');
    return true;
  } catch (error) {
    console.error('[Email] SMTP verification failed:', error);
    return false;
  }
}
