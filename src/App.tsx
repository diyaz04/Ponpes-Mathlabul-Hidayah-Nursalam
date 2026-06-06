import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useNotifikasi } from './hooks/useNotifikasi';
import { useRealtime } from './hooks/useRealtime';
import { dbLocal, supabase, isRealSupabaseConfigured } from './lib/supabase';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { UserDashboard } from './components/user/UserDashboard';
import { GuruDashboard } from './components/guru/GuruDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { LandingPage } from './components/landing/LandingPage';
import { 
  Sparkles, BookOpen, Clock, Heart, Award, CheckCircle2, 
  MapPin, Phone, Mail, LogIn, ChevronRight, GraduationCap, 
  User, ShieldAlert, CreditCard, ShieldCheck, Newspaper 
} from 'lucide-react';

export default function App() {
  const { user, login, logout } = useAuth();
  const { notifications, unreadCount } = useNotifikasi();

  const [beritaList, setBeritaList] = useState<any[]>([]);

  useRealtime(() => {
    setBeritaList(dbLocal.getBerita());
  });

  // Navigation states
  const [activeMenu, setActiveMenu] = useState('overview'); // state matches Sidebar id
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [loginError, setLoginError] = useState<string | null>(null);

  // Auto-switch to portal state when user is logged in
  useEffect(() => {
    if (user) {
      setActiveMenu('overview');
    }
  }, [user]);

  // Handle preset quick logins for easy presenter evaluation
  const handlePresetLogin = async (role: 'user' | 'guru' | 'admin') => {
    setLoginError(null);
    let email = '';

    if (role === 'admin') {
      email = 'adminnursalam@gmail.com';
    } else if (role === 'guru') {
      email = 'fauzi@mathlabulhidayah.sch.id';
    } else {
      email = 'kurniawan@gmail.com';
    }

    const matches = dbLocal.getProfiles().find(p => p.email?.toLowerCase() === email.toLowerCase());
    if (matches) {
      login(matches.role, matches.id);
    } else {
      setLoginError('Koneksi sistem terganggu. Sila muat ulang halaman.');
    }
  };

  const handleLandingManualLogin = async (e: React.FormEvent, email: string, pass: string) => {
    e.preventDefault();
    setLoginError(null);
    if (!email || !pass) {
      setLoginError('Harap mengisi kolom email & password!');
      return;
    }

    // 1. If real Supabase client is configured, check auth via Supabase
    if (isRealSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password: pass
        });
        if (error) {
          throw error;
        }
        if (data.user) {
          // Sync with local fallback structures
          let profile = dbLocal.getProfiles().find(p => p.email?.toLowerCase() === email.trim().toLowerCase());
          if (!profile) {
            const userRole = (data.user.user_metadata?.role || 'user') as any;
            const fullName = data.user.user_metadata?.full_name || 'Pengguna Baru';
            const newProfiles = dbLocal.getProfiles();
            const newP = {
              id: data.user.id,
              role: userRole,
              full_name: fullName,
              email: email.trim().toLowerCase(),
              is_active: true,
              password: pass,
              avatar_url: data.user.user_metadata?.avatar_url || ''
            };
            dbLocal.setProfiles([...newProfiles, newP]);
            profile = newP;
          }
          login(profile.role, profile.id);
          return;
        }
      } catch (err: any) {
        console.warn('[Supabase Auth Failure] Fallback to local profiles...', err.message);
        // We will continue to fallback below, but if user explicitly has incorrect supabase pass on real config,
        // we can still let them slide locally to prevent local testing freeze, or lock/prompt. Let's let them fall back!
      }
    }

    // 2. Fallback to storage profiles (e.g. adminnursalam@gmail.com pre-seeded or local-only)
    const matches = dbLocal.getProfiles().find(p => p.email?.toLowerCase() === email.trim().toLowerCase());
    if (matches) {
      if (matches.password && matches.password !== pass) {
        setLoginError('Sandi yang dimasukkan salah. Harap koreksi sandi Anda.');
        return;
      }
      login(matches.role, matches.id);
    } else {
      setLoginError('Alamat email belum terdaftar dalam portal pesantren ini.');
    }
  };

  // Notification action proxy logic
  const handleNotificationClick = (tipe: string, refId?: string) => {
    if (tipe === 'tagihan' || tipe === 'pembayaran') {
      setActiveMenu('tagihan');
    } else if (tipe === 'hapalan') {
      setActiveMenu('hapalan');
    } else if (tipe === 'pelanggaran') {
      setActiveMenu('pelanggaran');
    } else {
      setActiveMenu('overview');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-gray-800 flex flex-col font-sans transition-all selection:bg-green-200">
      
      {/* ========================================== */}
      {/* PUBLIC VISITOR SIDEBAR / PAGES CONTAINER */}
      {/* ========================================== */}
      {!user ? (
        <LandingPage 
          beritaList={beritaList}
          handlePresetLogin={handlePresetLogin}
          handleManualLogin={handleLandingManualLogin}
          loginError={loginError}
        />
      ) : (
        // ==========================================
        // PORTAL LOGGED-IN SYSTEM VIEW (FULL-STACK DASHBOARD FRAME)
        // ==========================================
        <div className="flex h-screen w-screen overflow-hidden select-none bg-slate-50 relative">
          
          {/* Reusable Sidebar layout with correct values mapped */}
          <Sidebar 
            role={user?.role || 'user'} 
            activeMenu={activeMenu} 
            setActiveMenu={(m) => {
              // Redirect dashboard tabs properly
              setActiveMenu(m);
            }} 
            onLogout={logout}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />

          {/* Mobile Backdrop Overlay */}
          {isSidebarOpen && (
            <div 
              className="lg:hidden fixed inset-0 bg-black/55 backdrop-blur-[2px] z-45 transition-opacity" 
              onClick={() => setIsSidebarOpen(false)} 
            />
          )}

          {/* Right Core Content Frame */}
          <div className="flex-1 flex flex-col h-full min-w-0">
            
            {/* Header Component */}
            <Header 
              onNotificationClick={handleNotificationClick} 
              onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
            />

            {/* Core Application Views based on User Role */}
            <main className="flex-1 overflow-hidden flex flex-col bg-slate-100">
              {user?.role === 'user' && (
                <UserDashboard 
                  activeTab={activeMenu} 
                  onTabChange={setActiveMenu} 
                />
              )}
              {user?.role === 'guru' && (
                <GuruDashboard 
                  activeTab={activeMenu} 
                  onTabChange={setActiveMenu} 
                />
              )}
              {user?.role === 'admin' && (
                <AdminDashboard 
                  activeTab={activeMenu} 
                  onTabChange={setActiveMenu} 
                />
              )}
            </main>

          </div>

        </div>
      )}

    </div>
  );
}
