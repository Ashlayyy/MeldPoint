import { Prisma } from '@prisma/client';
import { Response } from 'express';
import logger from './loggerInstance';

let code = 0;

export default function handleError(e: any, res: Response) {
  logger.debug(`Error: ${JSON.stringify(e)}`);
  if (e instanceof Prisma.PrismaClientKnownRequestError && process.env.NODE_ENV !== 'production') {
    code = 0;
    // P1000 - P1999
    if (e.code === 'P1000') {
      code = 1;
      logger.error(`Prisma-Error: ${e.message} - ${e.meta}`);
      if (process.env.EXTRA_INFO === 'true') {
        logger.debug(`Prisma-Error: Authentication failure - ${e.message} - ${e.meta}`);
        res.status(500).json({
          error: 'Internal server error - Authentication failure',
          message: e.message,
          meta: e.meta
        });
      } else {
        res.status(500).json({
          error: 'Internal server error'
        });
      }
    }
    if (e.code === 'P1001') {
      code = 1;
      logger.error(`Prisma-Error: ${e.message} - ${e.meta}`);
      if (process.env.EXTRA_INFO === 'true') {
        logger.debug(`Prisma-Error: Database can\t be reached - ${e.message} - ${e.meta}`);
        res.status(500).json({
          error: 'Internal server error - Database can\t be reached',
          message: e.message,
          meta: e.meta
        });
      } else {
        res.status(500).json({
          error: 'Internal server error'
        });
      }
    }
    if (e.code === 'P1008') {
      code = 1;
      logger.error(`Prisma-Error: ${e.message} - ${e.meta}`);
      if (process.env.EXTRA_INFO === 'true') {
        logger.debug(`Prisma-Error: Timed out connecting to database - ${e.message} - ${e.meta}`);
        res.status(500).json({
          error: 'Internal server error - Timed out connecting to database',
          message: e.message,
          meta: e.meta
        });
      } else {
        res.status(500).json({
          error: 'Internal server error'
        });
      }
    }
    if (e.code === 'P1010') {
      code = 1;
      logger.error(`Prisma-Error: ${e.message} - ${e.meta}`);
      if (process.env.EXTRA_INFO === 'true') {
        logger.debug(`Prisma-Error: User denied access - ${e.message} - ${e.meta}`);
        res.status(500).json({
          error: 'Internal server error - User denied access',
          message: e.message,
          meta: e.meta
        });
      } else {
        res.status(500).json({
          error: 'Internal server error'
        });
      }
    }
    if (e.code === 'P1012') {
      code = 1;
      logger.error(`Prisma-Error: ${e.message} - ${e.meta}`);
      if (process.env.EXTRA_INFO === 'true') {
        logger.debug(`Prisma-Error: Argument or type error - ${e.message} - ${e.meta}`);
        res.status(500).json({
          error: 'Internal server error - Argument or type error',
          message: e.message,
          meta: e.meta
        });
      } else {
        res.status(500).json({
          error: 'Internal server error'
        });
      }
    }
    if (e.code === 'P1013') {
      code = 1;
      logger.error(`Prisma-Error: ${e.message} - ${e.meta}`);
      if (process.env.EXTRA_INFO === 'true') {
        logger.debug(`Prisma-Error: Database string invalid - ${e.message} - ${e.meta}`);
        res.status(500).json({
          error: 'Internal server error - Database string invalid',
          message: e.message,
          meta: e.meta
        });
      } else {
        res.status(500).json({
          error: 'Internal server error'
        });
      }
    }
    if (e.code === 'P1015') {
      code = 1;
      logger.error(`Prisma-Error: ${e.message} - ${e.meta}`);
      if (process.env.EXTRA_INFO === 'true') {
        logger.debug(`Prisma-Error: Unsupported features - ${e.message} - ${e.meta}`);
        res.status(500).json({
          error: 'Internal server error - Unsupported features',
          message: e.message,
          meta: e.meta
        });
      } else {
        res.status(500).json({
          error: 'Internal server error'
        });
      }
    }
    if (e.code === 'P1016') {
      code = 1;
      logger.error(`Prisma-Error: ${e.message} - ${e.meta}`);
      if (process.env.EXTRA_INFO === 'true') {
        logger.debug(`Prisma-Error: Wrong number of parameters - ${e.message} - ${e.meta}`);
        res.status(500).json({
          error: 'Internal server error - Wrong number of parameters',
          message: e.message,
          meta: e.meta
        });
      } else {
        res.status(500).json({
          error: 'Internal server error'
        });
      }
    }
    if (e.code === 'P1017') {
      code = 1;
      logger.error(`Prisma-Error: ${e.message} - ${e.meta}`);
      if (process.env.EXTRA_INFO === 'true') {
        logger.debug(`Prisma-Error: Server closed connection - ${e.message} - ${e.meta}`);
        res.status(500).json({
          error: 'Internal server error - Server closed connection',
          message: e.message,
          meta: e.meta
        });
      } else {
        res.status(500).json({
          error: 'Internal server error'
        });
      }
    }

    // P2000 - P2999
    if (e.code === 'P2000') {
      code = 1;
      if (process.env.EXTRA_INFO === 'true') {
        logger.debug(`Prisma-Error: Value for collumn is too long - ${e.message} - ${e.meta}`);
        res.status(500).json({
          error: 'Prisma Client error - Value for collumn is too long',
          message: e.message,
          meta: e.meta
        });
      } else {
        res.status(500).json({
          error: 'Prisma Client error'
        });
      }
    }
    if (e.code === 'P2001') {
      code = 1;
      logger.error(`Prisma-Error: ${e.message} - ${e.meta}`);
      if (process.env.EXTRA_INFO === 'true') {
        logger.debug(`Prisma-Error: Record doesn\t exist - ${e.message} - ${e.meta}`);
        res.status(500).json({
          error: 'Prisma Client error - Record doesn\t exist',
          message: e.message,
          meta: e.meta
        });
      } else {
        res.status(500).json({
          error: 'Prisma Client error'
        });
      }
    }
    if (e.code === 'P2002') {
      code = 1;
      logger.error(`Prisma-Error: ${e.message} - ${e.meta}`);
      if (process.env.EXTRA_INFO === 'true') {
        logger.debug(`Prisma-Error: Unique constraint failed - ${e.message} - ${e.meta}`);
        res.status(500).json({
          error: 'Prisma Client error - Unique constraint failed',
          message: e.message,
          meta: e.meta
        });
      } else {
        res.status(500).json({
          error: 'Prisma Client error'
        });
      }
    }
    if (e.code === 'P2025') {
      code = 1;
      logger.error(`Prisma-Error: ${e.message} - ${e.meta}`);
      if (process.env.EXTRA_INFO === 'true') {
        logger.debug(`Prisma-Error: Record not found - ${e.message} - ${e.meta}`);
        res.status(500).json({
          error: 'Prisma Client error - Record not found',
          message: e.message,
          meta: e.meta
        });
      } else {
        res.status(500).json({
          error: 'Prisma Client error'
        });
      }
    }
    if (e.code === 'P2027') {
      code = 1;
      logger.error(`Prisma-Error: ${e.message} - ${e.meta}`);
      if (process.env.EXTRA_INFO === 'true') {
        logger.debug(`Prisma-Error: Multiple errors - ${e.message} - ${e.meta}`);
        res.status(500).json({
          error: 'Prisma Client error - Multiple errors',
          message: e.message,
          meta: e.meta
        });
      } else {
        res.status(500).json({
          error: 'Prisma Client error'
        });
      }
    }
    if (e.code === 'P2037') {
      code = 1;
      logger.error(`Prisma-Error: ${e.message} - ${e.meta}`);
      if (process.env.EXTRA_INFO === 'true') {
        logger.debug(`Prisma-Error: Too many connections - ${e.message} - ${e.meta}`);
        res.status(500).json({
          error: 'Prisma Client error - Too many connections',
          message: e.message,
          meta: e.meta
        });
      } else {
        res.status(500).json({
          error: 'Prisma Client error'
        });
      }
    }

    if (code === 0) {
      logger.error(`Prisma-Error: ${e.message} - ${e.meta}`);
      if (process.env.EXTRA_INFO === 'true') {
        logger.debug(`Prisma-Error: ${e.message} - ${e.meta}`);
        res.status(500).json({
          error: 'Prisma error',
          message: e.message,
          meta: e.meta
        });
      } else {
        res.status(500).json({
          error: 'Prisma error'
        });
      }
    }
  }
  logger.error(`Error: ${e.message} - ${e.meta}`);
  if (process.env.EXTRA_INFO === 'true') {
    logger.debug(`Error: ${e.message} - ${e.meta}`);
    res.status(500).json({
      error: 'Internal server error',
      message: e.message,
      meta: e.meta
    });
  } else {
    logger.error(`Error: ${e.message} - ${e.meta}`);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
}
