export interface Correctief {
  id: string;
  Deadline: string;
  Oplossing: string;
  Faalkosten?: number | null;
  AkoordOPS?: boolean | null;
  TIMER?: number | null;
  StatusID?: string | null;
  CreatedAt: Date;
  UpdatedAt: Date;
  userId?: string | null;
  Status?: {
    id: string;
    StatusNaam: string;
    StatusColor: string;
    DarkStatusColor?: string | null;
    StatusType: string;
  } | null;
  User?: {
    id: string;
    Name: string;
    Email: string;
  } | null;
  Melding?: Array<{
    id: string;
    Title?: string | null;
  }>;
}

export interface CreateCorrectiefPayload {
  Deadline: string;
  Oplossing: string;
  Faalkosten?: number | null;
  AkoordOPS?: boolean | null;
  TIMER?: number | null;
  StatusID?: string | null;
  userId?: string | null;
}

export interface UpdateCorrectiefPayload {
  Deadline?: string;
  Oplossing?: string;
  Faalkosten?: number | null;
  AkoordOPS?: boolean | null;
  TIMER?: number | null;
  StatusID?: string | null;
  userId?: string | null;
}

export interface CorrectiefFilters {
  StatusID?: string;
  userId?: string;
  search?: string;
}

export interface CorrectiefResponse<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    pageSize?: number;
  };
}
