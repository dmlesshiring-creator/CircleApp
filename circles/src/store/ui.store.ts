import { create } from 'zustand';

/**
 * UI Store - Manages global UI state
 */
interface UIStoreState {
  // Bottom sheet
  bottomSheetVisible: boolean;
  bottomSheetContent: React.ReactNode | null;

  // Modal
  modalVisible: boolean;
  modalContent: React.ReactNode | null;

  // Loading overlay
  loadingOverlay: boolean;
  loadingMessage: string;

  // Toast/Snackbar
  toastVisible: boolean;
  toastMessage: string;
  toastType: 'success' | 'error' | 'info' | 'warning';

  // Keyboard
  keyboardVisible: boolean;

  // Network status
  isOnline: boolean;

  // Badge counts
  totalUnreadCount: number;
  circleUnreadCounts: Record<string, number>;

  // Actions
  showBottomSheet: (content: React.ReactNode) => void;
  hideBottomSheet: () => void;

  showModal: (content: React.ReactNode) => void;
  hideModal: () => void;

  showLoadingOverlay: (message?: string) => void;
  hideLoadingOverlay: () => void;

  showToast: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
  hideToast: () => void;

  setKeyboardVisible: (visible: boolean) => void;
  setIsOnline: (online: boolean) => void;

  setTotalUnreadCount: (count: number) => void;
  setCircleUnreadCount: (circleId: string, count: number) => void;
  incrementCircleUnreadCount: (circleId: string) => void;
  clearCircleUnreadCount: (circleId: string) => void;

  // Reset
  reset: () => void;
}

export const useUIStore = create<UIStoreState>((set, get) => ({
  // Initial state
  bottomSheetVisible: false,
  bottomSheetContent: null,
  modalVisible: false,
  modalContent: null,
  loadingOverlay: false,
  loadingMessage: '',
  toastVisible: false,
  toastMessage: '',
  toastType: 'info',
  keyboardVisible: false,
  isOnline: true,
  totalUnreadCount: 0,
  circleUnreadCounts: {},

  // Bottom sheet actions
  showBottomSheet: (content: React.ReactNode) =>
    set({
      bottomSheetVisible: true,
      bottomSheetContent: content,
    }),

  hideBottomSheet: () =>
    set({
      bottomSheetVisible: false,
      bottomSheetContent: null,
    }),

  // Modal actions
  showModal: (content: React.ReactNode) =>
    set({
      modalVisible: true,
      modalContent: content,
    }),

  hideModal: () =>
    set({
      modalVisible: false,
      modalContent: null,
    }),

  // Loading overlay actions
  showLoadingOverlay: (message: string = 'Loading...') =>
    set({
      loadingOverlay: true,
      loadingMessage: message,
    }),

  hideLoadingOverlay: () =>
    set({
      loadingOverlay: false,
      loadingMessage: '',
    }),

  // Toast actions
  showToast: (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') =>
    set({
      toastVisible: true,
      toastMessage: message,
      toastType: type,
    }),

  hideToast: () =>
    set({
      toastVisible: false,
      toastMessage: '',
    }),

  // Keyboard actions
  setKeyboardVisible: (visible: boolean) =>
    set({ keyboardVisible: visible }),

  // Network actions
  setIsOnline: (online: boolean) =>
    set({ isOnline: online }),

  // Badge count actions
  setTotalUnreadCount: (count: number) =>
    set({ totalUnreadCount: count }),

  setCircleUnreadCount: (circleId: string, count: number) =>
    set((state) => {
      const newCounts = { ...state.circleUnreadCounts, [circleId]: count };
      const total = Object.values(newCounts).reduce((sum, c) => sum + c, 0);
      return {
        circleUnreadCounts: newCounts,
        totalUnreadCount: total,
      };
    }),

  incrementCircleUnreadCount: (circleId: string) =>
    set((state) => {
      const currentCount = state.circleUnreadCounts[circleId] || 0;
      const newCounts = { ...state.circleUnreadCounts, [circleId]: currentCount + 1 };
      const total = Object.values(newCounts).reduce((sum, c) => sum + c, 0);
      return {
        circleUnreadCounts: newCounts,
        totalUnreadCount: total,
      };
    }),

  clearCircleUnreadCount: (circleId: string) =>
    set((state) => {
      const newCounts = { ...state.circleUnreadCounts };
      delete newCounts[circleId];
      const total = Object.values(newCounts).reduce((sum, c) => sum + c, 0);
      return {
        circleUnreadCounts: newCounts,
        totalUnreadCount: total,
      };
    }),

  // Reset
  reset: () =>
    set({
      bottomSheetVisible: false,
      bottomSheetContent: null,
      modalVisible: false,
      modalContent: null,
      loadingOverlay: false,
      loadingMessage: '',
      toastVisible: false,
      toastMessage: '',
      toastType: 'info',
      keyboardVisible: false,
      isOnline: true,
      totalUnreadCount: 0,
      circleUnreadCounts: {},
    }),
}));
