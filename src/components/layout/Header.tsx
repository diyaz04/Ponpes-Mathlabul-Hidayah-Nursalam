import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { NotifikasiDropdown } from './NotifikasiDropdown';
import { UserRole } from '../../types';
import { Sparkles, Key, Check, Menu } from 'lucide-react';

interface HeaderProps {
  onNotificationClick?: (tipe: string, refId?: string) => void;
  onMenuToggle?: () => void;
}

export function Header({ onNotificationClick, onMenuToggle }: HeaderProps) {
  const { user, switchRole } = useAuth();

  const getRoleLabel = (role?: UserRole) => {
    switch (role) {
      case 'admin':
        return 'Sistem Admin';
      case 'guru':
        return 'Asatiddz / Guru Penguji';
      case 'user':
      default:
        return 'Wali Santri';
    }
  };

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-150 flex items-center justify-between px-4 sm:px-8 z-15 shrink-0 select-none">
      
      {/* Menu burger & Welcome Banner */}
      <div className="flex items-center gap-2 sm:gap-3">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-1.5 sm:p-2 text-gray-600 hover:text-green-700 hover:bg-green-50 rounded-xl transition cursor-pointer"
            aria-label="Buka menu navigasi"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        
        <div className="flex flex-col">
          <span className="text-[9px] sm:text-[10px] text-green-700 font-bold uppercase tracking-widest leading-none mb-1 truncate max-w-[180px] sm:max-w-none">
            Ponpes Mathlabul Hidayah
          </span>
          <h2 className="text-sm sm:text-md font-bold text-gray-900 leading-tight truncate max-w-[150px] sm:max-w-none">
            Assalamu'alaikum, <span className="text-green-700">{user?.full_name?.split(' ')[0] || 'Wali'}</span>
          </h2>
        </div>
      </div>

      {/* Control Actions / Live Role Selector */}
      <div className="flex items-center gap-2 sm:gap-4 md:flex-initial">
        {/* Status indicator */}
        <div className="hidden sm:flex px-3.5 py-1.5 bg-green-50 text-green-700 rounded-full border border-green-150 text-[10px] font-extrabold tracking-wider uppercase leading-none">
          {getRoleLabel(user?.role)}
        </div>

        {/* Real-time Notifications Bell */}
        <NotifikasiDropdown onNotificationAction={onNotificationClick} />

        {/* Mini Avatar representation */}
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 border-white shadow-sm overflow-hidden bg-gradient-to-br from-green-300 to-emerald-500 font-bold flex items-center justify-center text-white text-xs sm:text-sm select-none shrink-0">
          {user?.avatar_url ? (
            <img 
              src={user.avatar_url} 
              alt={user.full_name} 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover" 
            />
          ) : (
            user?.full_name?.charAt(0) || 'U'
          )}
        </div>
      </div>
    </header>
  );
}
