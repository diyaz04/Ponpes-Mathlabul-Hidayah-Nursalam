import React from 'react';

interface PelanggaranBadgeProps {
  poin: number;
}

export function PelanggaranBadge({ poin }: PelanggaranBadgeProps) {
  const getBadgeStyle = (p: number) => {
    if (p <= 20) {
      return {
        bg: 'bg-green-50 text-green-700 border-green-200',
        label: 'Aman / Disiplin Baik',
        dot: 'bg-green-500'
      };
    } else if (p <= 50) {
      return {
        bg: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        label: 'Perlu Perhatian / Konseling',
        dot: 'bg-yellow-500'
      };
    } else {
      return {
        bg: 'bg-red-50 text-red-700 border-red-200 animate-pulse',
        label: 'Kritis / Indisipliner Berat',
        dot: 'bg-red-500'
      };
    }
  };

  const style = getBadgeStyle(poin);

  return (
    <div className={`px-3.5 py-1.5 rounded-xl border ${style.bg} flex items-center gap-2 text-xs font-bold leading-none`}>
      <span className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
      <span>{poin} Poin • {style.label}</span>
    </div>
  );
}
