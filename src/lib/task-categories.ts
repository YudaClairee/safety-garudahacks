export interface TaskCategoryOption {
  value: string
  label: string
  description: string
}

export const taskCategories: TaskCategoryOption[] = [
  {
    value: 'Membersihkan lingkungan',
    label: 'Membersihkan Lingkungan (Mitigasi Banjir & Drainase)',
    description:
      'Pembersihan got, selokan, atau fasilitas umum untuk mencegah luapan air/bencana.',
  },
  {
    value: 'Membantu tetangga lansia',
    label: 'Membantu Lansia & Kelompok Rentan',
    description:
      'Bantuan fisik, pengantaran kebutuhan pokok, atau pendampingan warga lansia.',
  },
  {
    value: 'Menanam pohon',
    label: 'Menanam Pohon (Pencegahan Erors/Longsor)',
    description:
      'Penghijauan di area resapan air atau lahan rawan erosi.',
  },
  {
    value: 'Mengelola sampah',
    label: 'Pengelolaan Sampah & Sanitasi',
    description:
      'Pemilahan limbah dan pembersihan TPS liar untuk mencegah bahaya kesehatan.',
  },
  {
    value: 'Mengajar anak-anak',
    label: 'Edukasi Keselamatan & Literasi Anak',
    description:
      'Pendampingan belajar serta edukasi mitigasi bencana sejak dini.',
  },
  {
    value: 'Donasi makanan',
    label: 'Distribusi Pangan Darurat',
    description:
      'Penyaluran bahan pokok/makanan bagi keluarga berpenghasilan rendah yang membutuhkan.',
  },
  {
    value: 'Kegiatan sosial lainnya',
    label: 'Aksi Keselamatan Komunitas Lainnya',
    description:
      'Inisiatif aksi warga untuk keselamatan lingkungan sekitar.',
  },
]

export function getTaskCategory(value: string) {
  return taskCategories.find((item) => item.value === value)
}