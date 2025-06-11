import {
  createStatus as createStatusQuery,
  getStatuses as getStatusesQuery,
  getStatus as getStatusQuery,
  updateStatus as updateStatusQuery,
  deleteStatus as deleteStatusQuery
} from '../../../db/queries/specialized/statusQueries';

export interface Status {
  id: string;
  StatusNaam: string;
  StatusColor: string;
  StatusType: string;
  CreatedAt: Date;
  UpdatedAt: Date;
}

export interface CreateStatusDto {
  StatusNaam: string;
  StatusColor: string;
  StatusType: string;
}

export interface UpdateStatusDto {
  StatusNaam?: string;
  StatusColor?: string;
  StatusType?: string;
}

export async function getAll(): Promise<Status[]> {
  return getStatusesQuery();
}

export async function getById(id: string): Promise<Status | null> {
  return getStatusQuery(id);
}

export async function create(data: CreateStatusDto): Promise<Status> {
  return createStatusQuery(data);
}

export async function update(id: string, data: UpdateStatusDto): Promise<Status | null> {
  return updateStatusQuery(id, data);
}

export async function remove(id: string): Promise<Status | null> {
  return deleteStatusQuery(id);
}
