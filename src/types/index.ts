export type BodySystemId =
  | 'circulatory'
  | 'respiratory'
  | 'nervous'
  | 'digestive'
  | 'urinary'
  | 'skeletal'
  | 'muscular';

export interface Organ {
  id: string;
  name: string;
  systemId: BodySystemId;
  systemName: string;
  location: string;
  function: string;
  howItWorks: string;
  facts: string[];
  relatedOrganIds: string[];
  meshName: string;
  accentColor: string;
  icon: string;
}

export interface BodySystem {
  id: BodySystemId;
  name: string;
  description: string;
  color: string;
  icon: string;
  organIds: string[];
}

export interface Lesson {
  id: string;
  title: string;
  organId: string;
  systemId: BodySystemId;
  readTimeMinutes: number;
  summary: string;
  sections: {
    heading: string;
    body: string;
  }[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  organId?: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export type RootStackParamList = {
  MainTabs: undefined;
  OrganDetails: { organId: string };
};

export type TabParamList = {
  HomeTab: undefined;
  ExplorerTab: { targetOrganId?: string; targetSystemId?: BodySystemId } | undefined;
  SystemsTab: undefined;
  LearnTab: undefined;
  ChatTab: undefined;
  QuizTab?: undefined;
};
