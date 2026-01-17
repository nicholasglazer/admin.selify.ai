/**
 * Test Connection API
 *
 * POST: Test IMAP/SMTP connection before saving account
 */

import {json} from '@sveltejs/kit';
import type {RequestHandler} from './$types';
import {ImapFlow} from 'imapflow';
import nodemailer from 'nodemailer';

export const POST: RequestHandler = async ({locals, request}) => {
  const {session} = await locals.safeGetSession();
  if (!session?.user?.id) {
    return json({success: false, error: 'Unauthorized'}, {status: 401});
  }

  try {
    const body = await request.json();
    const {email, password, imapHost, imapPort, smtpHost, smtpPort} = body;

    // Validate required fields
    if (!email || !password || !imapHost || !smtpHost) {
      return json({success: false, error: 'Missing required fields'}, {status: 400});
    }

    // Test IMAP connection
    const imapClient = new ImapFlow({
      host: imapHost,
      port: imapPort || 993,
      secure: true,
      auth: {
        user: email,
        pass: password
      },
      logger: false,
      tls: {
        rejectUnauthorized: true
      }
    });

    try {
      await imapClient.connect();
      await imapClient.logout();
    } catch (imapError: any) {
      console.error('[Test Connection] IMAP error:', imapError);
      return json({
        success: false,
        error: `IMAP connection failed: ${imapError.message || 'Authentication failed'}`
      });
    }

    // Test SMTP connection
    const smtpTransport = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort || 465,
      secure: smtpPort === 465, // Port 465 uses implicit TLS, port 587 uses STARTTLS
      auth: {
        user: email,
        pass: password
      },
      tls: {
        rejectUnauthorized: true
      }
    });

    try {
      await smtpTransport.verify();
      smtpTransport.close();
    } catch (smtpError: any) {
      console.error('[Test Connection] SMTP error:', smtpError);
      return json({
        success: false,
        error: `SMTP connection failed: ${smtpError.message || 'Authentication failed'}`
      });
    }

    return json({
      success: true,
      message: 'Both IMAP and SMTP connections successful'
    });
  } catch (error: any) {
    console.error('[Test Connection] Error:', error);
    return json(
      {
        success: false,
        error: error.message || 'Connection test failed'
      },
      {status: 500}
    );
  }
};
