import React from 'react';
import { BookOpen, Award, CheckCircle, Sparkles } from 'lucide-react';

interface HapalanProgressCardProps {
  totalJuz: number;
  totalHalaman: number;
  lastSurah?: string;
  totalSetoran?: number; // count of records
  nilaiRataRata?: string; // average grade
}

export function HapalanProgressCard({ 
  totalJuz, 
  totalHalaman, 
  lastSurah = 'N/A', 
  totalSetoran = 12, 
  nilaiRataRata = 'Mumtaz' 
}: HapalanProgressCardProps) {
  const percentage = Math.min(Math.max((totalJuz / 30) * 100, 0), 100);

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-150 flex flex-col justify-between select-none hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl">
          <BookOpen className="w-6 h-6" />
        </div>
        <span className="text-[10px] uppercase font-bold text-green-700 bg-green-50 border border-green-150 px-2.5 py-1 rounded-lg flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-green-500" /> Tahfidz Track
        </span>
      </div>

      <div>
        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">Pencapaian Setoran</p>
        <h4 className="text-2xl font-black text-gray-900 leading-none">
          {totalJuz} <span className="text-lg font-medium text-gray-400">/ 30 Juz</span>
        </h4>
        <p className="text-xs font-semibold text-gray-500 mt-1">
          Total: <span className="text-gray-800 font-bold">{totalHalaman} Halaman</span> • Surah Terakhir: <span className="text-blue-600 font-bold">{lastSurah}</span>
        </p>
      </div>

      {/* Visual progress bar bar */}
      <div className="mt-4">
        <div className="flex justify-between text-[10px] font-bold text-gray-400 mb-1">
          <span>Progres Qur'an</span>
          <span>{percentage.toFixed(1)}%</span>
        </div>
        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
          <div 
            className="h-full bg-blue-500 rounded-full transition-all duration-700 bg-gradient-to-r from-blue-500 to-indigo-600" 
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Stats footer pill */}
      <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-100">
        <div className="text-center px-2 py-1.5 bg-slate-50 rounded-xl border border-gray-100">
          <span className="text-[9px] uppercase font-bold text-gray-400 block leading-tight">Total Setoran</span>
          <span className="text-xs font-bold text-gray-800">{totalSetoran} Kali</span>
        </div>
        <div className="text-center px-2 py-1.5 bg-slate-50 rounded-xl border border-gray-100">
          <span className="text-[9px] uppercase font-bold text-gray-400 block leading-tight">Grade Rata-rata</span>
          <span className="text-xs font-bold text-green-700 uppercase">{nilaiRataRata}</span>
        </div>
      </div>
    </div>
  );
}
