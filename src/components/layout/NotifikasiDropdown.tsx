import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, BookOpen, ShieldAlert, CreditCard, History, Megaphone } from 'lucide-react';
import { useNotifikasi } from '../../hooks/useNotifikasi';
import { Notifikasi } from '../../types';

interface NotifikasiDropdownProps {
  onNotificationAction?: (tipe: Notifikasi['tipe'], refId?: string) => void;
}

export function NotifikasiDropdown({ onNotificationAction }: NotifikasiDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAllAsRead, markAsRead } = useNotifikasi();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotifIcon = (tipe: Notifikasi['tipe']) => {
    switch (tipe) {
      case 'pelanggaran':
        return <div className="p-2 bg-red-50 text-red-600 rounded-xl"><ShieldAlert className="w-4 h-4" /></div>;
      case 'hapalan':
        return <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><BookOpen className="w-4 h-4" /></div>;
      case 'tagihan':
        return <div className="p-2 bg-orange-50 text-orange-600 rounded-xl"><CreditCard className="w-4 h-4" /></div>;
      case 'pembayaran':
        return <div className="p-2 bg-green-50 text-green-600 rounded-xl"><History className="w-4 h-4" /></div>;
      case 'pengumuman':
      default:
        return <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Megaphone className="w-4 h-4" /></div>;
    }
  };

  const handleItemClick = (item: Notifikasi) => {
    markAsRead(item.id);
    setIsOpen(false);
    if (onNotificationAction) {
      onNotificationAction(item.tipe, item.ref_id);
    }
  };

  return (
    <div className="relative select-none" ref={dropdownRef}>
      {/* Icon Trigger */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-10 h-10 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-full flex items-center justify-center cursor-pointer transition-all focus:outline-none"
      >
        <Bell className="w-5 h-5 text-gray-600 hover:scale-105 transition-transform" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1.5 bg-red-500 rounded-full border-2 border-white text-[10px] font-black text-white flex items-center justify-center animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Box */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-84 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-150 z-50 overflow-hidden transform origin-top-right transition-all">
          {/* Header */}
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-150 flex items-center justify-between">
            <h5 className="text-xs font-bold text-gray-800">Notifikasi Pesantren</h5>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-[10px] text-green-700 bg-green-50 hover:bg-green-100 rounded-lg px-2 py-1 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Check className="w-3 h-3" /> Tandai Semua Dibaca
              </button>
            )}
          </div>

          {/* List items */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 scrollbar-thin">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30 animate-pulse" />
                <p className="text-xs">Belum ada notifikasi baru</p>
              </div>
            ) : (
              notifications.slice(0, 10).map((item) => (
                <div 
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`flex gap-3 px-4 py-3.5 hover:bg-slate-50 cursor-pointer transition-all ${!item.is_read ? 'bg-green-50/40 border-l-3 border-green-600' : ''}`}
                >
                  {getNotifIcon(item.tipe)}
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold leading-snug truncate ${!item.is_read ? 'text-gray-900 font-bold' : 'text-gray-700'}`}>
                      {item.judul}
                    </p>
                    <p className="text-[11px] text-gray-500 leading-normal mt-0.5 whitespace-pre-line select-text">
                      {item.pesan}
                    </p>
                    <span className="text-[9px] text-gray-450 block mt-1.5">
                      {new Date(item.created_at || '').toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
