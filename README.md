# Panduan Instalasi — SE Akademik STIS Al Wafa

## A. Backend (Google Apps Script)
1. Buka https://script.google.com → Proyek Baru → ganti nama file `Code.gs` jadi `Kode`, tempel seluruh isi `Kode.gs`.
2. Pilih fungsi `setupAppEnvironment` → ▶ Run (HANYA SEKALI) → izinkan akses Drive, Sheets, Docs. Cek log: ada folder, spreadsheet, dan login awal `admin / admin123`.
3. Taruh template Google Docs di folder **Template** (placeholder `{{nama}}`, lihat PRD 4.3). Template harus bisa diakses akun pemilik skrip.
4. Deploy → New deployment → Web app → Execute as: **Me**, Who has access: **Anyone** → Deploy → salin URL `/exec`.
5. Setiap Kode.gs diubah: Deploy → Manage deployments → Edit → New version.

## B. Frontend (GitHub Pages)
1. Buka `js/config.js`, ganti `ISI_URL_EXEC_DI_SINI` dengan URL `/exec`.
2. Folder kerja = folder **se-akademik** hasil ekstrak ZIP (yang berisi `index.html` di baris teratas). Di folder inilah `git init` dijalankan.
3. Ikuti langkah GitHub Pages dari percakapan (Git → repo Public → push → Settings → Pages → branch main, folder root).

## C. Uji
Login admin → Pengaturan → tambah Pejabat → tambah Jenis Surat (tempel tautan template) → Buat Surat → cek PDF di Drive/Hasil PDF/<tahun>.
