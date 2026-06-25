# TARA — Total Assistance for Resources & Administration

**TARA** adalah sistem manajemen HR (Human Resources) cerdas yang dirancang untuk **PT. Maju Bersama**. Sistem ini mengotomatisasi operasional HR sehari-hari menggunakan 7 agen otonom, sehingga tim HR dapat fokus pada tugas strategis.

**Version:** 2.0.0 ([Changelog](./CHANGELOG.md))  
**Status:** Active Development

---

## Apa yang TARA Lakukan?

| Fitur | Penjelasan Singkat |
|-------|-------------------|
| 🕐 **Absensi Otomatis** | Karyawan clock-in/out via ponsel (biometrik + GPS) atau fingerprint device |
| 📋 **Manajemen Cuti** | Pengajuan cuti online, persetujuan otomatis, saldo real-time |
| 💰 **Penggajian** | Hitung gaji, potongan, bonus, dan cetak slip gaji |
| 💳 **Pinjaman / Kasbon** | Karyawan ajukan pinjaman, cicilan otomatis potong gaji |
| 📅 **Jadwal Kerja** | Atur shift, jadwal per karyawan, hari libur |
| 🔔 **Notifikasi Multi-Kanal** | Kirim alert via aplikasi, WhatsApp, Telegram, atau Email |
| 🤖 **7 Agen Otonom** | Robot HR yang bekerja 24/7 tanpa perlu dioperasikan manual |
| 📊 **Laporan & Analitik** | Dashboard kehadiran, keterlambatan, dan produktivitas |

---

## Siapa yang Menggunakan TARA?

| Pengguna | Akses |
|----------|-------|
| **HR Admin** | Akses penuh via Web — kelola semua karyawan, pengaturan, laporan |
| **Supervisor** | Web — setujui cuti tim, lihat laporan tim |
| **Karyawan** | Mobile (PWA) — clock-in/out, ajukan cuti, lihat slip gaji, notifikasi |

---

## Tampilan Aplikasi

### Web Interface (untuk HR & Supervisor)
- Dashboard dengan statistik real-time
- Direktori karyawan dengan pencarian
- Manajemen cuti (setujui/tolak)
- Penggajian (periode, komponen, slip)
- Pengaturan lengkap (agen, organisasi, notifikasi, Hermes AI)

### Mobile Interface (untuk Karyawan)
- Clock-in/out dengan satu ketukan
- Ajukan cuti dari ponsel
- Lihat saldo cuti dan riwayat
- Notifikasi real-time
- Profil dan pengaturan bahasa

---

## Cara Menjalankan (Quick Start)

### Prasyarat
- Node.js 18+
- PostgreSQL 14+ (atau gunakan Docker)

### Langkah

```bash
# 1. Clone repository
git clone <repository-url>
cd project-tara

# 2. Install dependencies
npm install
cd backend && npm install && cd ..

# 3. Setup database (pilih salah satu)
# Opsi A: Docker (rekomendasi)
docker compose -f docker-compose.dev.yml up -d

# Opsi B: PostgreSQL lokal
# Buat database "tara" dan atur backend/.env

# 4. Jalankan migrasi
cd backend && npx prisma migrate dev && cd ..

# 5. Jalankan aplikasi
npm run dev
```

Aplikasi tersedia di:
- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:3001

### Demo Mode (Tanpa Database)
TARA dapat berjalan dalam demo mode tanpa PostgreSQL:
```
Email: sari@majubersama.com
Password: demo123
```

---

## Struktur Proyek (Ringkas)

```
project-tara/
├── src/                    # Frontend (React + TypeScript)
│   ├── pages/web/          # Halaman Web Interface
│   ├── pages/mobile/       # Halaman Mobile Interface
│   ├── components/         # Komponen UI (shadcn/ui, AppFooter)
│   ├── contexts/           # Auth & Theme context
│   ├── layouts/            # WebLayout, MobileLayout
│   └── lib/                # Utilities, API helper, version config
│       └── version.ts      # App version (single source of truth)
├── backend/                # Backend (NestJS + TypeScript)
│   ├── src/core/hr/        # Modul HR (agen, services, controllers)
│   ├── src/core/auth/      # Autentikasi (JWT + bcrypt)
│   ├── src/core/demo/      # Demo mode (data mock)
│   └── prisma/             # Database schema & migrations
├── docs/                   # Dokumentasi teknis
├── CHANGELOG.md            # Riwayat versi (Keep a Changelog)
├── docker-compose.yml      # Production deployment
└── docker-compose.dev.yml  # Development (DB only)
```

---

## Dokumentasi Teknis

Untuk developer, dokumentasi lengkap tersedia di folder [`docs/`](./docs/):

| Dokumen | Isi |
|---------|-----|
| [Arsitektur Sistem](./docs/ARCHITECTURE.md) | Diagram arsitektur, layer, dan design decisions |
| [Database Schema](./docs/DATABASE.md) | Semua tabel, relasi, dan indexing strategy |
| [API Reference](./docs/API.md) | Endpoint lengkap, request/response, autentikasi |
| [Agen Otonom](./docs/AGENTS.md) | 7 agen, cara kerja, event, dan konfigurasi |
| [Deployment](./docs/DEPLOYMENT.md) | Docker, environment variables, production setup |
| [Frontend](./docs/FRONTEND.md) | Routing, design system, tema, dan komponen |
| [Security](./docs/SECURITY.md) | Autentikasi, otorisasi, enkripsi, OWASP |
| [Changelog](./CHANGELOG.md) | Riwayat versi dan catatan rilis |

---

## 🏷️ Version Control

TARA menggunakan [Semantic Versioning](https://semver.org/) (MAJOR.MINOR.PATCH).

| Sumber | Fungsi |
|--------|--------|
| `src/lib/version.ts` | Single source of truth untuk versi aplikasi |
| `package.json` | Versi untuk npm/build tooling |
| `CHANGELOG.md` | Riwayat rilis yang mudah dibaca |

Footer aplikasi menampilkan versi, tahun copyright, dan nama perusahaan di semua halaman (desktop & mobile).

### Cara Rilis Versi Baru

```bash
# 1. Update src/lib/version.ts (APP_VERSION + APP_BUILD_DATE)
# 2. Update version di package.json
# 3. Tambahkan entry ke CHANGELOG.md
# 4. Commit dan tag
git commit -am "release: v2.1.0"
git tag v2.1.0
git push --follow-tags
```

---

## Teknologi

| Layer | Stack |
|-------|-------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui |
| Backend | NestJS, TypeScript, Prisma ORM |
| Database | PostgreSQL 14+ dengan PostGIS |
| Real-time | WebSocket (Socket.IO) |
| Auth | JWT + bcrypt |
| Deployment | Docker, Nginx |

---

## Lisensi

Proprietary — PT. Maju Bersama. Hak cipta dilindungi.
