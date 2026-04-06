import { create } from 'zustand';

/**
 * Zustand stores the Auth State.
 * The raw access_token is stored strictly in memory here,
 * protecting it from basic XSS scraping since it's not in localStorage.
 */
export const useAuthStore = create((set) => ({
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: true,

    setAuth: (user, accessToken) => set({
        user,
        accessToken,
        isAuthenticated: !!accessToken,
    }),

    logout: () => set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
    }),

    setLoading: (isLoading) => set({ isLoading }),
}));
