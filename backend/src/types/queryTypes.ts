/* eslint-disable no-shadow */
/* eslint-disable no-use-before-define */
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

export enum Effectiviteit {
  Zeer = 'Zeer',
  Redelijk = 'Redelijk',
  Weinig = 'Weinig'
}

export enum Impact {
  Groot = 'Groot',
  Gemiddeld = 'Gemiddeld',
  Klein = 'Klein'
}

export type UserDepartment = 'OPS' | 'CORRECTIEF' | 'PDCA';

export type Type = 'Melding' | 'Algemeen' | 'Idee';

export type Melding = {
  id: string;
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
  CreatedAt: Date;
  UpdatedAt: Date;
  UserID?: string;
  Projectleider?: Projectleider;
  projectleiderId?: string;
  Title?: string;
  Category?: string;
};

export type Correctief = {
  id: string;
  Deadline: string;
  Oplossing: string;
  Faalkosten?: number;
  AkoordOPS?: boolean;
  TIMER?: number;
  Actiehouder?: Actiehouder;
  Status?: Status;
  StatusID?: string;
  ActiehouderID?: string;
  CreatedAt: Date;
  UpdatedAt: Date;
  Melding: Melding[];
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
  Schade?: Schade;
  Actiehouder?: Actiehouder;
  StatusID?: string;
  RootCauseLevel?: number;
  ActiehouderID?: string;
  Begeleider?: any;
  BegeleiderID?: string;
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

export type Schade = {
  id?: string;
  SchadeNaam: string;
  SchadeType: string;
  CreatedAt?: Date;
  UpdatedAt?: Date;
  Preventief?: Preventief[];
};

export type History = {
  id: string;
  UpdatedBy?: string;
  AffectedModel?: string;
  AffectedType?: string;
  AffectedField?: string;
  OldValue?: string;
  NewValue?: string;
  AffectedID?: string;
  Url?: string;
  CompleteRequest?: string;
  CreatedAt: Date;
  UpdatedAt: Date;
};

export type SmartItem = {
  Text: string;
  Behaald: string;
  Toelichting: string;
};
