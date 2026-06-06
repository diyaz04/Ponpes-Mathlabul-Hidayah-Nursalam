import React from 'react';
import { BookOpen, MapPin, Phone, Mail, Globe, Sparkles } from 'lucide-react';

export interface FooterProps {
  onNavigate?: (tab: 'beranda' | 'profil' | 'program' | 'simulator' | 'berita' | 'faq' | 'psb' | 'masuk') => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 pt-16 pb-8 select-none">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10">
        
        {/* Pesantren Description */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 bg-white p-0.5 rounded-2xl flex items-center justify-center shadow-md">
              {/* Elegant golden outline highlighting */}
              <div className="absolute inset-0 rounded-2xl border border-amber-400/40 scale-[1.04]" />
              <img 
                src="https://lh3.googleusercontent.com/d/1HPt7BpZfaeWheB8rJCHwEcrfCQhkKdop" 
                alt="Logo Mathla'bul Hidayah"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain rounded-xl relative z-10"
              />
            </div>
            <div>
              <h3 className="font-bold text-white text-md tracking-wide">MATHLA'BUL HIDAYAH</h3>
              <p className="text-[10px] text-green-500 font-bold tracking-widest uppercase font-extrabold pb-0.5">Nursalam Islamic Ponpes</p>
            </div>
          </div>
          <p className="text-sm font-medium text-slate-400 leading-relaxed text-left max-w-md">
            Membentuk generasi Qurani, berakhlaqul karimah, mandiri, dan berwawasan iptek modern. Pendidikan salafiyah yang bersinergi dalam lingkungan modern kondusif.
          </p>
        </div>

        {/* Contact info */}
        <div>
          <h4 className="font-bold text-white text-xs uppercase tracking-widest mb-4">Informasi Kontak</h4>
          <ul className="space-y-3.5 text-sm font-medium text-slate-400 text-left">
            <li className="flex items-start gap-2.5">
              <MapPin className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              <span>Jl. Raya KH. Nursalam No. 45, Kecamatan Cadangpinggan, Indramayu, Jawa Barat</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-green-500 shrink-0" />
              <span>0231-88776655</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-green-500 shrink-0" />
              <span>info@mathlabulhidayah.sch.id</span>
            </li>
          </ul>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-bold text-white text-xs uppercase tracking-widest mb-4">Pendidikan</h4>
          <ul className="space-y-2 text-sm font-medium text-slate-400 text-left">
            <li className="hover:text-green-500 transition-colors">
              {onNavigate ? (
                <button onClick={() => onNavigate('profil')} className="cursor-pointer hover:text-green-400 transition-colors text-left bg-transparent border-none p-0">Profil Singkat</button>
              ) : (
                <a href="#profil">Profil Singkat</a>
              )}
            </li>
            <li className="hover:text-green-500 transition-colors">
              {onNavigate ? (
                <button onClick={() => onNavigate('program')} className="cursor-pointer hover:text-green-400 transition-colors text-left bg-transparent border-none p-0">Program Unggulan</button>
              ) : (
                <a href="#program">Program Unggulan</a>
              )}
            </li>
            <li className="hover:text-green-500 transition-colors">
              {onNavigate ? (
                <button onClick={() => onNavigate('berita')} className="cursor-pointer hover:text-green-400 transition-colors text-left bg-transparent border-none p-0">Berita Terbaru</button>
              ) : (
                <a href="#berita">Berita Terbaru</a>
              )}
            </li>
            <li className="hover:text-green-500 transition-colors">
              {onNavigate ? (
                <button onClick={() => onNavigate('psb')} className="cursor-pointer hover:text-green-400 transition-colors text-left bg-transparent border-none p-0">Penerimaan Santri Baru (PSB)</button>
              ) : (
                <a href="#psb">Penerimaan Santri Baru (PSB)</a>
              )}
            </li>
          </ul>
        </div>

      </div>

      <div className="max-w-7xl mx-auto px-6 mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center text-xs font-semibold text-slate-500">
        <p>© 2026 Pondok Pesantren Mathlabul Hidayah Nursalam. All rights reserved.</p>
        <p className="flex items-center gap-1 mt-2 sm:mt-0 text-[10px]">
          Design System & Portal Academic made with <span className="text-green-500">💚</span> and pride.
        </p>
      </div>
    </footer>
  );
}
