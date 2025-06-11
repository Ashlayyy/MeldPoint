import { RequestHandler } from 'express';
import { logSuccess, logError } from '../../../middleware/handleHistory';
import * as emailService from '../service/EmailService';
import handleError from '../../../utils/errorHandler';
import logger from '../../../utils/logger';

export const SendEmail: RequestHandler = async (req, res) => {
  const startTime = process.hrtime();
  try {
    const result = await emailService.sendTemplatedEmail(
      req,
      req.body.to,
      req.body.templateName,
      req.body.templateData
    );
    const executionTime = (process.hrtime(startTime)[0] * 1000 + process.hrtime(startTime)[1] / 1000000).toFixed(2);
    logSuccess(req, {
      action: 'SEND_EMAIL',
      resourceType: 'EMAIL',
      metadata: { executionTime: parseFloat(executionTime) }
    });
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error) {
      logError(req, {
        action: 'SEND_EMAIL',
        resourceType: 'EMAIL',
        error
      });
    }
    handleError(error, res);
  }
};

export const TrackEmailOpen: RequestHandler = async (req, res) => {
  const startTime = process.hrtime();
  const { trackingId } = req.params;
  const userAgent = req.headers['user-agent'];
  const ipAddress = req.ip;

  try {
    await emailService.trackEmailOpen(trackingId, {
      openedAt: new Date(),
      ipOpened: ipAddress || '',
      userAgent: userAgent || ''
    });

    const executionTime = (process.hrtime(startTime)[0] * 1000 + process.hrtime(startTime)[1] / 1000000).toFixed(2);
    logSuccess(req, {
      action: 'EMAIL_OPENED',
      resourceType: 'EMAIL',
      resourceId: trackingId,
      metadata: {
        trackingId,
        openedAt: new Date().toISOString(),
        ipAddress,
        userAgent,
        trackingType: 'PIXEL',
        executionTime: parseFloat(executionTime)
      }
    });

    res.writeHead(200, {
      'Content-Type': 'image/gif',
      'Content-Length': '43'
    });
    res.end(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
  } catch (error) {
    if (error instanceof Error) {
      logError(req, {
        action: 'EMAIL_TRACKING_ERROR',
        resourceType: 'EMAIL',
        resourceId: trackingId,
        error,
        metadata: {
          trackingId,
          trackingType: 'PIXEL'
        }
      });
    }
    logger.error('Error tracking email open:', error);
    res.status(500).end();
  }
};

export const GetEmailHistory: RequestHandler = async (req, res) => {
  const startTime = process.hrtime();
  try {
    const history = await emailService.getAllEmails();
    const executionTime = (process.hrtime(startTime)[0] * 1000 + process.hrtime(startTime)[1] / 1000000).toFixed(2);
    logSuccess(req, {
      action: 'GET_EMAIL_HISTORY',
      resourceType: 'EMAIL',
      metadata: {
        executionTime: parseFloat(executionTime),
        resultCount: history.length
      }
    });
    res.status(200).json(history);
  } catch (error) {
    if (error instanceof Error) {
      logError(req, {
        action: 'GET_EMAIL_HISTORY',
        resourceType: 'EMAIL',
        error
      });
    }
    handleError(error, res);
  }
};

export const GetEmailTemplate: RequestHandler = async (req, res) => {
  const startTime = process.hrtime();
  const { templateId } = req.params;
  try {
    const templates = await emailService.getAvailableTemplates();
    const template = templates.find((t) => t === templateId);
    if (!template) {
      throw new Error('Template not found');
    }
    const executionTime = (process.hrtime(startTime)[0] * 1000 + process.hrtime(startTime)[1] / 1000000).toFixed(2);
    logSuccess(req, {
      action: 'GET_EMAIL_TEMPLATE',
      resourceType: 'EMAIL_TEMPLATE',
      resourceId: templateId,
      metadata: { executionTime: parseFloat(executionTime) }
    });
    res.status(200).json({ templateId: template });
  } catch (error) {
    if (error instanceof Error) {
      logError(req, {
        action: 'GET_EMAIL_TEMPLATE',
        resourceType: 'EMAIL_TEMPLATE',
        resourceId: templateId,
        error
      });
    }
    handleError(error, res);
  }
};

export const HandleEmailWebhook: RequestHandler = async (req, res) => {
  const startTime = process.hrtime();
  const { trackingId, event, timestamp, ...eventData } = req.body;

  try {
    const executionTime = (process.hrtime(startTime)[0] * 1000 + process.hrtime(startTime)[1] / 1000000).toFixed(2);

    logSuccess(req, {
      action: 'EMAIL_STATUS_UPDATE',
      resourceId: trackingId,
      resourceType: 'EMAIL',
      metadata: {
        trackingId,
        event,
        timestamp,
        deliveryStatus: event,
        bounceType: eventData.bounceType,
        bounceReason: eventData.bounceReason,
        deliveryAttempts: eventData.attempts,
        provider: eventData.provider,
        rawEventData: eventData,
        webhookSource: req.headers['x-webhook-source'],
        webhookSignature: req.headers['x-webhook-signature'],
        executionTime: parseFloat(executionTime)
      }
    });

    await emailService.updateEmailStatus(trackingId, {
      deliveryStatus: event,
      ...eventData
    });

    res.status(200).json({ status: 'processed' });
  } catch (error) {
    if (error instanceof Error) {
      logError(req, {
        action: 'EMAIL_WEBHOOK_ERROR',
        resourceId: trackingId,
        resourceType: 'EMAIL',
        error,
        metadata: {
          trackingId,
          event,
          webhookSource: req.headers['x-webhook-source']
        }
      });
    }
    logger.error('Failed to process webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

export const GetEmailStatus: RequestHandler = async (req, res) => {
  const startTime = process.hrtime();
  const { trackingId } = req.params;

  try {
    const trackingInfo = await emailService.getEmailTrackingInfo(trackingId);
    const executionTime = (process.hrtime(startTime)[0] * 1000 + process.hrtime(startTime)[1] / 1000000).toFixed(2);

    logSuccess(req, {
      action: 'GET_EMAIL_STATUS',
      resourceType: 'EMAIL',
      resourceId: trackingId,
      metadata: {
        executionTime: parseFloat(executionTime),
        currentStatus: trackingInfo?.deliveryStatus,
        openCount: trackingInfo?.ipOpened?.length || 0
      }
    });

    res.status(200).json({ data: trackingInfo });
  } catch (error) {
    if (error instanceof Error) {
      logError(req, {
        action: 'GET_EMAIL_STATUS',
        resourceType: 'EMAIL',
        resourceId: trackingId,
        error
      });
    }
    handleError(error, res);
  }
};

export const GetAllEmailTracking: RequestHandler = async (req, res) => {
  const startTime = process.hrtime();
  try {
    const trackingInfo = await emailService.getAllEmails();
    const executionTime = (process.hrtime(startTime)[0] * 1000 + process.hrtime(startTime)[1] / 1000000).toFixed(2);

    logSuccess(req, {
      action: 'GET_ALL_EMAIL_TRACKING',
      resourceType: 'EMAIL',
      metadata: {
        executionTime: parseFloat(executionTime),
        resultCount: trackingInfo.length
      }
    });

    res.status(200).json(trackingInfo);
  } catch (error) {
    if (error instanceof Error) {
      logError(req, {
        action: 'GET_ALL_EMAIL_TRACKING',
        resourceType: 'EMAIL',
        error
      });
    }
    handleError(error, res);
  }
};

export const SendTemplatedEmail: RequestHandler = async (req, res) => {
  const startTime = process.hrtime();
  const { to, templateName, templateData } = req.body;

  try {
    const { messageId, trackingInfo } = await emailService.sendTemplatedEmail(req, to, templateName, templateData);
    const executionTime = (process.hrtime(startTime)[0] * 1000 + process.hrtime(startTime)[1] / 1000000).toFixed(2);

    logSuccess(req, {
      action: 'SEND_TEMPLATED_EMAIL',
      resourceId: messageId,
      resourceType: 'EMAIL',
      metadata: {
        templateName,
        recipientCount: Array.isArray(to) ? to.length : 1,
        trackingId: trackingInfo.trackingId,
        messageId,
        executionTime: parseFloat(executionTime)
      }
    });

    res.status(200).json({
      message: 'Templated email sent successfully',
      messageId,
      trackingId: trackingInfo.trackingId
    });
  } catch (error) {
    if (error instanceof Error) {
      logError(req, {
        action: 'SEND_TEMPLATED_EMAIL_ERROR',
        resourceType: 'EMAIL',
        error,
        metadata: {
          templateName,
          to
        }
      });
    }
    handleError(error, res);
  }
};

export const GetAvailableTemplates: RequestHandler = async (req, res) => {
  const startTime = process.hrtime();
  try {
    const templates = await emailService.getAvailableTemplates();
    const executionTime = (process.hrtime(startTime)[0] * 1000 + process.hrtime(startTime)[1] / 1000000).toFixed(2);

    logSuccess(req, {
      action: 'GET_AVAILABLE_TEMPLATES',
      resourceType: 'EMAIL_TEMPLATE',
      metadata: {
        executionTime: parseFloat(executionTime),
        templateCount: templates.length
      }
    });

    res.status(200).json({ templates });
  } catch (error) {
    if (error instanceof Error) {
      logError(req, {
        action: 'GET_AVAILABLE_TEMPLATES',
        resourceType: 'EMAIL_TEMPLATE',
        error
      });
    }
    handleError(error, res);
  }
};

export const TrackEmailClick: RequestHandler = async (req, res) => {
  const { trackingId } = req.params;
  const { url } = req.query;
  const userAgent = req.headers['user-agent'];
  const ipAddress = req.ip;

  try {
    await emailService.trackEmailClick(trackingId, {
      clickedAt: new Date(),
      url: url as string,
      userAgent: userAgent || '',
      ipAddress: ipAddress || ''
    });

    logSuccess(req, {
      action: 'EMAIL_LINK_CLICKED',
      resourceId: trackingId,
      resourceType: 'EMAIL',
      metadata: {
        trackingId,
        url,
        clickedAt: new Date().toISOString(),
        ipAddress,
        userAgent
      }
    });

    res.redirect(url as string);
  } catch (error) {
    if (error instanceof Error) {
      logError(req, {
        action: 'EMAIL_LINK_CLICK_ERROR',
        resourceId: trackingId,
        resourceType: 'EMAIL',
        error,
        metadata: {
          trackingId,
          url
        }
      });
    }
    logger.error('Failed to track email click:', error);
    res.redirect(url as string);
  }
};

export const TrackOutlookOpen: RequestHandler = async (req, res) => {
  const { trackingId } = req.params;
  const userAgent = req.headers['user-agent'];
  const ipAddress = req.ip;

  try {
    await emailService.trackEmailOpen(trackingId, {
      openedAt: new Date(),
      ipOpened: ipAddress || '',
      userAgent: userAgent || ''
    });

    logSuccess(req, {
      action: 'EMAIL_OPENED_OUTLOOK',
      resourceId: trackingId,
      resourceType: 'EMAIL',
      metadata: {
        trackingId,
        openedAt: new Date().toISOString(),
        ipAddress,
        userAgent,
        trackingType: 'OUTLOOK'
      }
    });

    res.writeHead(200, {
      'Content-Type': 'image/gif',
      'Content-Length': '43'
    });
    res.end(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
  } catch (error) {
    if (error instanceof Error) {
      logError(req, {
        action: 'EMAIL_TRACKING_ERROR_OUTLOOK',
        resourceId: trackingId,
        resourceType: 'EMAIL',
        error,
        metadata: {
          trackingId,
          trackingType: 'OUTLOOK'
        }
      });
    }
    logger.error('Failed to track Outlook open:', error);
    res.status(200).end();
  }
};
