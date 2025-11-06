import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      }
      setLoading(false);
    };
    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();  // Single row expect

      if (error) {
        if (error.code === 'PGRST116') {  // No rows - Create fallback
          console.log('No profile, creating...');
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              email: user.email,
              full_name: user.user_metadata?.full_name || user.email.split('@')[0],
              role: user.user_metadata?.role || 'employee',  // From metadata
              manager_id: null,
              updated_at: new Date().toISOString()
            });
          if (insertError) throw insertError;

          // Re-fetch
          const { data: newProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
          setProfile(newProfile);
          return newProfile;
        } else {
          throw error;  // Other errors
        }
      }

      setProfile(data);
      return data;
    } catch (err) {
      console.error('Error fetching profile:', err);
      setProfile(null);  // Fallback null, no crash
    }
  };

  const value = {
    user,
    profile,
    loading,
    signOut: async () => {
      await supabase.auth.signOut();
    }
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};


