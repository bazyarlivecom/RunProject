# راهنمای نصب به عنوان سرویس سیستم - System Service Installation Guide

## نصب و اجرای پروژه مدیر به عنوان سرویس Systemd

### مرحله 1: کپی پروژه

```bash
# کپی پروژه به دایرکتوری مناسب
sudo cp -r RunProject /opt/project-manager
cd /opt/project-manager
```

### مرحله 2: نصب وابستگی‌ها

```bash
# نصب npm packages
sudo npm install --production

# ایجاد دایرکتوری data
sudo mkdir -p data
sudo chown -R www-data:www-data /opt/project-manager
```

### مرحله 3: راه‌اندازی Systemd Service

```bash
# کپی فایل service
sudo cp project-manager.service /etc/systemd/system/

# بارگذاری مجدد systemd
sudo systemctl daemon-reload

# فعال کردن سرویس
sudo systemctl enable project-manager

# شروع سرویس
sudo systemctl start project-manager
```

### مرحله 4: بررسی وضعیت

```bash
# وضعیت سرویس
sudo systemctl status project-manager

# مشاهده لاگ‌ها
sudo journalctl -u project-manager -f
```

### مرحله 5: تنظیم Nginx (اختیاری)

برای اجرای Project Manager پشت Nginx reverse proxy:

```nginx
upstream project_manager {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name your_domain.com;

    location / {
        proxy_pass http://project_manager;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### فرمان‌های مفید

```bash
# شروع سرویس
sudo systemctl start project-manager

# متوقف کردن سرویس
sudo systemctl stop project-manager

# راه‌اندازی مجدد
sudo systemctl restart project-manager

# مشاهده وضعیت
sudo systemctl status project-manager

# فعال کردن خودکار هنگام بوت
sudo systemctl enable project-manager

# غیرفعال کردن خودکار بوت
sudo systemctl disable project-manager

# مشاهده لاگ‌های آخر 50 خط
sudo journalctl -u project-manager -n 50

# مشاهده لاگ‌های real-time
sudo journalctl -u project-manager -f

# مشاهده کل لاگ‌ها
sudo journalctl -u project-manager --all
```

### عیب یابی

#### سرویس شروع نمی‌شود

```bash
# بررسی خطاها
sudo journalctl -u project-manager -n 100

# بررسی مجوزهای فایل
sudo ls -la /opt/project-manager/
sudo chown -R www-data:www-data /opt/project-manager

# بررسی Node.js
which node
sudo npm list -g
```

#### خطا در دسترسی بپورت

```bash
# بررسی پورت 3000
sudo lsof -i :3000

# تغییر پورت در .env
sudo nano /opt/project-manager/.env
# تغییر PORT=3000 به PORT=3001

# راه‌اندازی مجدد
sudo systemctl restart project-manager
```

#### مشکل در اتصال پایگاه داده

```bash
# بررسی دایرکتوری data
sudo ls -la /opt/project-manager/data/

# ایجاد دایرکتوری در صورت نیاز
sudo mkdir -p /opt/project-manager/data
sudo chown www-data:www-data /opt/project-manager/data
sudo chmod 755 /opt/project-manager/data

# راه‌اندازی مجدد
sudo systemctl restart project-manager
```

### Uninstall

```bash
# متوقف کردن سرویس
sudo systemctl stop project-manager

# غیرفعال کردن خودکار بوت
sudo systemctl disable project-manager

# حذف فایل service
sudo rm /etc/systemd/system/project-manager.service

# بارگذاری مجدد systemd
sudo systemctl daemon-reload

# حذف فایل‌های پروژه
sudo rm -rf /opt/project-manager
```

---

**نکات مهم:**
- مطمئن شوید که فایل `.env` به درستی تنظیم شده است
- پورت 3000 باید در دسترس باشد یا آن را تغییر دهید
- صاحب فایل‌ها باید `www-data` باشد تا سرویس بتواند آنها دسترسی داشته باشد
- برای اجرای دستورات پروژه‌ها، ممکن است نیاز به تنظیم مجوزهای `sudo` باشد
