# AI OCR WhatsApp Bot

AI OCR WhatsApp adalah bot WhatsApp berbasis Node.js yang memungkinkan pengguna untuk membaca teks dari gambar menggunakan OCR (Optical Character Recognition) dan memprosesnya dengan AI untuk menghasilkan hasil yang lebih rapi. Bot ini didukung oleh **Tesseract.js** dan **Cloudflare AI API** untuk memberikan pengalaman terbaik dalam membaca dan memformat teks dari gambar.

---

## Fitur Utama
1. **Perintah `/ocr`:**  
   Membaca teks langsung dari gambar dan mengembalikan hasil OCR tanpa pengolahan tambahan.
   
2. **Perintah `/ocr /ai`:**  
   Membaca teks dari gambar, lalu memprosesnya dengan AI menggunakan prompt bawaan.

3. **Perintah `/ocr /ai (custom prompt)`:**  
   Membaca teks dari gambar, lalu memprosesnya dengan AI menggunakan prompt khusus yang diberikan oleh pengguna dalam tanda kurung `()`.

---

## Teknologi yang Digunakan
- **Node.js**: Runtime untuk JavaScript.
- **Baileys**: Library untuk mengintegrasikan WhatsApp.
- **Tesseract.js**: Library untuk OCR.
- **Cloudflare AI API**: API untuk memproses teks menggunakan AI.
- **dotenv**: Mengelola variabel lingkungan secara aman.

---

## Struktur Proyek
```
ai_ocr_whatsapp/
├── auth_info/                # Folder untuk autentikasi WhatsApp
├── downloads/                # Folder untuk file unduhan sementara
├── node_modules/             # Folder dependensi npm
├── .env                      # File konfigurasi API dan webhook
├── .env.example              # Template file konfigurasi
├── .gitignore                # File untuk mengabaikan direktori tertentu di Git
├── eng.traineddata           # Data OCR untuk bahasa Inggris
├── ind.traineddata           # Data OCR untuk bahasa Indonesia
├── index.js                  # Script utama bot
├── package-lock.json         # Lock file npm
├── package.json              # Konfigurasi proyek npm
└── README.md                 # Dokumentasi
```

---

## Instalasi

### 1. Clone Repository
Clone repository ini ke mesin Anda:
```bash
git clone https://github.com/Cloud-Dark/ai_ocr_whatsapp.git
cd ai_ocr_whatsapp
```

### 2. Install Dependensi
Install semua dependensi menggunakan npm:
```bash
npm install
```

### 3. Konfigurasi `.env`
Salin file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Isi file `.env` sesuai kebutuhan Anda:
```env
AI_API_URL=YOUR_ENDPOINT_AI_URL
AI_API_TOKEN=YOUR_CLOUDFLARE_API_TOKEN
WEBHOOK_URL=https://your-webhook-url.com
```

### 4. Jalankan Bot
Jalankan bot menggunakan perintah:
```bash
node index.js
```
Scan QR Code yang muncul di terminal untuk menghubungkan akun WhatsApp Anda.

---

## Cara Penggunaan
1. Kirim gambar ke bot WhatsApp dengan salah satu perintah berikut:
   - **`/ocr`**: Membaca teks dari gambar dan mengembalikannya langsung ke pengguna.
   - **`/ocr /ai`**: Membaca teks dari gambar dan memprosesnya dengan AI menggunakan prompt bawaan.
   - **`/ocr /ai (custom prompt)`**: Membaca teks dari gambar dan memprosesnya dengan AI menggunakan prompt yang ditentukan pengguna.

2. **Contoh:**
   - **Input Gambar:**
     ![Contoh Gambar Input](https://yourimageurl.com/input-example.png)
   - **Perintah:**
     ```plaintext
     /ocr /ai (Format teks ini sebagai invoice)
     ```
   - **Output:**
     ```plaintext
     Hasil AI:
     
     Invoice:
     - Nama: John Doe
     - Jumlah: Rp1.000.000
     - Tanggal: 15 Desember 2024
     ```

---

## Gambar Ilustrasi
### 1. Tampilan QR Code
![image](https://github.com/user-attachments/assets/b357040b-aed0-4735-9686-267ca83b7cad)


### 2. Contoh Hasil OCR
![image](https://github.com/user-attachments/assets/4eca3f20-9f5a-43fb-b1db-75cd5522ef20)


---

## Troubleshooting
1. **QR Code tidak muncul:**
   - Pastikan koneksi internet Anda stabil.
   - Hapus folder `auth_info` dan coba jalankan ulang bot.

2. **Gagal memproses gambar:**
   - Pastikan file gambar berformat **JPEG** atau **PNG**.
   - Pastikan file `eng.traineddata` dan `ind.traineddata` tersedia di root direktori proyek.

3. **Cloudflare AI tidak merespons:**
   - Periksa API Key pada file `.env`.
   - Pastikan koneksi internet Anda stabil.

---

## Lisensi
Proyek ini dilisensikan di bawah **MIT License**.

---

## Kontribusi
Kontribusi sangat terbuka! Fork repository ini, buat branch baru, dan kirimkan pull request.

---

Jika Anda memiliki pertanyaan atau masalah, silakan buka issue di [repository ini](https://github.com/Cloud-Dark/ai_ocr_whatsapp/issues).
