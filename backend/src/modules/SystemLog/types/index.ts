export interface SystemLog {
  id: string;
  timestamp: Date;
  userId?: string;
  userEmail?: string;
  userName?: string;
  userRole?: string;
  department?: string;
  ipAddress?: string;
  userAgent?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  success: boolean;
  endpoint?: string;
  method?: string;
  previousState?: string;
  newState?: string;
  changedFields?: string;
  metadata?: string;
  errorMessage?: string;
  sessionId?: string;
  requestBody?: string;
  requestQuery?: string;
  requestParams?: string;
}

export interface SystemLogResponse {
  data: SystemLog[];
}

export interface SystemLogParams {
  meldingId: string;
  preventiefId: string;
  correctiefId: string;
}
