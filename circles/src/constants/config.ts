import Constants from 'expo-constants';

export const GIPHY_API_KEY = Constants.expoConfig?.extra?.giphyApiKey || '';
export const GOOGLE_MAPS_API_KEY = Constants.expoConfig?.extra?.googleMapsApiKey || '';
export const PERSPECTIVE_API_KEY = Constants.expoConfig?.extra?.perspectiveApiKey || '';

// Feature flags
export const ENABLE_MEMORY_LANE = true;
export const ENABLE_EXPENSE_SPLIT = true;
export const ENABLE_VIDEO_CALLS = true;

// Performance targets
export const COLD_START_TARGET_MS = 2000;
export const CHAT_MESSAGE_TARGET_MS = 500;
export const FEED_LOAD_TARGET_MS = 1500;

// Session timeout for re-auth (minutes)
export const SESSION_TIMEOUT_MINUTES = 30;
