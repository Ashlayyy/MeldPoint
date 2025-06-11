import { Backup } from '@prisma/client';

export interface BackupWithMetadata extends Backup {
  fileName: string;
  size: number;
}

export interface BackupDownloadResult {
  data: Buffer;
  fileName: string;
}

export type BackupProgressCallback = (progress: number) => void;
