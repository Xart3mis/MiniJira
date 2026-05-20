import { createContext, useContext, useMemo, useState } from 'react';
import { signInWithCognito } from '../services/cognito.js';
import { parseJwt } from '../utils/jwt.js';

const AuthContext = createContext(null);
const STORAGE_KEY = 'minijira_auth';

function loadStoredAuth() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => loadStoredAuth());

  const login = async (email, password) => {
    const session = await signInWithCognito(email, password);
    const idToken = session.getIdToken().getJwtToken();
    const accessToken = session.getAccessToken().getJwtToken();
    const claims = parseJwt(idToken);

    const authPayload = {
      token: idToken,
      accessToken,
      user: {
        userId: claims.sub,
        email: claims.email,
        name: claims.name || claims.email,
        role: claims['custom:role'] || 'Employee',
        teamId: claims['custom:teamId'] || null
      }
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(authPayload));
    setAuth(authPayload);
    return authPayload;
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setAuth(null);
  };

  const value = useMemo(() => ({
    token: auth?.token || null,
    accessToken: auth?.accessToken || null,
    user: auth?.user || null,
    login,
    logout
  }), [auth]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
