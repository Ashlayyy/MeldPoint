import { Response } from 'express';
import { Prisma } from '@prisma/client';

export default function handleError(error: unknown, res: Response): void {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        res.status(409).json({ error: 'A record with this unique constraint already exists' });
        return;
      case 'P2025':
        res.status(404).json({ error: 'Record not found' });
        return;
      case 'P2003':
        res.status(400).json({ error: 'Invalid foreign key constraint' });
        return;
      default:
        res.status(500).json({ error: 'Database error occurred' });
        return;
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({ error: 'Invalid data provided' });
    return;
  }

  if (error instanceof Error) {
    if (error.message.includes('not found') || error.message.includes('Not found')) {
      res.status(404).json({ error: error.message });
      return;
    }

    if (error.message.includes('unauthorized') || error.message.includes('Unauthorized')) {
      res.status(401).json({ error: error.message });
      return;
    }

    if (error.message.includes('forbidden') || error.message.includes('Forbidden')) {
      res.status(403).json({ error: error.message });
      return;
    }

    if (error.message.includes('invalid') || error.message.includes('Invalid')) {
      res.status(400).json({ error: error.message });
      return;
    }
  }

  // Default error response
  res.status(500).json({ error: process.env.EXTRA_INFO === 'true' ? error : 'An unexpected error occurred' });
}
