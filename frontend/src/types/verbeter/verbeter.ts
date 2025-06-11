export type IDArray = {
  IDs: string[];
};

export type CorrespondenceIDs = {
  IDs: string;
};

export type Question = {
  Answer: string;
  Place: number;
};

export type Questions = {
  Question1?: Question;
  Question2?: Question;
  Question3?: Question;
  Question4?: Question;
};

export type UserDepartment = 'OPS' | 'CORRECTIEF' | 'PDCA';

export type Type = 'Melding' | 'Algemeen' | 'Idee';

export type Melding = {
  id?: string;
  VolgNummer?: number;
  Archived: boolean;
  PDCA: boolean;
  Type: Type;
  Obstakel: string;
  CorrespondenceIDs?: CorrespondenceIDs;
  CloneIds?: IDArray;
  ClonedTo?: string;
  Deelorder?: string;
  ChatRoomID?: string;
  Correctief?: Correctief;
  Preventief?: Preventief;
  Project?: Project;
  Status?: Status;
  Actiehouder?: Actiehouder;
  CorrectiefID?: string;
  PreventiefID?: string;
  ProjectID?: string;
  StatusID?: string;
  ActiehouderID?: string;
  CreatedAt?: Date;
  UpdatedAt?: Date;
  UserID?: string;
  Projectleider?: Projectleider;
  projectleiderId?: string;
};

export type Correctief = {
  id?: string;
  Deadline: string;
  Oplossing: string;
  Faalkosten?: number;
  AkoordOPS?: boolean;
  TIMER?: number;
  Actiehouder?: Actiehouder;
  Status?: Status;
  StatusID?: string;
  ActiehouderID?: string;
  CreatedAt?: Date;
  UpdatedAt?: Date;
  Melding?: Melding[];
};

export type Preventief = {
  id: string;
  Teamleden?: IDArray;
  CorrespondenceIDs?: CorrespondenceIDs;
  Oorzaak?: string;
  Deadline: string;
  Title?: string;
  Answers?: Questions;
  Status?: Status;
  Actiehouder?: Actiehouder;
  StatusID?: string;
  ActiehouderID?: string;
  CreatedAt: Date;
  UpdatedAt: Date;
  Melding: Melding[];
};

export type Project = {
  id: string;
  NumberID: number;
  ProjectNaam: string;
  Deelorders: string[];
  ProjectLeider?: Projectleider;
  ProjectleiderId?: string;
  CreatedAt: Date;
  UpdatedAt: Date;
  Melding: Melding[];
};

export type Status = {
  id: string;
  StatusNaam: string;
  StatusColor: string;
  StatusType: string;
  CreatedAt: Date;
  UpdatedAt: Date;
  Correctief: Correctief[];
  Preventief: Preventief[];
  Melding: Melding[];
};

export type Actiehouder = {
  id: string;
  Name: string;
  Email?: string;
  CreatedAt: Date;
  UpdatedAt: Date;
  Correctief: Correctief[];
  Preventief: Preventief[];
  Melding: Melding[];
};

export type Projectleider = {
  id: string;
  Name: string;
  CreatedAt: Date;
  UpdatedAt: Date;
  Melding: Melding[];
  Project: Project[];
};
