import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const DEMO = true; // Forced for preview deployment
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL?.toLowerCase();
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

type AppRole = 'admin' | 'technician' | 'client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: AppRole | null;
  profile: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    company_name: string | null;
    avatar_url: string | null;
  } | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isTechnician: boolean;
  isClient: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<AppRole | null>(null);
  const [profile, setProfile] = useState<AuthContextType['profile']>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (DEMO) {
      const demoUser = { id: 'demo-user', email: 'demo@doit.app' } as unknown as User;
      setUser(demoUser);
      setSession(null);
      setRole('admin');
      setProfile({
        first_name: 'Demo',
        last_name: 'Admin',
        email: 'demo@doit.app',
        phone: '0000000000',
        company_name: 'DOIT',
        avatar_url: null,
      });
      setLoading(false);
      return;
    }
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch role and profile
          setTimeout(async () => {
            await fetchUserData(session.user.id);
          }, 0);
        } else {
          setRole(null);
          setProfile(null);
        }
        setLoading(false);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (roleData) {
        setRole(roleData.role as AppRole);
      }

      // Fetch profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('first_name, last_name, email, phone, company_name, avatar_url')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (profileData) {
        setProfile(profileData);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    // Hardcoded override for specific admin request
    if (email === 'admin@doit.app' && password === 'ADMIN123') {
      const adminUser = { id: 'super-admin', email } as unknown as User;
      setUser(adminUser);
      setSession(null);
      setRole('admin');
      setProfile({
        first_name: 'Super',
        last_name: 'Admin',
        email,
        phone: null,
        company_name: 'DOIT',
        avatar_url: null,
      });
      toast({ title: 'Accesso Super Admin', description: 'Accesso garantito.' });
      return;
    }

    if (DEMO) {
      const demoUser = { id: 'demo-user', email } as unknown as User;
      setUser(demoUser);
      setSession(null);
      setRole('admin');
      setProfile({
        first_name: 'Demo',
        last_name: 'Admin',
        email,
        phone: null,
        company_name: 'DOIT',
        avatar_url: null,
      });
      toast({ title: 'Accesso demo', description: 'Sei entrato come Admin demo.' });
      return;
    }
    if (ADMIN_EMAIL && ADMIN_PASSWORD && email.toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const adminUser = { id: 'local-admin', email } as unknown as User;
      setUser(adminUser);
      setSession(null);
      setRole('admin');
      setProfile({
        first_name: 'Admin',
        last_name: 'DOIT',
        email,
        phone: null,
        company_name: 'DOIT',
        avatar_url: null,
      });
      toast({ title: 'Accesso admin', description: 'Sei entrato come Admin.' });
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Errore di accesso',
        description: error.message,
      });
      throw error;
    }

    toast({
      title: 'Accesso effettuato',
      description: 'Benvenuto!',
    });
  };

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    if (DEMO) {
      await signIn(email, password);
      return;
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Errore di registrazione',
        description: error.message,
      });
      throw error;
    }

    toast({
      title: 'Registrazione completata',
      description: 'Controlla la tua email per verificare l\'account.',
    });
  };

  const signOut = async () => {
    if (DEMO || !session || user?.id === 'local-admin') {
      setUser(null);
      setSession(null);
      setRole(null);
      setProfile(null);
      return;
    }
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Errore',
        description: error.message,
      });
      throw error;
    }
    
    setUser(null);
    setSession(null);
    setRole(null);
    setProfile(null);
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    role,
    profile,
    signIn,
    signUp,
    signOut,
    isAdmin: role === 'admin',
    isTechnician: role === 'technician',
    isClient: role === 'client',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
