# Backend akun siswa — JSON di repositori GitHub

Backend ini menyimpan data akun dan progres siswa pada file **`data/accounts.json` di repositori `Imamsaa/css-playground`**, tanpa menggunakan Google Drive.

Repositori website bersifat publik. Oleh karena itu, isi file JSON **dienkripsi di sisi server** menggunakan AES-256-CBC + HMAC-SHA256. Nama, kode akun, dan progres tidak disimpan sebagai teks terbaca. Kunci enkripsi dan token GitHub disimpan di Script Properties Google Apps Script, bukan di repositori atau browser siswa.

File database berada pada branch **`student-data`** di repositori yang sama. Branch terpisah ini mencegah setiap autosave memicu deployment ulang GitHub Pages. File awal: [`data/accounts.json`](https://github.com/Imamsaa/css-playground/blob/student-data/data/accounts.json).

## Setup satu kali oleh admin

### 1. Buat token GitHub untuk menulis database

1. Buka GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens.
2. Buat token baru, pilih hanya repository `Imamsaa/css-playground`.
3. Berikan izin **Contents: Read and write**. Izin lain tidak diperlukan untuk alur database ini.
4. Salin token dan simpan secara rahasia. Jangan menulis token ke file HTML, `Code.gs`, atau repositori.

### 2. Buat proyek Google Apps Script sebagai API

Google Drive tidak digunakan sebagai database. Apps Script hanya menjadi server kecil yang mengakses GitHub API secara aman, karena halaman GitHub Pages tidak dapat menulis file repository secara langsung tanpa kredensial rahasia.

1. Buka [Google Apps Script](https://script.google.com/home) dan buat proyek baru.
2. Tambahkan dua file script: `Code.gs` dan `CryptoJS.gs`.
3. Salin isi [`backend/Code.gs`](https://github.com/Imamsaa/css-playground/blob/main/backend/Code.gs) ke `Code.gs).
4. Salin isi [`backend/CryptoJS.gs`](https://github.com/Imamsaa/css-playground/blob/main/backend/CryptoJS.gs) ke `CryptoJS.gs). Ini adalah library CryptoJS versi 4.2.0 berlisensi MIT yang dipakai untuk enkripsi database.
5. Di **Project Settings → Script properties**, tambahkan:
   - Property: `GITHUB_TOKEN`
   - Value: token fine-grained yang dibuat pada langkah 1.
6. Simpan, pilih fungsi `setupDatabase`, lalu klik **Run** dan berikan izin Google Apps Script yang diminta. Fungsi ini membuat kunci enkripsi acak dalam Script Properties, memastikan branch `student-data`, dan menginisialisasi file JSON terenkripsi. **Tidak ada file database yang dibuat di Google Drive.**

Jangan menghapus atau mengganti property `ICT_CSS_ENCRYPTION_SECRET` setelah database berisi akun. Jika kunci ini hilang, data terenkripsi tidak dapat dipulihkan.

### 3. Deploy sebagai Web App

1. Klik **Deploy → New deployment → Web app**.
2. Set **Execute as** menjadi **Me**.
3. Set **Who has access** menjadi **Anyone**, jika diizinkan kebijakan akun sekolah. Endpoint ini memang harus dapat menerima permintaan dari siswa tanpa login Google.
4. Deploy, lalu salin URL Web App yang berakhiran `/exec`.
5. Pada `index.html`, cari `const ACCOUNT_API_URL = 'PASTE_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE';` dan ganti placeholder dengan URL tersebut. Commit perubahan pada branch `main`.
6. Tunggu GitHub Pages selesai deploy. Buka website dan uji pembuatan akun serta pemulihan kode.

Setiap kali kode Apps Script berubah, lakukan **Deploy → Manage deployments → Edit → New version → Deploy** agar URL aktif memakai versi terbaru.

## Alur data

- **Create:** server membuat kode akun acak, menyimpan nama dan progres awal ke JSON terenkripsi.
- **Restore:** server membaca JSON di branch `student-data`, mendekripsinya di server, lalu mengirim progres akun sesuai kode.
- **Save:** server mengenkripsi database yang telah diperbarui dan melakukan commit perubahan `data/accounts.json` ke branch `student-data`.
- Browser hanya menyimpan kode akun lokal agar perangkat yang sama bisa mengingat akun. Pemulihan di perangkat baru memerlukan kode akun.

## Catatan operasional dan keamanan

- File JSON ada di **repositori yang sama**, pada branch `student-data`; isinya berupa ciphertext, bukan nama/kode/progres yang dapat dibaca.
- Token GitHub dan kunci enkripsi harus tetap berada di Script Properties Google Apps Script. Jangan pernah memasukkannya ke HTML atau mengirimkannya kepada siswa.
- Kode akun bertindak seperti kata sandi. Siapa pun yang mengetahui kode bisa memulihkan dan mengubah progresnya. Minta siswa menyimpan kode secara privat.
- Backend ini sesuai untuk kelas/prototipe kecil. Setiap penyimpanan membuat commit di branch database, sehingga pertumbuhan jumlah siswa dan frekuensi autosave perlu dipantau. Sistem JSON di Git bukan pengganti database produksi dengan kontrol akses dan audit yang matang.
- Bila organisasi sekolah melarang Apps Script atau deployment web app publik, fitur lintas perangkat perlu memakai backend resmi lain yang diizinkan sekolah.
