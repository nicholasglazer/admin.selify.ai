/**
 * SMTP Utilities
 *
 * Handles sending emails via SMTP with support for:
 * - Plain text and HTML emails
 * - Attachments
 * - Reply/Forward with proper threading
 * - Multiple accounts
 *
 * @see https://nodemailer.com/
 */

import nodemailer from 'nodemailer';
import type {Transporter} from 'nodemailer';
import type {EmailCredentials, ComposeDraft, EmailAddress} from '../types';

// =============================================================================
// Transporter Cache
// =============================================================================

const transporterCache = new Map<string, Transporter>();

/**
 * Get or create an SMTP transporter for sending emails
 */
function getTransporter(credentials: EmailCredentials): Transporter {
  const key = `${credentials.email}:${credentials.smtp.host}`;

  if (transporterCache.has(key)) {
    return transporterCache.get(key)!;
  }

  const transporter = nodemailer.createTransport({
    host: credentials.smtp.host,
    port: credentials.smtp.port,
    secure: credentials.smtp.port === 465,
    auth: {
      user: credentials.email,
      pass: credentials.password
    },
    tls: {
      rejectUnauthorized: true
    },
    // Pool connections for better performance
    pool: true,
    maxConnections: 3,
    maxMessages: 100
  });

  transporterCache.set(key, transporter);
  return transporter;
}

// =============================================================================
// Email Sending
// =============================================================================

export interface SendEmailOptions {
  credentials: EmailCredentials;
  draft: ComposeDraft;
  displayName?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send an email
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const {credentials, draft, displayName} = options;

  try {
    const transporter = getTransporter(credentials);

    // Build the from address
    const from = displayName ? `"${displayName}" <${credentials.email}>` : credentials.email;

    // Build mail options
    const mailOptions: nodemailer.SendMailOptions = {
      from,
      to: draft.to.join(', '),
      subject: draft.subject,
      // Set reply headers for threading
      ...(draft.replyTo && {
        inReplyTo: draft.replyTo.messageId,
        references: draft.replyTo.messageId
      })
    };

    // Add CC/BCC if present
    if (draft.cc?.length) {
      mailOptions.cc = draft.cc.join(', ');
    }
    if (draft.bcc?.length) {
      mailOptions.bcc = draft.bcc.join(', ');
    }

    // Set body based on type
    if (draft.bodyType === 'html') {
      mailOptions.html = draft.body;
      // Generate plain text version from HTML
      mailOptions.text = stripHtml(draft.body);
    } else {
      mailOptions.text = draft.body;
    }

    // Add attachments
    if (draft.attachments?.length) {
      mailOptions.attachments = await Promise.all(
        draft.attachments.map(async file => ({
          filename: file.name,
          content: Buffer.from(await file.arrayBuffer()),
          contentType: file.type
        }))
      );
    }

    // Send the email
    const result = await transporter.sendMail(mailOptions);

    return {
      success: true,
      messageId: result.messageId
    };
  } catch (error) {
    console.error('[SMTP] Send failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email'
    };
  }
}

/**
 * Verify SMTP connection (useful for account setup)
 */
export async function verifySmtpConnection(credentials: EmailCredentials): Promise<boolean> {
  try {
    const transporter = getTransporter(credentials);
    await transporter.verify();
    return true;
  } catch (error) {
    console.error('[SMTP] Verification failed:', error);
    return false;
  }
}

// =============================================================================
// Reply/Forward Helpers
// =============================================================================

/**
 * Format original message for reply
 */
export function formatReplyBody(
  originalMessage: {
    from: EmailAddress | null;
    date: string;
    body: string;
    bodyType: 'text' | 'html';
  },
  type: 'reply' | 'replyAll' | 'forward'
): string {
  const fromName = originalMessage.from?.name || originalMessage.from?.address || 'Unknown';
  const date = new Date(originalMessage.date).toLocaleString();

  const separator =
    type === 'forward' ?
      `\n\n---------- Forwarded message ----------\nFrom: ${fromName}\nDate: ${date}\n\n`
    : `\n\nOn ${date}, ${fromName} wrote:\n`;

  if (originalMessage.bodyType === 'html') {
    return `<br><br>${separator.replace(/\n/g, '<br>')}<blockquote style="margin: 0 0 0 0.8ex; border-left: 1px solid #ccc; padding-left: 1ex;">${originalMessage.body}</blockquote>`;
  }

  // Quote each line for plain text
  const quotedBody = originalMessage.body
    .split('\n')
    .map(line => `> ${line}`)
    .join('\n');

  return `${separator}${quotedBody}`;
}

/**
 * Build reply subject line
 */
export function formatReplySubject(
  subject: string,
  type: 'reply' | 'replyAll' | 'forward'
): string {
  // Remove existing Re:/Fwd: prefixes
  const cleanSubject = subject.replace(/^(Re:|Fwd:|Fw:)\s*/gi, '');

  if (type === 'forward') {
    return `Fwd: ${cleanSubject}`;
  }
  return `Re: ${cleanSubject}`;
}

/**
 * Get recipients for reply all
 */
export function getReplyAllRecipients(
  originalFrom: EmailAddress | null,
  originalTo: EmailAddress[],
  originalCc: EmailAddress[],
  myEmail: string
): {to: string[]; cc: string[]} {
  const to: string[] = [];
  const cc: string[] = [];

  // Add original sender to To
  if (originalFrom?.address && originalFrom.address.toLowerCase() !== myEmail.toLowerCase()) {
    to.push(originalFrom.address);
  }

  // Add other To recipients (except me)
  for (const addr of originalTo) {
    if (addr.address.toLowerCase() !== myEmail.toLowerCase() && !to.includes(addr.address)) {
      to.push(addr.address);
    }
  }

  // Add CC recipients (except me)
  for (const addr of originalCc) {
    if (
      addr.address.toLowerCase() !== myEmail.toLowerCase() &&
      !to.includes(addr.address) &&
      !cc.includes(addr.address)
    ) {
      cc.push(addr.address);
    }
  }

  return {to, cc};
}

// =============================================================================
// Utilities
// =============================================================================

/**
 * Strip HTML tags to generate plain text
 */
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}
