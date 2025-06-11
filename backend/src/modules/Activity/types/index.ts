export type ActivityAction = 'FEATURE_USAGE' | 'PAGE_VIEW';

export interface PageViewMetadata {
  path: string;
  duration: number;
  referrer: string;
}

export interface FeatureMetadata {
  [key: string]: unknown;
}

export interface ActivityPayload {
  action: ActivityAction;
  feature: string;
  metadata: PageViewMetadata | FeatureMetadata;
}

export interface ActivityResponse {
  success: boolean;
  executionTime?: string;
}
