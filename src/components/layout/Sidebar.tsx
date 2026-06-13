import React from 'react';
import { 
  BookOpen, LayoutDashboard, UserCheck, ShieldAlert, FileText, 
  Settings, CreditCard, History, User, Users, Megaphone, 
  Newspaper, LogOut, GraduationCap, DollarSign, Scroll, Languages, X, UserPlus
} from 'lucide-react';
import { UserRole } from '../../types';

interface SidebarProps {
  role: UserRole;
  activeMenu: string;
  setActiveMenu: (menu: string) => void;
  onLogout: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ role, activeMenu, setActiveMenu, onLogout, isOpen = false, onClose }: SidebarProps) {
  // Define menus for each role
  const getMenuItems = () => {
    switch (role) {
      case 'admin':
        return [
          { id: 'overview', name: 'Ringkasan', icon: LayoutDashboard },
          { id: 'santri', name: 'Manajemen Santri', icon: Users },
          { id: 'alumni', name: 'Alumni & Arsip', icon: GraduationCap },
          { id: 'pelanggaran', name: 'Data Pelanggaran', icon: ShieldAlert },
          { id: 'hapalan', name: 'Data Hapalan', icon: BookOpen },
          { id: 'raport', name: 'Kelola Raport', icon: FileText },
          { id: 'psb_admin', name: 'Penerimaan Santri Baru', icon: UserPlus },
          { id: 'pembayaran_config', name: 'Atur & Monitoring Tagihan', icon: Settings },
          { id: 'rekap_pembayaran', name: 'Rekap Bayar', icon: DollarSign },
          { id: 'cms', name: 'Manajemen Konten', icon: Newspaper },
          { id: 'akun', name: 'Kelola Akun', icon: UserCheck },
          { id: 'pengumuman', name: 'Kirim Pengumuman', icon: Megaphone },
        ];
      case 'guru':
        return [
          { id: 'overview', name: 'Ringkasan Guru', icon: LayoutDashboard },
          { id: 'santri_binaan', name: 'Santri Binaan', icon: Users },
          { id: 'input_pelanggaran', name: 'Input Pelanggaran', icon: ShieldAlert },
          { id: 'input_hapalan', name: 'Input Hafalan', icon: BookOpen },
          { id: 'raport', name: 'Input Raport', icon: FileText },
          { id: 'rekap_santri', name: 'Monitoring Santri', icon: Scroll },
          { id: 'profil', name: 'Profil Akun', icon: User },
        ];
      case 'user':
      default:
        return [
          { id: 'overview', name: 'Ringkasan', icon: LayoutDashboard },
          { id: 'profil_santri', name: 'Profil Santri', icon: GraduationCap },
          { id: 'pelanggaran', name: 'Laporan Pelanggaran', icon: ShieldAlert },
          { id: 'hapalan', name: 'Progres Hafalan', icon: BookOpen },
          { id: 'raport', name: 'Raport Santri', icon: FileText },
          { id: 'tagihan', name: 'Tagihan SPP', icon: CreditCard },
          { id: 'riwayat', name: 'Riwayat Bayar', icon: History },
          { id: 'profil_akun', name: 'Profil Wali', icon: User },
        ];
    }
  };

  const menuItems = getMenuItems();

  return (
    <aside className={`w-68 bg-gradient-to-b from-[#16a34a] to-[#065f46] text-white flex flex-col p-5 h-full select-none shrink-0 shadow-2xl fixed lg:relative inset-y-0 left-0 z-50 transform ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    } lg:translate-x-0 transition-transform duration-300 ease-in-out`}>
      
      {/* Brand Header & Mobile Close Button */}
      <div className="flex items-center justify-between gap-2 mb-8 px-2">
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 bg-white p-0.5 rounded-2xl flex items-center justify-center shadow-md transition-transform hover:rotate-6">
            {/* Elegant golden outline matching the pesantren branding */}
            <div className="absolute inset-0 rounded-2xl border-2 border-amber-400/40 scale-[1.04]" />
            <img 
              src="https://lh3.googleusercontent.com/d/1HPt7BpZfaeWheB8rJCHwEcrfCQhkKdop" 
              alt="Logo Mathla'bul Hidayah"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain rounded-xl relative z-10"
            />
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight uppercase tracking-wider">
              MATHLABUL<br/>
              <span className="text-green-200">HIDAYAH</span>
            </h1>
            <p className="text-[10px] text-green-100 font-medium tracking-widest uppercase">Nursalam Online</p>
          </div>
        </div>

        {/* Mobile Dismiss X Button */}
        {onClose && (
          <button 
            type="button" 
            onClick={onClose} 
            className="lg:hidden p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition"
            aria-label="Tutup menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Role Tag */}
      <div className="mb-6 px-3 py-2 bg-black/15 rounded-xl border border-white/10 text-center">
        <span className="text-[10px] uppercase font-bold text-green-200 tracking-wider">Akses Masuk:</span>
        <h4 className="text-xs font-semibold uppercase text-white tracking-widest mt-0.5">
          {role === 'admin' ? 'Administrator' : role === 'guru' ? 'Asatiddz / Guru' : 'Wali Santri'}
        </h4>
      </div>

      {/* Navigation list */}
      <nav className="flex-1 space-y-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/20">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeMenu === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveMenu(item.id);
                if (onClose) onClose();
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-xs text-left transition-all duration-200 ${
                isActive 
                  ? 'bg-white text-green-800 shadow-sm font-semibold scale-[1.02]' 
                  : 'text-white/85 hover:bg-white/10 hover:text-white'
              }`}
            >
              <IconComponent className={`w-4.5 h-4.5 ${isActive ? 'text-green-600' : 'text-white/70'}`} />
              <span>{item.name}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer Sign-out */}
      <div className="pt-4 border-t border-white/10 mt-4">
        <button
          onClick={() => {
            onLogout();
            if (onClose) onClose();
          }}
          className="w-full flex items-center gap-3 px-4 py-3 text-white/80 hover:bg-red-500/20 hover:text-red-100 rounded-xl transition-all font-semibold text-xs text-left"
        >
          <LogOut className="w-4.5 h-4.5 text-white/60" />
          <span>Keluar Sistem</span>
        </button>
      </div>
    </aside>
  );
}
