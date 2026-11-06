export type BodySystemId =
  | 'skeletal'
  | 'muscular'
  | 'nervous'
  | 'circulatory'
  | 'respiratory'
  | 'digestive'
  | 'urinary'
  | 'reproductive'
  | 'endocrine'
  | 'lymphatic';

export interface Flashcard {
  id: string;
  systemId: BodySystemId;
  organId?: string;
  term: string;
  definition: string;
  clinicalNote?: string;
  category: 'Structure' | 'Function' | 'Physiology' | 'Clinical';
}

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
  systemId?: BodySystemId;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  options: string[];
  correctIndex: number;
  explanation: string;
}

export type RootStackParamList = {
  MainTabs: undefined;
  OrganDetails: { organId: string; subPartId?: string };
  Quiz: { systemId?: BodySystemId } | undefined;
  Flashcards: { systemId?: BodySystemId } | undefined;
  Dashboard: undefined;
  Search: undefined;
  Credits: undefined;
};

export type TabParamList = {
  HomeTab: undefined;
  ExplorerTab: { targetOrganId?: string; targetSystemId?: BodySystemId } | undefined;
  SystemsTab: undefined;
  LearnTab: undefined;
  ChatTab: undefined;
  QuizTab?: undefined;
};
