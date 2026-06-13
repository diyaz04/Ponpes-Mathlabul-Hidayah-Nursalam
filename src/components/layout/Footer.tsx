import React from 'react';
import { MapPin, Phone, Mail, Instagram, Facebook, Youtube, MessageCircle, Send, Music2, Globe } from 'lucide-react';
import { ProfilPesantren } from '../../types';
import { MATHLABUL_HIDAYAH_LOGO_URL } from '../../lib/branding';

type SocialLink = {
  platform?: string;
  label?: string;
  url?: string;
};

export interface FooterProps {
  profilPP?: ProfilPesantren | null;
  psbEnabled?: boolean;
  onNavigate?: (tab: 'beranda' | 'profil' | 'program' | 'berita' | 'faq' | 'psb' | 'masuk') => void;
}

const fallbackDescription = 'Membentuk generasi Qurani, berakhlaqul karimah, mandiri, dan berwawasan iptek modern. Pendidikan salafiyah yang bersinergi dalam lingkungan modern kondusif.';
const fallbackAddress = 'Cigalontang, Kabupaten Tasikmalaya, Jawa Barat';

const getSocialIcon = (platform?: string) => {
  const key = (platform || '').toLowerCase();
  if (key.includes('instagram')) return Instagram;
  if (key.includes('facebook')) return Facebook;
  if (key.includes('youtube')) return Youtube;
  if (key.includes('whatsapp') || key.includes('wa')) return MessageCircle;
  if (key.includes('telegram')) return Send;
  if (key.includes('tiktok')) return Music2;
  return Globe;
};

export function Footer({ profilPP, psbEnabled = true, onNavigate }: FooterProps) {
  const socialLinks: SocialLink[] = (() => {
    if (!profilPP?.social_links_json) return [];
    try {
      const parsed = JSON.parse(profilPP.social_links_json);
      return Array.isArray(parsed) ? parsed.filter((item) => item?.url) : [];
    } catch (_err) {
      return [];
    }
  })();

  const footerDescription = profilPP?.footer_description || profilPP?.deskripsi || fallbackDescription;
  const footerCopyright = profilPP?.footer_copyright || `Copyright 2026 ${profilPP?.nama || 'Pondok Pesantren Mathlabul Hidayah Nursalam'}. All rights reserved.`;
  const address = profilPP?.alamat || fallbackAddress;
  const phone = profilPP?.telepon || '';
  const email = profilPP?.email || '';

  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 pt-16 pb-8 select-none">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 bg-white p-0.5 rounded-2xl flex items-center justify-center shadow-md">
              <div className="absolute inset-0 rounded-2xl border border-amber-400/40 scale-[1.04]" />
              <img
                src={MATHLABUL_HIDAYAH_LOGO_URL}
                alt="Logo Mathlabul Hidayah"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain rounded-xl relative z-10"
              />
            </div>
            <div>
              <h3 className="font-bold text-white text-md tracking-wide">MATHLABUL HIDAYAH</h3>
              <p className="text-[10px] text-green-500 font-bold tracking-widest uppercase font-extrabold pb-0.5">Nursalam Islamic Ponpes</p>
            </div>
          </div>
          <p className="text-sm font-medium text-slate-400 leading-relaxed text-left max-w-md">
            {footerDescription}
          </p>

          {socialLinks.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {socialLinks.map((social, index) => {
                const Icon = getSocialIcon(social.platform || social.label);
                return (
                  <a
                    key={`${social.platform || social.label || 'social'}-${index}`}
                    href={social.url}
                    target="_blank"
                    rel="noreferrer"
                    title={social.label || social.platform || 'Media sosial'}
                    className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-green-600 hover:border-green-500 hover:text-white transition-all flex items-center justify-center"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <h4 className="font-bold text-white text-xs uppercase tracking-widest mb-4">Informasi Kontak</h4>
          <ul className="space-y-3.5 text-sm font-medium text-slate-400 text-left">
            <li className="flex items-start gap-2.5">
              <MapPin className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              <span>{address}</span>
            </li>
            {phone && (
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-green-500 shrink-0" />
                <span>{phone}</span>
              </li>
            )}
            {email && (
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-green-500 shrink-0" />
                <span>{email}</span>
              </li>
            )}
          </ul>
        </div>

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
            {psbEnabled && (
              <li className="hover:text-green-500 transition-colors">
                {onNavigate ? (
                  <button onClick={() => onNavigate('psb')} className="cursor-pointer hover:text-green-400 transition-colors text-left bg-transparent border-none p-0">Penerimaan Santri Baru (PSB)</button>
                ) : (
                  <a href="#psb">Penerimaan Santri Baru (PSB)</a>
                )}
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center text-xs font-semibold text-slate-500 gap-2">
        <p>{footerCopyright}</p>
        <p className="flex items-center gap-1 sm:mt-0 text-[10px]">
          Design System & Portal Academic made with care and pride.
        </p>
      </div>
    </footer>
  );
}
