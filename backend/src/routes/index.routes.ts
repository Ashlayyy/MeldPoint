import apicache from 'apicache';
import crypto from 'crypto';
import logger from '../helpers/loggerInstance';
import app from '../app';

// Routes
import meldingRouter from './melding.routes';
import projectRouter from './project.routes';
import projectLeiderRouter from './projectleider.routes';
import statusRouter from './status.routes';
import usersRouter from './users.routes';
import correctiefRouter from './correctief.routes';
import preventiefRouter from './preventief.routes';
import uploadthingRouter from './uploadthing.routes';
import chatRouter from './chat.routes';
import emailRouter from './email.routes';
import statsRouter from './stats.routes';
import backupRouter from './backup.routes';
import permissionsRouter from './permissions.routes';
import settingsRouter from './settings.routes';
import activityRouter from './activity.routes';
import systemLogRouter from './systemLog.routes';
import csrfRouter from './csrf.routes';
import githubRouter from './github.routes';
import githubWebhookRouter from './github-webhook.routes';
import screenshotRouter from './screenshot.routes';
import aiRouter from './ai.routes';
import batchRouter from './batch.routes';
import loginHistoryRoutes from './loginHistory.routes';
import departmentRouter from './department.routes';
import securityRouter from './security.routes';
import notificationsRouter from './notifications.routes';
import apiKeysRouter from './apiKeys.routes';
import schedulerModule from '../modules/Scheduler/scheduler.module';
import taskRouter from './task.routes';
import changelogRouter from './changelogs.routes';
import engagementRouter from './engagement.routes';

// Middleware
import { handleMeldingNumber } from '../middleware/handleMeldingNumber';
import { authenticateWithAPIKey } from '../middleware/api-key-auth.middleware';
import { isAuthenticated } from '../middleware/auth.middleware';

import {
  DELETEALL,
  DELETEALLHISTORY,
  addMultipleReports,
  createMultipleProjects,
  createMultipleProjectleiders
} from '../db/queries';

const cache = apicache.options({
  enabled: process.env.ENABLE_CACHING === 'true',
  debug: process.env.NODE_ENV === 'development' && process.env.ENABLE_CACHING === 'true',
  respectCacheControl: true
}).middleware;

// Add API key authentication middleware to all routes
app.use('/api', authenticateWithAPIKey);

app.use('/api/users/api-keys', isAuthenticated, apiKeysRouter);
app.use('/api/melding', isAuthenticated, cache('1 hour'), meldingRouter);
app.use('/api/project', isAuthenticated, cache('1 hour'), projectRouter);
app.use('/api/projectleider', isAuthenticated, cache('1 hour'), projectLeiderRouter);
app.use('/api/status', isAuthenticated, cache('1 hour'), statusRouter);
app.use('/api/user', usersRouter);
app.use('/api/correctief', isAuthenticated, cache('1 hour'), correctiefRouter);
app.use('/api/preventief', isAuthenticated, cache('1 hour'), preventiefRouter);
app.use('/api/chat', isAuthenticated, cache('1 hour'), chatRouter);
app.use('/api/email', isAuthenticated, emailRouter);
app.use('/api/stats', isAuthenticated, cache('1 hour'), statsRouter);
app.use('/api/backup', isAuthenticated, cache('1 hour'), backupRouter);
app.use('/api/permissions', isAuthenticated, cache('1 hour'), permissionsRouter);
app.use('/api/settings', isAuthenticated, cache('1 hour'), settingsRouter);
app.use('/api/activity', isAuthenticated, activityRouter);
app.use('/api/systemLog', isAuthenticated, cache('5 minutes'), systemLogRouter);
app.use('/api/csrf', csrfRouter);
app.use('/api/batch', isAuthenticated, batchRouter);
app.use('/api/department', isAuthenticated, departmentRouter);
app.use('/api/security', isAuthenticated, securityRouter);
app.use('/api/notifications', isAuthenticated, notificationsRouter);
app.use('/api/ai', isAuthenticated, aiRouter);
app.use('/api/screenshot', isAuthenticated, screenshotRouter);
app.use('/api/github', isAuthenticated, githubRouter);
app.use('/api/github-webhook', githubWebhookRouter);
app.use('/api/login-history', isAuthenticated, loginHistoryRoutes);
app.use('/api/scheduler', isAuthenticated, schedulerModule.router);
app.use('/api/tasks', isAuthenticated, taskRouter);
app.use('/api/changelogs', changelogRouter);
app.use('/api/engagement', isAuthenticated, engagementRouter);

app.use('/api/uploadthing', uploadthingRouter);

app.use('/{0,}', (req, res) => {
  res.status(404).json({ found: false, suggestion: 'Turn back!', error: 'Route not found' });
});

export default app;
