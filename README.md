# 3D Human Anatomy Explorer (Android App)

An interactive, educational 3D Human Anatomy application built with **React Native**, **Expo SDK 58**, **TypeScript**, and **Zustand**.

## Overview
This app enables students and curious learners to explore the human body:
- **Interactive 3D Anatomy Viewport**: 360-degree rotation, pinch zoom, camera angle presets (Front, Back, Side, Isometric).
- **Body Systems Filtering**: Circulatory, Respiratory, Nervous, Digestive, Urinary, Skeletal, and Muscular systems.
- **Organ Deep Dives**: Brain, Heart, Lungs, Liver, Stomach, Kidneys, Small Intestine, Large Intestine, Pancreas, Spleen.
- **Lessons & Quizzes**: Structured bite-sized anatomy lessons with interactive quizzes and local progress tracking via AsyncStorage.

## Project Structure
```
src/
  components/     # Reusable UI components (Header, Badges, OrganCard, StatCard)
  data/           # Verified anatomical data, systems, lessons, and quizzes
  navigation/     # Bottom Tabs & Stack navigation
  screens/        # Home, 3D Explorer, Body Systems, Lessons, Quiz, Organ Details
  state/          # Zustand store with AsyncStorage persistence
  theme/          # Clean, modern light theme tokens
  types/          # Type definitions
```

## Running the App on Windows

### 1. Start Dev Server
```bash
npx expo start
```

### 2. Run on your Android Phone (POCO)
- Download the **Expo Go** app from Google Play Store on your phone.
- Make sure your phone and PC are connected to the same Wi-Fi network.
- Scan the QR code displayed in the terminal using the Expo Go app (or camera).
- Alternatively, connect via USB with USB Debugging enabled:
```bash
npx expo start --android
```

### 3. Type Checking
```bash
npx tsc --noEmit
npx expo-doctor
```
