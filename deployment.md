# 🚀 Panduan Deployment — Jalan (Jaringan Relawan)

> **Target:** DigitalOcean VPS (Droplet) + Domain via Cloudflare  
> **Stack:** TanStack Start + Nitro (Node.js Server) + Supabase (BaaS)  
> **Hasil akhir:** Aplikasi fullstack berjalan di `https://domainanda.com`

---

## 📋 Daftar Isi

1. [Prasyarat](#-1-prasyarat)
2. [Setup Droplet DigitalOcean](#-2-setup-droplet-digitalocean)
3. [Konfigurasi Awal Server (SSH)](#-3-konfigurasi-awal-server-ssh)
4. [Instalasi Node.js, pnpm & Git](#-4-instalasi-nodejs-pnpm--git)
5. [Clone & Build Aplikasi](#-5-clone--build-aplikasi)
6. [Menjalankan Aplikasi dengan PM2](#-6-menjalankan-aplikasi-dengan-pm2)
7. [Setup Nginx sebagai Reverse Proxy](#-7-setup-nginx-sebagai-reverse-proxy)
8. [Konfigurasi Domain di Cloudflare](#-8-konfigurasi-domain-di-cloudflare)
9. [Setup SSL/TLS (HTTPS)](#-9-setup-ssltls-https)
10. [Setup Firewall (UFW)](#-10-setup-firewall-ufw)
11. [Auto-Deploy dengan GitHub Webhook (Opsional)](#-11-auto-deploy-dengan-github-webhook-opsional)
12. [Monitoring & Maintenance](#-12-monitoring--maintenance)
13. [Troubleshooting](#-13-troubleshooting)

---

## 📦 1. Prasyarat

Sebelum memulai, pastikan Anda sudah memiliki:

| Item | Keterangan |
|---|---|
| **Akun DigitalOcean** | [digitalocean.com](https://digitalocean.com) — punya saldo/metode pembayaran aktif |
| **Akun Cloudflare** | [cloudflare.com](https://cloudflare.com) — domain sudah ditambahkan |
| **Domain** | Domain yang NS-nya sudah diarahkan ke Cloudflare |
| **SSH Key** | SSH key pair (atau bisa pakai password, tapi SSH key lebih aman) |
| **Repository Git** | `https://github.com/YudaClairee/safety-garudahacks.git` |
| **Supabase Project** | Project Supabase sudah aktif dengan URL dan Anon Key |

---

## 🖥️ 2. Setup Droplet DigitalOcean

### 2.1 Buat Droplet Baru

1. Login ke [DigitalOcean Cloud Panel](https://cloud.digitalocean.com/)
2. Klik **Create** → **Droplets**
3. Pilih konfigurasi berikut:

| Setting | Rekomendasi |
|---|---|
| **Region** | Singapore (`SGP1`) — terdekat dari Indonesia |
| **Image** | Ubuntu 24.04 LTS |
| **Size** | Basic → Regular (CPU: 1 vCPU, RAM: 1 GB, SSD: 25 GB) — cukup untuk MVP |
| **Authentication** | SSH Key (direkomendasikan) |
| **Hostname** | `jalan-production` |

4. Klik **Create Droplet**
5. **Catat IP address** droplet Anda (misalnya `164.90.xxx.xxx`)

### 2.2 Generate SSH Key (jika belum punya)

Di komputer lokal Anda:

```bash
# Generate SSH key baru
ssh-keygen -t ed25519 -C "email-anda@gmail.com"

# Tampilkan public key untuk dicopy ke DigitalOcean
cat ~/.ssh/id_ed25519.pub
```

Copy output-nya dan paste saat membuat Droplet (bagian "Add SSH Key").

---

## 🔐 3. Konfigurasi Awal Server (SSH)

### 3.1 Login ke Server

```bash
ssh root@164.90.xxx.xxx
```

> ⚠️ Ganti `164.90.xxx.xxx` dengan IP droplet Anda yang sebenarnya.

### 3.2 Update Sistem

```bash
apt update && apt upgrade -y
```

### 3.3 Buat User Baru (Jangan pakai root untuk production)

```bash
# Buat user baru
adduser deploy

# Beri akses sudo
usermod -aG sudo deploy

# Copy SSH key dari root ke user baru
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy

# Test login dengan user baru (buka terminal baru)
ssh deploy@164.90.xxx.xxx
```

Mulai sekarang, semua perintah berikutnya dijalankan sebagai user **`deploy`**.

---

## 📥 4. Instalasi Node.js, pnpm & Git

### 4.1 Install Node.js 22 LTS via NodeSource

```bash
# Install curl jika belum ada
sudo apt install -y curl

# Tambahkan repository NodeSource untuk Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -

# Install Node.js
sudo apt install -y nodejs

# Verifikasi
node -v   # Harus menampilkan v22.x.x
npm -v    # Harus menampilkan versi npm
```

### 4.2 Install pnpm

```bash
# Install pnpm secara global
sudo npm install -g pnpm

# Verifikasi
pnpm -v
```

### 4.3 Install Git (biasanya sudah terinstal)

```bash
sudo apt install -y git
git --version
```

---

## 🏗️ 5. Clone & Build Aplikasi

### 5.1 Clone Repository

```bash
# Buat direktori untuk aplikasi
sudo mkdir -p /var/www/jalan
sudo chown deploy:deploy /var/www/jalan

# Clone dari GitHub
cd /var/www/jalan
git clone https://github.com/YudaClairee/safety-garudahacks.git .
```

### 5.2 Buat File Environment

```bash
nano /var/www/jalan/.env.local
```

Isi dengan environment variables produksi Anda:

```env
VITE_SUPABASE_URL=https://npgazhpstkjzvsnxhgdx.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

> ⚠️ **PENTING:** Ganti value di atas dengan credentials Supabase Anda yang sebenarnya. Jangan pernah commit file `.env.local` ke Git.

Simpan file: tekan `Ctrl + X`, lalu `Y`, lalu `Enter`.

### 5.3 Install Dependencies & Build

```bash
cd /var/www/jalan

# Install dependencies
pnpm install

# Build production bundle
pnpm build
```

Build akan menghasilkan folder `.output/` yang berisi:
- `.output/server/index.mjs` — Server entry point (Nitro)
- `.output/public/` — Static assets (CSS, JS, images)

### 5.4 Test Build Secara Manual

```bash
# Jalankan server secara langsung untuk test
node .output/server/index.mjs
```

Server akan berjalan di port **3000** (default Nitro). Tekan `Ctrl + C` untuk menghentikan setelah memverifikasi tidak ada error.

---

## ⚡ 6. Menjalankan Aplikasi dengan PM2

[PM2](https://pm2.io/) adalah process manager untuk Node.js yang menjaga aplikasi tetap berjalan, auto-restart saat crash, dan berjalan saat server reboot.

### 6.1 Install PM2

```bash
sudo npm install -g pm2
```

### 6.2 Buat File Konfigurasi PM2

```bash
nano /var/www/jalan/ecosystem.config.cjs
```

Isi dengan:

```js
module.exports = {
  apps: [
    {
      name: "jalan-app",
      script: ".output/server/index.mjs",
      cwd: "/var/www/jalan",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOST: "0.0.0.0",
        NITRO_PORT: 3000,
        NITRO_HOST: "0.0.0.0",
      },
    },
  ],
};
```

### 6.3 Jalankan Aplikasi

```bash
cd /var/www/jalan

# Start dengan PM2
pm2 start ecosystem.config.cjs

# Pastikan berjalan dengan benar
pm2 status
pm2 logs jalan-app
```

### 6.4 Setup Auto-Start saat Server Reboot

```bash
# Generate startup script
pm2 startup systemd

# PM2 akan menampilkan command yang harus dijalankan, copy-paste dan jalankan
# Contoh output:
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u deploy --hp /home/deploy

# Simpan daftar proses saat ini
pm2 save
```

### 6.5 Perintah PM2 yang Sering Digunakan

```bash
pm2 status              # Lihat status semua proses
pm2 logs jalan-app      # Lihat real-time logs
pm2 restart jalan-app   # Restart aplikasi
pm2 stop jalan-app      # Hentikan aplikasi
pm2 delete jalan-app    # Hapus dari PM2
pm2 monit               # Monitor CPU & Memory
```

---

## 🌐 7. Setup Nginx sebagai Reverse Proxy

Nginx berfungsi sebagai reverse proxy — menerima request dari port 80/443 dan meneruskannya ke aplikasi Node.js di port 3000.

### 7.1 Install Nginx

```bash
sudo apt install -y nginx
```

### 7.2 Buat Konfigurasi Nginx

```bash
sudo nano /etc/nginx/sites-available/jalan
```

Isi dengan konfigurasi berikut:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name domainanda.com www.domainanda.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/javascript
        application/javascript
        application/json
        application/xml
        image/svg+xml;

    # Static assets — serve langsung dari Nginx (lebih cepat)
    location /_build/ {
        alias /var/www/jalan/.output/public/_build/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Public static files (favicon, logo, manifest, dll)
    location /favicon.ico {
        alias /var/www/jalan/.output/public/favicon.ico;
        expires 30d;
        access_log off;
    }

    location /manifest.json {
        alias /var/www/jalan/.output/public/manifest.json;
        expires 30d;
        access_log off;
    }

    location /robots.txt {
        alias /var/www/jalan/.output/public/robots.txt;
        expires 30d;
        access_log off;
    }

    # Reverse proxy ke aplikasi Node.js
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;

        # Buffering
        proxy_buffering on;
        proxy_buffer_size 16k;
        proxy_buffers 4 64k;
    }

    # File upload max size (untuk upload foto tugas warga)
    client_max_body_size 10M;
}
```

> ⚠️ Ganti `domainanda.com` dengan domain Anda yang sesungguhnya.

### 7.3 Aktifkan Konfigurasi

```bash
# Buat symbolic link
sudo ln -s /etc/nginx/sites-available/jalan /etc/nginx/sites-enabled/

# Hapus konfigurasi default (opsional)
sudo rm /etc/nginx/sites-enabled/default

# Test konfigurasi Nginx
sudo nginx -t

# Jika output "test is successful", restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## ☁️ 8. Konfigurasi Domain di Cloudflare

### 8.1 Tambahkan DNS Record

1. Login ke [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Pilih domain Anda
3. Buka tab **DNS** → **Records**
4. Tambahkan record berikut:

| Type | Name | Content | Proxy Status | TTL |
|---|---|---|---|---|
| `A` | `@` | `164.90.xxx.xxx` | ☁️ Proxied | Auto |
| `A` | `www` | `164.90.xxx.xxx` | ☁️ Proxied | Auto |

> ⚠️ Ganti `164.90.xxx.xxx` dengan IP droplet Anda.  
> ☁️ **Proxied** = traffic melewati Cloudflare (CDN + DDoS Protection + SSL otomatis).

### 8.2 Pastikan Nameservers Sudah Benar

Domain Anda harus menggunakan nameservers Cloudflare. Biasanya:
```
ns1.cloudflare.com → misalnya: aria.ns.cloudflare.com
ns2.cloudflare.com → misalnya: bob.ns.cloudflare.com
```

Cek di registrar domain Anda (Niagahoster, Namecheap, GoDaddy, dll) dan pastikan NS sudah diarahkan ke Cloudflare.

---

## 🔒 9. Setup SSL/TLS (HTTPS)

Karena menggunakan Cloudflare Proxy, ada **2 opsi** untuk SSL:

### Opsi A: Cloudflare Flexible SSL (Paling Mudah) ⭐

Koneksi dienkripsi antara **browser ↔ Cloudflare** saja. Cocok untuk MVP/hackathon.

1. Di Cloudflare Dashboard → **SSL/TLS** → **Overview**
2. Pilih mode: **Flexible**
3. Selesai! ✅ Cloudflare akan otomatis serve HTTPS.

> ⚠️ Traffic antara Cloudflare ↔ Server Anda masih HTTP. Aman untuk MVP tapi kurang ideal untuk production.

### Opsi B: Cloudflare Full (Strict) SSL (Direkomendasikan untuk Production) 🔐

Koneksi dienkripsi **end-to-end**: browser ↔ Cloudflare ↔ Server.

#### Langkah 1: Generate Origin Certificate di Cloudflare

1. Di Cloudflare Dashboard → **SSL/TLS** → **Origin Server**
2. Klik **Create Certificate**
3. Pilih:
   - **Generate private key and CSR with Cloudflare**: ✅
   - **Hostnames**: `domainanda.com`, `*.domainanda.com`
   - **Certificate Validity**: 15 years
4. Klik **Create**
5. **Copy** isi Origin Certificate dan Private Key

#### Langkah 2: Simpan Certificate di Server

```bash
# Buat direktori untuk sertifikat
sudo mkdir -p /etc/ssl/cloudflare

# Simpan Origin Certificate
sudo nano /etc/ssl/cloudflare/origin.pem
# Paste isi Origin Certificate, simpan

# Simpan Private Key
sudo nano /etc/ssl/cloudflare/origin-key.pem
# Paste isi Private Key, simpan

# Amankan file
sudo chmod 600 /etc/ssl/cloudflare/origin-key.pem
sudo chmod 644 /etc/ssl/cloudflare/origin.pem
```

#### Langkah 3: Update Konfigurasi Nginx untuk HTTPS

```bash
sudo nano /etc/nginx/sites-available/jalan
```

Ganti seluruh isi file dengan:

```nginx
# Redirect HTTP ke HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name domainanda.com www.domainanda.com;
    return 301 https://$host$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name domainanda.com www.domainanda.com;

    # Cloudflare Origin Certificate
    ssl_certificate /etc/ssl/cloudflare/origin.pem;
    ssl_certificate_key /etc/ssl/cloudflare/origin-key.pem;

    # SSL Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/javascript
        application/javascript
        application/json
        application/xml
        image/svg+xml;

    # Static assets
    location /_build/ {
        alias /var/www/jalan/.output/public/_build/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    location /favicon.ico {
        alias /var/www/jalan/.output/public/favicon.ico;
        expires 30d;
        access_log off;
    }

    location /manifest.json {
        alias /var/www/jalan/.output/public/manifest.json;
        expires 30d;
        access_log off;
    }

    location /robots.txt {
        alias /var/www/jalan/.output/public/robots.txt;
        expires 30d;
        access_log off;
    }

    # Reverse proxy ke Node.js
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;

        proxy_buffering on;
        proxy_buffer_size 16k;
        proxy_buffers 4 64k;
    }

    client_max_body_size 10M;
}
```

#### Langkah 4: Terapkan Perubahan

```bash
# Test konfigurasi
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

#### Langkah 5: Set Mode SSL di Cloudflare

1. Di Cloudflare Dashboard → **SSL/TLS** → **Overview**
2. Pilih mode: **Full (strict)**
3. Selesai! ✅

---

## 🧱 10. Setup Firewall (UFW)

```bash
# Izinkan SSH, HTTP, dan HTTPS
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'

# Aktifkan firewall
sudo ufw enable

# Verifikasi aturan
sudo ufw status verbose
```

Output yang diharapkan:

```
Status: active

To                         Action      From
--                         ------      ----
OpenSSH                    ALLOW       Anywhere
Nginx Full                 ALLOW       Anywhere
OpenSSH (v6)               ALLOW       Anywhere (v6)
Nginx Full (v6)            ALLOW       Anywhere (v6)
```

> ⚠️ Port 3000 **TIDAK** perlu dibuka di firewall karena Nginx sudah melakukan reverse proxy secara internal (127.0.0.1).

---

## 🔄 11. Auto-Deploy dengan GitHub Webhook (Opsional)

Buat script untuk memudahkan deploy ulang setiap kali ada push baru ke repository.

### 11.1 Buat Script Deploy

```bash
nano /var/www/jalan/deploy.sh
```

Isi dengan:

```bash
#!/bin/bash

# ============================================
# Deploy Script — Jalan (Jaringan Relawan)
# ============================================

APP_DIR="/var/www/jalan"
LOG_FILE="/var/log/jalan-deploy.log"

echo "========================================" | tee -a $LOG_FILE
echo "[$(date)] Starting deployment..." | tee -a $LOG_FILE
echo "========================================" | tee -a $LOG_FILE

cd $APP_DIR || exit 1

# Pull perubahan terbaru
echo "[$(date)] Pulling latest changes..." | tee -a $LOG_FILE
git pull origin main 2>&1 | tee -a $LOG_FILE

# Install dependencies (jika ada perubahan)
echo "[$(date)] Installing dependencies..." | tee -a $LOG_FILE
pnpm install 2>&1 | tee -a $LOG_FILE

# Build ulang
echo "[$(date)] Building application..." | tee -a $LOG_FILE
pnpm build 2>&1 | tee -a $LOG_FILE

# Restart PM2
echo "[$(date)] Restarting application..." | tee -a $LOG_FILE
pm2 restart jalan-app 2>&1 | tee -a $LOG_FILE

echo "[$(date)] ✅ Deployment complete!" | tee -a $LOG_FILE
echo "========================================" | tee -a $LOG_FILE
```

```bash
# Berikan izin eksekusi
chmod +x /var/www/jalan/deploy.sh

# Buat log file
sudo touch /var/log/jalan-deploy.log
sudo chown deploy:deploy /var/log/jalan-deploy.log
```

### 11.2 Cara Penggunaan Manual

Setiap kali Anda push perubahan ke GitHub, login ke server dan jalankan:

```bash
/var/www/jalan/deploy.sh
```

### 11.3 Setup GitHub Actions CI/CD (Opsional Lanjutan)

Jika ingin deploy otomatis setiap `git push`, buat file workflow:

Di repository lokal Anda, buat file:

```bash
mkdir -p .github/workflows
nano .github/workflows/deploy.yml
```

Isi dengan:

```yaml
name: Deploy to DigitalOcean

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: /var/www/jalan/deploy.sh
```

Kemudian tambahkan **Secrets** di GitHub repository settings:

| Secret Name | Value |
|---|---|
| `VPS_HOST` | IP droplet Anda (`164.90.xxx.xxx`) |
| `VPS_USER` | `deploy` |
| `VPS_SSH_KEY` | Isi dari private key SSH Anda (`cat ~/.ssh/id_ed25519`) |

---

## 📊 12. Monitoring & Maintenance

### 12.1 Monitoring PM2

```bash
# Dashboard real-time
pm2 monit

# Status semua proses
pm2 status

# Log real-time
pm2 logs jalan-app --lines 100
```

### 12.2 Monitoring Nginx

```bash
# Cek status Nginx
sudo systemctl status nginx

# Lihat access log
sudo tail -f /var/log/nginx/access.log

# Lihat error log
sudo tail -f /var/log/nginx/error.log
```

### 12.3 Monitoring Sistem

```bash
# Penggunaan disk
df -h

# Penggunaan memory
free -m

# Penggunaan CPU & proses
htop
```

### 12.4 Update Sistem (Rutin)

```bash
# Update package list & upgrade (lakukan mingguan)
sudo apt update && sudo apt upgrade -y

# Restart jika diperlukan (setelah kernel update)
sudo reboot
```

---

## 🛠️ 13. Troubleshooting

### ❌ Aplikasi tidak bisa diakses via browser

```bash
# 1. Cek apakah PM2 berjalan
pm2 status

# 2. Cek apakah port 3000 sedang digunakan
sudo lsof -i :3000

# 3. Cek log error aplikasi
pm2 logs jalan-app --err --lines 50

# 4. Cek status Nginx
sudo systemctl status nginx
sudo nginx -t

# 5. Cek firewall
sudo ufw status
```

### ❌ Error `502 Bad Gateway`

Ini berarti Nginx tidak bisa terhubung ke aplikasi Node.js.

```bash
# Pastikan aplikasi berjalan di port 3000
pm2 status
pm2 restart jalan-app

# Cek log Nginx
sudo tail -20 /var/log/nginx/error.log
```

### ❌ Error `ERR_SSL_PROTOCOL_ERROR`

```bash
# Pastikan Cloudflare SSL mode sesuai:
# - Jika TIDAK pakai certificate di server → pilih "Flexible"
# - Jika SUDAH pasang Origin Certificate → pilih "Full (strict)"
```

### ❌ Build gagal karena memory tidak cukup

Pada droplet 1 GB RAM, build bisa gagal. Solusinya — tambahkan swap:

```bash
# Buat swap file 2 GB
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Jadikan permanen
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Verifikasi
free -m
```

### ❌ Environment variables tidak terbaca saat build

Pastikan file `.env.local` berada di root project (`/var/www/jalan/.env.local`) **sebelum** menjalankan `pnpm build`. Variabel `VITE_*` di-inline saat build time, bukan runtime.

> ⚠️ **Penting:** Karena variabel `VITE_` bersifat build-time, setiap kali mengubah `.env.local`, Anda **harus build ulang**:
> ```bash
> pnpm build && pm2 restart jalan-app
> ```

### ❌ Permission denied saat git pull

```bash
# Pastikan ownership benar
sudo chown -R deploy:deploy /var/www/jalan
```

---

## 📝 Ringkasan Arsitektur Deployment

```
┌─────────────────────────────────────────────────────────┐
│                      INTERNET                           │
│                     (Browser)                           │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS (port 443)
                       ▼
┌─────────────────────────────────────────────────────────┐
│                  CLOUDFLARE                              │
│  ┌───────────────────────────────────────────────────┐  │
│  │  • DNS Management                                 │  │
│  │  • CDN & Caching                                  │  │
│  │  • DDoS Protection                               │  │
│  │  • SSL Termination (Flexible)                     │  │
│  │    atau SSL Passthrough (Full Strict)              │  │
│  └───────────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP/HTTPS
                       ▼
┌─────────────────────────────────────────────────────────┐
│              DIGITALOCEAN DROPLET                        │
│              (Ubuntu 24.04 LTS)                          │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  UFW Firewall                                     │  │
│  │  Allow: 22 (SSH), 80, 443                         │  │
│  └──────────────────────┬────────────────────────────┘  │
│                         │                               │
│  ┌──────────────────────▼────────────────────────────┐  │
│  │  NGINX (Reverse Proxy)                            │  │
│  │  • Listen :80 → redirect ke :443                  │  │
│  │  • Listen :443 → SSL + proxy_pass                 │  │
│  │  • Serve static assets langsung                   │  │
│  │  • Gzip compression                               │  │
│  └──────────────────────┬────────────────────────────┘  │
│                         │ proxy_pass http://127.0.0.1:3000
│  ┌──────────────────────▼────────────────────────────┐  │
│  │  PM2 Process Manager                              │  │
│  │  └─ jalan-app (Node.js)                           │  │
│  │     └─ Nitro Server (.output/server/index.mjs)    │  │
│  │        ├─ TanStack Start SSR                      │  │
│  │        ├─ API Routes (/api/redeem-reward)          │  │
│  │        └─ Static Assets (.output/public/)         │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                       │
                       │ HTTPS API calls
                       ▼
┌─────────────────────────────────────────────────────────┐
│                    SUPABASE                              │
│  ┌───────────────────────────────────────────────────┐  │
│  │  • PostgreSQL Database                            │  │
│  │  • Auth (Email/Password)                          │  │
│  │  • Storage (task_photos bucket)                   │  │
│  │  • Row Level Security (RLS)                       │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Checklist Deployment

Gunakan checklist ini untuk memastikan semua langkah sudah dilakukan:

- [ ] Droplet DigitalOcean sudah dibuat (Ubuntu 24.04, SGP1)
- [ ] User `deploy` sudah dibuat dan bisa SSH
- [ ] Node.js 22, pnpm, dan Git terinstal
- [ ] Swap file ditambahkan (untuk droplet 1 GB RAM)
- [ ] Repository di-clone ke `/var/www/jalan`
- [ ] File `.env.local` sudah dibuat dengan credentials Supabase
- [ ] `pnpm install` dan `pnpm build` berhasil tanpa error
- [ ] PM2 menjalankan aplikasi dan status `online`
- [ ] PM2 startup sudah dikonfigurasi (auto-start saat reboot)
- [ ] Nginx terpasang dan konfigurasi sudah di-test (`nginx -t`)
- [ ] DNS record (A record) ditambahkan di Cloudflare → IP droplet
- [ ] SSL/TLS mode dipilih di Cloudflare (Flexible atau Full Strict)
- [ ] UFW firewall aktif (allow SSH, Nginx Full)
- [ ] Website bisa diakses via `https://domainanda.com` ✅
- [ ] Script `deploy.sh` sudah dibuat untuk deploy ulang

---

> 📅 Terakhir diperbarui: 17 Juli 2026
