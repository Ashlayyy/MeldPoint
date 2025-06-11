import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import morgan from 'morgan';
import passport from 'passport';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import { createStream } from 'rotating-file-stream';
import path from 'path';
import moment from 'moment';
import logger from './helpers/loggerInstance';
import { CsrfRequest } from './types/request';

import { apiLimiter, speedLimiter, authLimiter, refreshTokenLimiter } from './middleware/rate-limit.middleware';
import HandleError from './middleware/HandleError';
import morganFormat from './helpers/morganFormat';
import configurePassport from './config/passport';
import csrfMiddleware from './middleware/csrf.middleware';
import requestLogger from './middleware/request-logger.middleware';

logger.debug('App: Starting server');
const app = express();

logger.debug('App: Creating access log stream');
const accessLogStream = createStream('access.log', {
  interval: '1d',
  path: path.join(
    __dirname,
    `../logs/${moment().format('YYYY')}/${moment().format('MM')}/${moment().format('DD-MM-YYYY')}`
  )
});

app.set('trust proxy', 1);

logger.debug('App: Setting up middleware');
// Add request logger early to capture all requests
app.use(requestLogger);

app.use(express.urlencoded({ extended: true, limit: '30mb' }));
app.use(express.json({ limit: '30mb' }));
app.use(HandleError);

logger.debug('App: Setting up cors options');
const corsOptions = {
  origin:
    process.env.NODE_ENV === 'development'
      ? process.env.FRONTEND_URL_DEVELOPMENT
      : process.env.FRONTEND_URL_PRODUCTION || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
};

logger.debug('App: Setting up compression');
app.use(compression());

logger.debug('App: Setting up helmet');
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", 'https:', 'data:'],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: { policy: 'same-site' },
    dnsPrefetchControl: true,
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    ieNoOpen: true,
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xssFilter: true
  })
);

logger.debug('App: Setting up session');
app.use(
  session({
    secret: process.env.SESSION_SECRET as string,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.DATABASE_URL,
      ttl: 12 * 60 * 60,
      autoRemove: 'native'
    }),
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 12 * 60 * 60 * 1000, // 12 hours
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
    }
  })
);

logger.debug('App: Disabling x-powered-by header');
app.disable('x-powered-by');

logger.debug('App: Setting up rate limiting');
app.use(speedLimiter);
app.use(apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/refresh-token', refreshTokenLimiter);

logger.debug('App: Setting up cors');
app.use(cors(corsOptions));

logger.debug('App: Configuring passport');
configurePassport();
app.use(passport.initialize());
app.use(passport.session());

// CSRF Protection
app.use((req, res, next) => {
  const csrfReq = req as CsrfRequest;
  csrfMiddleware.generateToken(csrfReq, res, next);
});

app.use((req, res, next) => {
  const csrfReq = req as CsrfRequest;
  csrfMiddleware.validateToken(csrfReq, res, next);
});

logger.debug('App: Setting up morgan');
app.use(morgan('common', { stream: accessLogStream }));
app.use(morgan(morganFormat()));

// Add graceful shutdown handling
process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM signal. Starting graceful shutdown...');
  await logger.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('Received SIGINT signal. Starting graceful shutdown...');
  await logger.shutdown();
  process.exit(0);
});

export default app;
