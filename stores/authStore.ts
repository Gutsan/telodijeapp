import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  session: any | null;
  loading: boolean;
  initialized: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setSession: (session: any | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;

  // Auth actions
  initialize: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

/**
 * Try to fetch the user profile from DB.
 * If it doesn't exist, create it.
 * If DB fails entirely, return a virtual profile from session data.
 */
async function fetchOrCreateProfile(userId: string, userData?: any): Promise<User> {
  // 1. Try to fetch existing profile
  const { data: profile, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (!fetchError && profile) {
    return profile;
  }

  console.log('Profile not found, creating...', fetchError?.message);

  // 2. Try to create it
  const { data: newProfile, error: createError } = await supabase
    .from('users')
    .insert({
      id: userId,
      email: userData?.email || '',
      full_name: userData?.full_name ||
                 userData?.name ||
                 userData?.email?.split('@')[0] || 'Usuario',
      avatar_url: userData?.avatar_url || userData?.picture || null,
      provider: userData?.provider || 'email',
      provider_id: userData?.provider_id || null,
      plan_type: 'free',
    })
    .select()
    .single();

  if (!createError && newProfile) {
    return newProfile;
  }

  // 3. DB failed — return virtual profile from session data
  // This ensures the user can always log in
  console.log('DB insert failed, using session data as profile:', createError?.message);
  return {
    id: userId,
    email: userData?.email || '',
    full_name: userData?.full_name ||
               userData?.name ||
               userData?.email?.split('@')[0] || 'Usuario',
    avatar_url: userData?.avatar_url || userData?.picture || null,
    provider: userData?.provider || 'email',
    provider_id: userData?.provider_id || null,
    plan_type: 'free',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as User;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  loading: true,
  initialized: false,

  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setLoading: (loading) => set({ loading }),
  setInitialized: (initialized) => set({ initialized }),

  initialize: async () => {
    try {
      set({ loading: true });

      // STEP 1: Try to get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('Error getting session:', sessionError);
      }

      if (session?.user) {
        console.log('✅ Session found from getSession():', session.user.email);
        const profile = await fetchOrCreateProfile(session.user.id, session.user.user_metadata);
        set({ session, user: profile, loading: false, initialized: true });
      } else {
        console.log('⏳ No session from getSession(), waiting for auth events...');
      }

      // STEP 2: Listen for ALL auth events
      supabase.auth.onAuthStateChange(async (event, newSession) => {
        console.log('🔑 Auth event:', event, '| user:', newSession?.user?.email ?? 'null', '| hasSession:', !!newSession);

        const currentState = get();

        if (event === 'INITIAL_SESSION') {
          if (newSession?.user) {
            // INITIAL_SESSION with valid session — process it
            console.log('✅ INITIAL_SESSION has user:', newSession.user.email);
            if (!currentState.user) {
              const profile = await fetchOrCreateProfile(newSession.user.id, newSession.user.user_metadata);
              set({ session: newSession, user: profile, loading: false, initialized: true });
            }
          } else {
            // INITIAL_SESSION with NO user — stale/invalid session
            console.log('❌ INITIAL_SESSION has no user — clearing stale session');
            // If we already marked as initialized from getSession(), skip
            if (!currentState.initialized) {
              set({ loading: false, initialized: true });
            }
          }
          return;
        }

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (newSession?.user) {
            console.log('✅ SIGNED_IN/TOKEN_REFRESHED:', newSession.user.email);
            const profile = await fetchOrCreateProfile(newSession.user.id, newSession.user.user_metadata);
            set({ session: newSession, user: profile, loading: false, initialized: true });
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 SIGNED_OUT');
          set({ session: null, user: null, loading: false, initialized: true });
        }
      });
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({ loading: false, initialized: true });
    }
  },

  signInWithEmail: async (email, password) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      return { error: 'Error al iniciar sesión' };
    }
  },

  signUpWithEmail: async (email, password) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: email.split('@')[0],
          },
        },
      });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      return { error: 'Error al crear cuenta' };
    }
  },

  signInWithGoogle: async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8081',
        },
      });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      return { error: 'Error al iniciar sesión con Google' };
    }
  },

  signOut: async () => {
    try {
      await supabase.auth.signOut();
      set({ user: null, session: null });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  },

  refreshUser: async () => {
    const { session } = get();
    if (!session?.user) return;

    const profile = await fetchOrCreateProfile(session.user.id, session.user.user_metadata);
    if (profile) {
      set({ user: profile });
    }
  },
}));
