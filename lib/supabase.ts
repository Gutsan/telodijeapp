import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// SSR-safe storage adapter
const isServer = typeof window === 'undefined';

const webStorage: Storage = {
  getItem: (key: string) => {
    if (isServer) return null;
    return window.localStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    if (isServer) return;
    window.localStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    if (isServer) return;
    window.localStorage.removeItem(key);
  },
  clear: () => {
    if (isServer) return;
    window.localStorage.clear();
  },
  get length() {
    if (isServer) return 0;
    return window.localStorage.length;
  },
  key: (index: number) => {
    if (isServer) return null;
    return window.localStorage.key(index);
  },
};

// Use localStorage on web (SSR-safe), AsyncStorage on native
const getStorage = () => {
  if (typeof window !== 'undefined') {
    return webStorage;
  }
  return AsyncStorage;
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: getStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
