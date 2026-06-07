import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { useNotifikasi } from './hooks/useNotifikasi';
import { db } from './lib/supabase';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { UserDashboard } from './components/user/UserDashboard';
import { GuruDashboard } from './components/guru/GuruDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { LandingPage } from './components/landing/LandingPage';

export default function App() {
  const { user, login, logout } = useAuth();
  useNotifikasi();

  const [beritaList, setBeritaList] = useState<any[]>([]);

  useEffect(() => {
    db.berita()
      .then(setBeritaList)
      .catch((error) => console.error('[Supabase Berita Load Failure]', error));
  }, []);

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

  const handlePresetLogin = async (role: 'user' | 'guru' | 'admin') => {
    setLoginError(null);
    setLoginError(`Login cepat ${role} dinonaktifkan. Masuk dengan akun Supabase resmi.`);
  };

  const handleLandingManualLogin = async (e: React.FormEvent, email: string, pass: string) => {
    e.preventDefault();
    setLoginError(null);
    if (!email || !pass) {
      setLoginError('Harap mengisi kolom email & password!');
      return;
    }

    try {
      await login('user', email, pass);
    } catch (err: any) {
      setLoginError(err.message || 'Login Supabase gagal.');
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
