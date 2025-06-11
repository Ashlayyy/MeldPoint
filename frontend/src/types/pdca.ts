export type PDCAStatus = 'success' | 'partial' | 'failed' | null;
export type ActionStatus = 'Niet gestart' | 'In uitvoering' | 'Voltooid';

export interface Smart {
  Specifiek: SmartItem;
  Meetbaar: SmartItem;
  Haalbaar: SmartItem;
  Relevant: SmartItem;
  Tijdgebonden: SmartItem;
}

export interface SmartItem {
  Text: string;
  Behaald: string | undefined;
  Toelichting: string;
}

export interface Preventief {
  Teamleden: any[] | null;
  CorrespondenceIDs: any[] | null;
  Smart: Smart;
  Steps: {
    Obstakel: {
      Finished: boolean;
      Deadline: string | null;
    };
    Plan: {
      Finished: boolean;
      Deadline: string | null;
    };
    Do: {
      Finished: boolean;
      Deadline: string | null;
    };
    Check: {
      Finished: boolean;
      Deadline: string | null;
    };
    Act: {
      Finished: boolean;
      Deadline: string | null;
    };
    Finished: {
      Finished: boolean;
      Deadline: string | null;
    };
  };
  FailureAnalysis: string | null;
  NewPDCAPlanning: string | null;
  Documentation: string | null;
  TrainingNeeded: boolean;
  TrainingNeededType: string | null;
  Monitoring: string | null;
  FollowUpDate: string | null;
  Responsible: string | null;
  TodoItems: any[];
  id: string;
  Kernoorzaak: string | null;
  Why: string | null;
  Deadline: string | null;
  Title: string | null;
  Strategie: any | null;
  Conclusie: string | null;
  PDCAStatus: string | null;
  ActJSON: string | null;
  StatusID: string | null;
  BegeleiderID: string | null;
  Begeleider: any | null;
  CreatedAt: string;
  UpdatedAt: string;
  User: any;
  Status: any;
}
export interface Node {
  id: string;
  label: string;
  title: string;
  description: string;
  status: 'Not Started' | 'In Progress' | 'Completed';
  rootCause?: string;
}



export interface SmartCriteria {
  specific: string;
  measurable: string;
  achievable: string;
  relevant: string;
  timeBound: string;
}

export interface TeamMember {
  id: number;
  Name: string;
  Role?: string;
}

export interface PlanData {
  teamLead: TeamMember | null;
  leanCoach: TeamMember | null;
  kpi: string | null;
  problemJustification: string;
  deadlines: {
    do: string | null;
    check: string | null;
    act: string | null;
  };
  smart: SmartCriteria;
}

export interface Action {
  id: number;
  who: string;
  what: string;
  when: string;
  status: ActionStatus;
  notes: string;
}

export interface DoData {
  actions: Action[];
}

export interface ActionEvaluation {
  effectiveness: 'high' | 'medium' | 'low' | null;
  impact: 'high' | 'medium' | 'low' | null;
  learnings: string;
}

export interface StandardizationAction {
  id: number;
  description: string;
  responsible: string;
  deadline: string;
}

export interface LearningPoint {
  id: number;
  description: string;
  category: string;
}

export interface SmartEvaluation {
  status: 'achieved' | 'partial' | 'not_achieved' | null;
  notes: string;
}

export interface ActionEvaluation {
  effectiveness: 'high' | 'medium' | 'low' | null;
  impact: 'high' | 'medium' | 'low' | null;
  learnings: string;
}

export interface CheckData {
  smartEvaluation: Record<string, SmartEvaluation>;
  actionEvaluation: Record<number, ActionEvaluation>;
  conclusion: string;
  overallStatus: 'success' | 'partial' | 'failed' | null;
  effectiveness: 'high' | 'medium' | 'low' | null;
  impact: 'high' | 'medium' | 'low' | null;
}

export interface ActData {
  implementationStatus: {
    improvements: StandardizationAction[];
    deviations: string;
    unexpectedOutcomes: string;
  };
  standardization: {
    actions: StandardizationAction[];
    documentation: string;
    trainingNeeded: boolean;
    trainingNotes: string;
  };
  sustainability: {
    monitoringPlan: string;
    followUpDate: string | null;
    responsiblePerson: number | null;
  };
  learnings: {
    points: LearningPoint[];
    futureRecommendations: string;
  };
  completionConfidence: number;
  failureAnalysis?: string;
  newPDCAPlanning?: string;
}

export interface ActionStatusConfig {
  text: ActionStatus;
  icon: string;
  color: string;
}
/*
interface PlanData {
  teamLead: TeamMember | null;
  leanCoach: TeamMember | null;
  kpi: string | null;
  problemJustification: string;
  deadlines: {
    do: string | null;
    check: string | null;
    act: string | null;
  };
  smart: {
    specific: string;
    measurable: string;
    achievable: string;
    relevant: string;
    timeBound: string;
  };
}*/