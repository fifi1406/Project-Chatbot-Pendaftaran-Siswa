// bot/ppdb-data.js
// Data PPDB sebagai fallback jika scraping gagal
// Data ini bisa di-update manual atau via API

export const PPDB_DATA = {
  lastUpdate: "2026-01-05",
  
  jadwal: {
    tahunAjaran: "2026/2027",
    mulai: "15/12/2025",
    selesai: "30/6/2026",
    status: "Aktif"
  },

  jalurPendaftaran: {
    reguler: [
      {
        gelombang: 1,
        biaya: 500000,
        batasWaktu: "31 Januari 2026",
        kuota: "75 pendaftar pertama",
        keterangan: "Gelombang 1 (Rp. 500.000) s.d. 31 Januari 2026 atau s.d 75 pendaftar pertama terpenuhi"
      },
      {
        gelombang: 2,
        biaya: 600000,
        batasWaktu: "30 April 2026",
        keterangan: "Gelombang 2 (Rp. 600.000) s.d 30 April 2026"
      },
      {
        gelombang: 3,
        biaya: 650000,
        batasWaktu: "30 Juni 2026",
        keterangan: "Gelombang 3 (Rp. 650.000) s.d 30 Juni 2026"
      }
    ],
    prestasi: [
      {
        peringkat: 1,
        benefit: "Gratis SPP 3 bulan",
        syarat: "Memiliki peringkat 1 di rapor"
      },
      {
        peringkat: 2,
        benefit: "Gratis SPP 2 bulan",
        syarat: "Memiliki peringkat 2 di rapor"
      },
      {
        peringkat: 3,
        benefit: "Gratis SPP 1 bulan",
        syarat: "Memiliki peringkat 3 di rapor"
      }
    ],
    khusus: [
      {
        kategori: "Yatim",
        benefit: "Potongan biaya",
        syarat: "Siswa/i Yatim"
      }
    ]
  },

  tahapanSeleksi: [
    "Pendaftaran Online/Offline",
    "Verifikasi Berkas",
    "Tes Potensi Akademik",
    "Pengukuran Tinggi dan Berat Badan"
  ],

  biayaPendidikan: {
    sppBulanan: 100000,
    keterangan: "SPP Bulanan: Rp 100.000"
  },

  keringananBiaya: "Tersedia beasiswa bagi siswa berprestasi dan kurang mampu.",

  persyaratan: [
    "Lulus SMP/MTs atau sederajat",
    "Fotokopi Ijazah yang telah dilegalisir (3 lembar)",
    "Fotokopi Akta Kelahiran (2 lembar)",
    "Fotokopi Kartu Keluarga (2 lembar)",
    "Fotokopi KTP Orang Tua/Wali (2 lembar)",
    "Fotokopi KIP (jika ada) (2 lembar)",
    "Pas foto berwarna latar merah ukuran 3x4 (6 lembar)"
  ],

  kontak: {
    telepon: "(0251) 8422525",
    whatsapp: "0812-1062-2374",
    email: "smk_globin@yahoo.co.id",
    alamat: "Jl. Cibeureum Tengah RT. 06/01 Desa Sinarsari Kec. Dramaga Kab. Bogor"
  }
};

// Format data PPDB menjadi text untuk knowledge base
export function formatPPDBToText() {
  const data = PPDB_DATA;
  
  let text = `
[SUMBER: DATA PPDB SMK GLOBIN - LAST UPDATE: ${data.lastUpdate}]

PENERIMAAN PESERTA DIDIK BARU
Informasi lengkap pendaftaran siswa baru SMK GLOBIN

Pendaftaran PPDB Tahun Ajaran ${data.jadwal.tahunAjaran}
${data.jadwal.mulai} - ${data.jadwal.selesai}
Status: ${data.jadwal.status}

SMK GLOBIN Bogor membuka pendaftaran peserta didik baru untuk tahun ajaran ${data.jadwal.tahunAjaran}.

JALUR PENDAFTARAN:

1. Jalur Reguler
`;

  data.jalurPendaftaran.reguler.forEach(g => {
    text += `   - ${g.keterangan}\n`;
  });

  text += `\n2. Jalur Prestasi\n`;
  data.jalurPendaftaran.prestasi.forEach(p => {
    text += `   - ${p.benefit} apabila ${p.syarat.toLowerCase()}\n`;
  });

  data.jalurPendaftaran.khusus.forEach(k => {
    text += `   - ${k.benefit} bagi ${k.syarat.toLowerCase()}\n`;
  });

  text += `\nTAHAPAN SELEKSI:\n`;
  data.tahapanSeleksi.forEach((t, i) => {
    text += `${i + 1}. ${t}\n`;
  });

  text += `\nBIAYA PENDIDIKAN:\n`;
  text += `- ${data.biayaPendidikan.keterangan}\n`;

  text += `\nKERINGANAN BIAYA:\n`;
  text += `${data.keringananBiaya}\n`;

  text += `\nInfo lebih lanjut hubungi:\n`;
  text += `Telp: ${data.kontak.telepon}\n`;
  text += `WhatsApp: ${data.kontak.whatsapp}\n`;
  text += `Email: ${data.kontak.email}\n`;

  text += `\nPersyaratan Umum:\n`;
  data.persyaratan.forEach(p => {
    text += `- ${p}\n`;
  });

  text += `\nAlamat: ${data.kontak.alamat}\n`;

  return text;
}
