// PHP + MySQL Auth Service
// Replaces Firebase Auth with PHP Session endpoints

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  avatar?: string;
  phone?: string;
  location?: string;
  bio?: string;
  points?: number;
  language?: string;
  dark_mode?: boolean;
  created_at: string;
}

const API_URL = '/api';

const SESSION_KEY = 'sorgummology_user_session';

export const registerUser = async (name: string, email: string, password: string) => {
  const response = await fetch(`${API_URL}/register.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  });

  const result = await response.json();
  if (result.status === 'success') {
    const profile = result.data as UserProfile;
    localStorage.setItem(SESSION_KEY, JSON.stringify(profile));
    return profile;
  } else {
    throw new Error(result.message);
  }
};

export const loginUser = async (email: string, password: string) => {
  const response = await fetch(`${API_URL}/login.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const result = await response.json();
  if (result.status === 'success') {
    const profile = result.data as UserProfile;
    localStorage.setItem(SESSION_KEY, JSON.stringify(profile));
    return profile;
  } else {
    throw new Error(result.message);
  }
};

export const logoutUser = async () => {
  localStorage.removeItem(SESSION_KEY);
  try {
    const response = await fetch(`${API_URL}/logout.php`);
    await response.json();
  } catch (e) {
    console.warn('Logout API call failed, but local session cleared', e);
  }
};

export const subscribeToAuthChanges = (callback: (userProfile: UserProfile | null) => void) => {
  // Use localStorage as primary source of truth for stability in preview/local
  const savedSession = localStorage.getItem(SESSION_KEY);
  if (savedSession) {
    try {
      callback(JSON.parse(savedSession));
    } catch (e) {
      console.error('Error parsing saved session', e);
      callback(null);
    }
  } else {
    // Optionally still check session from server
    checkSession().then(profile => {
      if (profile) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(profile));
        callback(profile);
      } else {
        callback(null);
      }
    }).catch(() => callback(null));
  }
  
  return () => {}; // Cleanup
};

export const checkSession = async (): Promise<UserProfile | null> => {
  try {
    const response = await fetch(`${API_URL}/check-session.php`);
    const result = await response.json();
    if (result.status === 'success') {
      return result.data as UserProfile;
    }
  } catch (err) {
    console.error('Session check failed', err);
  }
  return null;
};

export const forgotPassword = async (email: string) => {
  const response = await fetch(`${API_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });

  const result = await response.json();
  if (result.status === 'success' || response.ok) {
    return result;
  } else {
    throw new Error(result.message || 'Gagal mengirim email reset password');
  }
};

export const resetPassword = async (token: string, password: string) => {
  const response = await fetch(`${API_URL}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password })
  });

  const result = await response.json();
  if (result.status === 'success' || response.ok) {
    return result;
  } else {
    throw new Error(result.message || 'Gagal mengatur ulang password');
  }
};
