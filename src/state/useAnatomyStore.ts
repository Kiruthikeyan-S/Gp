import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BodySystemId } from '../types';

const STORAGE_KEYS = {
  BOOKMARKS: '@anatomy_bookmarks',
  COMPLETED_LESSONS: '@anatomy_completed_lessons',
  QUIZ_STATS: '@anatomy_quiz_stats',
  KNOWN_FLASHCARDS: '@anatomy_known_flashcards',
  REVIEW_FLASHCARDS: '@anatomy_review_flashcards',
  STREAK: '@anatomy_streak',
  TOPIC_STATS: '@anatomy_topic_stats',
};

export type CameraPreset = 'front' | 'back' | 'side' | 'isometric';

interface AnatomyState {
  selectedOrganId: string | null;
  selectedSystemId: BodySystemId | 'all';
  cameraPreset: CameraPreset;
  bookmarkedOrganIds: string[];
  completedLessonIds: string[];
  knownFlashcardIds: string[];
  reviewFlashcardIds: string[];
  streakDays: number;
  lastActiveDate: string | null;
  quizStats: {
    totalAnswered: number;
    correctCount: number;
    bestScorePercent: number;
    attempts: number;
  };
  topicStats: Record<string, { correct: number; incorrect: number }>;
  isLoadingStorage: boolean;

  // Actions
  selectOrgan: (organId: string | null) => void;
  selectSystem: (systemId: BodySystemId | 'all') => void;
  setCameraPreset: (preset: CameraPreset) => void;
  toggleBookmark: (organId: string) => Promise<void>;
  isBookmarked: (organId: string) => boolean;
  toggleLessonCompleted: (lessonId: string) => Promise<void>;
  isLessonCompleted: (lessonId: string) => boolean;
  markFlashcardKnown: (id: string) => Promise<void>;
  markFlashcardReview: (id: string) => Promise<void>;
  recordQuizScore: (correct: number, total: number) => Promise<void>;
  recordTopicResult: (systemId: string, isCorrect: boolean) => Promise<void>;
  recordDailyActivity: () => Promise<void>;
  resetProgress: () => Promise<void>;
  loadPersistedData: () => Promise<void>;
}

export const useAnatomyStore = create<AnatomyState>((set, get) => ({
  selectedOrganId: 'heart', // Default to heart for immediate preview
  selectedSystemId: 'all',
  cameraPreset: 'front',
  bookmarkedOrganIds: [],
  completedLessonIds: [],
  knownFlashcardIds: [],
  reviewFlashcardIds: [],
  streakDays: 1,
  lastActiveDate: null,
  quizStats: {
    totalAnswered: 0,
    correctCount: 0,
    bestScorePercent: 0,
    attempts: 0,
  },
  topicStats: {},
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

  markFlashcardKnown: async (id) => {
    const known = get().knownFlashcardIds;
    const review = get().reviewFlashcardIds;
    const updatedKnown = known.includes(id) ? known : [...known, id];
    const updatedReview = review.filter((rId) => rId !== id);
    set({ knownFlashcardIds: updatedKnown, reviewFlashcardIds: updatedReview });
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.KNOWN_FLASHCARDS, JSON.stringify(updatedKnown)),
        AsyncStorage.setItem(STORAGE_KEYS.REVIEW_FLASHCARDS, JSON.stringify(updatedReview)),
      ]);
    } catch (e) {
      console.warn('Failed to save known flashcard:', e);
    }
  },

  markFlashcardReview: async (id) => {
    const known = get().knownFlashcardIds;
    const review = get().reviewFlashcardIds;
    const updatedReview = review.includes(id) ? review : [...review, id];
    const updatedKnown = known.filter((kId) => kId !== id);
    set({ knownFlashcardIds: updatedKnown, reviewFlashcardIds: updatedReview });
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.KNOWN_FLASHCARDS, JSON.stringify(updatedKnown)),
        AsyncStorage.setItem(STORAGE_KEYS.REVIEW_FLASHCARDS, JSON.stringify(updatedReview)),
      ]);
    } catch (e) {
      console.warn('Failed to save review flashcard:', e);
    }
  },

  recordDailyActivity: async () => {
    const today = new Date().toISOString().slice(0, 10);
    const last = get().lastActiveDate;
    let streak = get().streakDays;
    if (last === today) return;

    if (last) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      streak = last === yesterday ? streak + 1 : 1;
    } else {
      streak = 1;
    }
    set({ streakDays: streak, lastActiveDate: today });
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.STREAK, JSON.stringify({ streak, last: today }));
    } catch (e) {
      console.warn('Failed to save streak:', e);
    }
  },

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
    get().recordDailyActivity();
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.QUIZ_STATS, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save quiz stats:', e);
    }
  },

  recordTopicResult: async (systemId, isCorrect) => {
    const current = get().topicStats;
    const stats = current[systemId] || { correct: 0, incorrect: 0 };
    const updated = {
      ...current,
      [systemId]: {
        correct: isCorrect ? stats.correct + 1 : stats.correct,
        incorrect: !isCorrect ? stats.incorrect + 1 : stats.incorrect,
      },
    };
    set({ topicStats: updated });
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TOPIC_STATS, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save topic stats:', e);
    }
  },

  resetProgress: async () => {
    set({
      bookmarkedOrganIds: [],
      completedLessonIds: [],
      knownFlashcardIds: [],
      reviewFlashcardIds: [],
      streakDays: 1,
      quizStats: { totalAnswered: 0, correctCount: 0, bestScorePercent: 0, attempts: 0 },
      topicStats: {},
    });
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.BOOKMARKS,
        STORAGE_KEYS.COMPLETED_LESSONS,
        STORAGE_KEYS.QUIZ_STATS,
        STORAGE_KEYS.KNOWN_FLASHCARDS,
        STORAGE_KEYS.REVIEW_FLASHCARDS,
        STORAGE_KEYS.STREAK,
        STORAGE_KEYS.TOPIC_STATS,
      ]);
    } catch (e) {
      console.warn('Failed to reset storage:', e);
    }
  },

  loadPersistedData: async () => {
    try {
      const [bookmarks, lessons, quiz, knownFc, reviewFc, streakData, topicData] =
        await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.BOOKMARKS),
          AsyncStorage.getItem(STORAGE_KEYS.COMPLETED_LESSONS),
          AsyncStorage.getItem(STORAGE_KEYS.QUIZ_STATS),
          AsyncStorage.getItem(STORAGE_KEYS.KNOWN_FLASHCARDS),
          AsyncStorage.getItem(STORAGE_KEYS.REVIEW_FLASHCARDS),
          AsyncStorage.getItem(STORAGE_KEYS.STREAK),
          AsyncStorage.getItem(STORAGE_KEYS.TOPIC_STATS),
        ]);

      const parsedStreak = streakData ? JSON.parse(streakData) : null;

      set({
        bookmarkedOrganIds: bookmarks ? JSON.parse(bookmarks) : [],
        completedLessonIds: lessons ? JSON.parse(lessons) : [],
        knownFlashcardIds: knownFc ? JSON.parse(knownFc) : [],
        reviewFlashcardIds: reviewFc ? JSON.parse(reviewFc) : [],
        streakDays: parsedStreak?.streak || 1,
        lastActiveDate: parsedStreak?.last || null,
        quizStats: quiz
          ? JSON.parse(quiz)
          : { totalAnswered: 0, correctCount: 0, bestScorePercent: 0, attempts: 0 },
        topicStats: topicData ? JSON.parse(topicData) : {},
        isLoadingStorage: false,
      });
    } catch (e) {
      console.warn('Failed to load persisted data:', e);
      set({ isLoadingStorage: false });
    }
  },
}));
