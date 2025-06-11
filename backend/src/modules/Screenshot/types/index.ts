import type { ScreenshotResponse } from '../validation/schemas';

export interface UploadResponse {
  data: ScreenshotResponse;
}

export interface ScreenshotMetadata {
  fileSize: number;
  mimeType: string;
  uploadProvider: string;
}

export interface ScreenshotUploadResult {
  url: string;
  metadata: ScreenshotMetadata;
}
