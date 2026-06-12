import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { MATHLABUL_HIDAYAH_LOGO_URL } from '../../lib/branding';

export type RaportPdfRow = {
  mapel: string;
  harian: number;
  uas: number;
  akhir: number;
  predikat: string;
};

export type RaportPdfPayload = {
  santriNama: string;
  kelasNama: string;
  semester: string;
  tahunAjaran: string;
  catatan?: string;
  rows: RaportPdfRow[];
};

const loadImageAsDataUrl = (src: string): Promise<string | null> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch (_err) {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = `${src}${src.includes('?') ? '&' : '?'}v=${Date.now()}`;
  });
};

export async function downloadRaportPDF(payload: RaportPdfPayload) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const logo = await loadImageAsDataUrl(MATHLABUL_HIDAYAH_LOGO_URL);
  const avg = payload.rows.length
    ? payload.rows.reduce((sum, row) => sum + row.akhir, 0) / payload.rows.length
    : 0;

  doc.setFillColor(6, 95, 70);
  doc.rect(0, 0, 210, 24, 'F');
  doc.setFillColor(245, 158, 11);
  doc.rect(0, 24, 210, 2, 'F');

  if (logo) {
    doc.addImage(logo, 'PNG', 14, 32, 25, 25);
  }

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text('Pondok Pesantren Mathlabul Hidayah Nursalam', 45, 38);
  doc.setFontSize(10);
  doc.setTextColor(4, 120, 87);
  doc.text('LAPORAN HASIL BELAJAR SANTRI', 45, 45);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Cigalontang-Kabupaten Tasikmalaya-Jawa Barat', 45, 52);

  doc.setDrawColor(203, 213, 225);
  doc.line(14, 64, 196, 64);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('Identitas Raport', 14, 75);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Nama Santri: ${payload.santriNama}`, 14, 84);
  doc.text(`Kelas: ${payload.kelasNama}`, 14, 91);
  doc.text(`Semester: ${payload.semester}`, 118, 84);
  doc.text(`Tahun Ajaran: ${payload.tahunAjaran}`, 118, 91);

  autoTable(doc, {
    startY: 102,
    head: [['No', 'Mata Pelajaran', 'Nilai Harian', 'UAS', 'Nilai Akhir', 'Predikat']],
    body: payload.rows.map((row, idx) => [
      idx + 1,
      row.mapel,
      row.harian.toFixed(2),
      row.uas.toFixed(2),
      row.akhir.toFixed(2),
      row.predikat
    ]),
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [6, 95, 70], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      2: { halign: 'center' },
      3: { halign: 'center' },
      4: { halign: 'center', fontStyle: 'bold' },
      5: { halign: 'center', fontStyle: 'bold' }
    },
    alternateRowStyles: { fillColor: [248, 250, 252] }
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 120;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`Rata-rata: ${avg.toFixed(2)}`, 14, finalY + 12);
  doc.text('Catatan Wali Kelas', 14, finalY + 24);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(doc.splitTextToSize(payload.catatan || '-', 120), 14, finalY + 31);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text('Wali Kelas,', 145, finalY + 34);
  doc.line(140, finalY + 62, 190, finalY + 62);
  doc.setFont('helvetica', 'bold');
  doc.text('____________________', 143, finalY + 61);

  doc.save(`Raport-${payload.santriNama}-${payload.semester}-${payload.tahunAjaran}.pdf`);
}
