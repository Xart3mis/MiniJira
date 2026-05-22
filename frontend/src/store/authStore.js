import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { setApiAuth } from '../api/client';
import { decodeJwt } from '../lib/utils';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (token) => {
        const payload = decodeJwt(token);
        const user = {
          userId: payload?.sub ?? '',
          email: payload?.email ?? '',
          name: payload?.name ?? payload?.email ?? '',
          role: payload?.['custom:role'] ?? 'Employee',
          teamId: payload?.['custom:teamId'] ?? null,
        };
        set({ user, token, isAuthenticated: true });
        setApiAuth({
          tokenGetter: () => token,
          unauthorizedHandler: () => get().clearAuth(),
        });
      },

      updateUser: (updates) =>
        set((s) => ({ user: s.user ? { ...s.user, ...updates } : s.user })),

      clearAuth: () => {
        set({ user: null, token: null, isAuthenticated: false });
        setApiAuth({ tokenGetter: () => null, unauthorizedHandler: () => {} });
      },

      isManager: () => get().user?.role === 'Manager',
    }),
    {
      name: 'minijira-auth',
      partialize: (s) => ({ user: s.user, token: s.token, isAuthenticated: s.isAuthenticated }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          setApiAuth({
            tokenGetter: () => state.token,
            unauthorizedHandler: () => state.clearAuth(),
          });
        }
      },
    }
  )
);

export default useAuthStore;
