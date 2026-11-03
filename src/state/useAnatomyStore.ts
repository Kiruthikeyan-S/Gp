import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BodySystemId } from '../types';

const STORAGE_KEYS = {
  BOOKMARKS: '@anatomy_bookmarks',
  COMPLETED_LESSONS: '@anatomy_completed_lessons',
  QUIZ_STATS: '@anatomy_quiz_stats',
};

export type CameraPreset = 'front' | 'back' | 'side' | 'isometric';

interface AnatomyState {
  selectedOrganId: string | null;
  selectedSystemId: BodySystemId | 'all';
  cameraPreset: CameraPreset;
  bookmarkedOrganIds: string[];
  completedLessonIds: string[];
  quizStats: {
    totalAnswered: number;
    correctCount: number;
    bestScorePercent: number;
    attempts: number;
  };
  isLoadingStorage: boolean;

  // Actions
  selectOrgan: (organId: string | null) => void;
  selectSystem: (systemId: BodySystemId | 'all') => void;
  setCameraPreset: (preset: CameraPreset) => void;
  toggleBookmark: (organId: string) => Promise<void>;
  isBookmarked: (organId: string) => boolean;
  toggleLessonCompleted: (lessonId: string) => Promise<void>;
  isLessonCompleted: (lessonId: string) => boolean;
  recordQuizScore: (correct: number, total: number) => Promise<void>;
  resetProgress: () => Promise<void>;
  loadPersistedData: () => Promise<void>;
}

export const useAnatomyStore = create<AnatomyState>((set, get) => ({
  selectedOrganId: 'heart', // Default to heart for immediate preview
  selectedSystemId: 'all',
  cameraPreset: 'front',
  bookmarkedOrganIds: [],
  completedLessonIds: [],
  quizStats: {
    totalAnswered: 0,
    correctCount: 0,
    bestScorePercent: 0,
    attempts: 0,
  },
  isLoadingStorage: true,

  selectOrgan: (organId) => set({ selectedOrganId: organId }),

  selectSystem: (systemId) => set({ selectedSystemId: systemId }),

  setCameraPreset: (preset) => set({ cameraPreset: preset }),

  toggleBookmark: async (organId) => {
    const current = get().bookmarkedOrganIds;
    const updated = current.includes(organId)
      ? current.filter((id) => id !== organId)
      : [...current, organId];
    set({ bookmarkedOrganIds: updated });
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save bookmark:', e);
    }
  },

  isBookmarked: (organId) => get().bookmarkedOrganIds.includes(organId),

  toggleLessonCompleted: async (lessonId) => {
    const current = get().completedLessonIds;
    const updated = current.includes(lessonId)
      ? current.filter((id) => id !== lessonId)
      : [...current, lessonId];
    set({ completedLessonIds: updated });
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.COMPLETED_LESSONS, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save completed lesson:', e);
    }
  },

  isLessonCompleted: (lessonId) => get().completedLessonIds.includes(lessonId),

  recordQuizScore: async (correct, total) => {
    const currentStats = get().quizStats;
    const percent = Math.round((correct / total) * 100);
    const updated = {
      totalAnswered: currentStats.totalAnswered + total,
      correctCount: currentStats.correctCount + correct,
      bestScorePercent: Math.max(currentStats.bestScorePercent, percent),
      attempts: currentStats.attempts + 1,
    };
    set({ quizStats: updated });
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.QUIZ_STATS, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save quiz stats:', e);
    }
  },

  resetProgress: async () => {
    set({
      bookmarkedOrganIds: [],
      completedLessonIds: [],
      quizStats: { totalAnswered: 0, correctCount: 0, bestScorePercent: 0, attempts: 0 },
    });
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.BOOKMARKS,
        STORAGE_KEYS.COMPLETED_LESSONS,
        STORAGE_KEYS.QUIZ_STATS,
      ]);
    } catch (e) {
      console.warn('Failed to reset storage:', e);
    }
  },

  loadPersistedData: async () => {
    try {
      const [bookmarks, lessons, quiz] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.BOOKMARKS),
        AsyncStorage.getItem(STORAGE_KEYS.COMPLETED_LESSONS),
        AsyncStorage.getItem(STORAGE_KEYS.QUIZ_STATS),
      ]);

      set({
        bookmarkedOrganIds: bookmarks ? JSON.parse(bookmarks) : [],
        completedLessonIds: lessons ? JSON.parse(lessons) : [],
        quizStats: quiz
          ? JSON.parse(quiz)
          : { totalAnswered: 0, correctCount: 0, bestScorePercent: 0, attempts: 0 },
        isLoadingStorage: false,
      });
    } catch (e) {
      console.warn('Failed to load persisted data:', e);
      set({ isLoadingStorage: false });
    }
  },
}));
