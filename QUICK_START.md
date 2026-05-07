# شروع سریع - Quick Start Guide

## 🎯 خلاصه تغييرات - What Changed

### ✨ ویژگی های جديد اضافه شده

#### 1️⃣ مرور دایرکتوری بصری - Visual Directory Browser
```
📁 مرور فایل ها → انتخاب صحیح مسیر → تصدیق خودکار
```

#### 2️⃣ تشخیص نوع پروژه - Auto Project Type Detection
```
📊 Node.js, Python, Django, Docker, Ruby, Go, Rust
```

#### 3️⃣ پیشنهاد دستورات - Auto Command Suggestions
```
✅ دستورات خودکار پر می شوند بر اساس نوع پروژه
```

#### 4️⃣ اعتبار سنجی کامل - Complete Validation
```
🔍 تصدیق مسیر، وجود فایل ها، محیط
```

#### 5️⃣ متغیرهای محیطی - Environment Variables
```
🔐 اضافه کردن و مدیریت متغیرهای محیطی امن
```

#### 6️⃣ سیستم برچسق - Tagging System
```
🏷️ سازمان بندی پروژه ها با برچسق
```

---

## 🚀 شروع استفاده - Getting Started

### مرحله 1: افزودن پروژه جديد
```
1. کلیک بر "افزودن پروژه" 📌
2. کلیک بر "مرور" 📁
3. انتخاب پوشه پروژه
4. تایید ✓
```

### مرحله 2: فیلدها خودکار پر می شوند
```
✅ نوع پروژه: Node.js
✅ دستور شروع: npm start
✅ دستور متوقف: npm stop
```

### مرحله 3: اضافه کردن جزئیات اضافی
```
📝 نام: My Project
📝 توضیحات: توضیح کوتاه
🏷️ برچسق ها: nodejs, api, production
```

### مرحله 4: ذخیره
```
💾 کلیک "ذخیره"
✅ پروژه اضافه شد
```

---

## 📁 ساختار فایل های جديد - New Files Structure

```
RunProject/
├── utils/
│   └── fileSystem.js              ⭐ کلاس مدیریت فایل ها
├── routes/
│   ├── projects-enhanced.js       ⭐ API های بهبود یافته
│   └── browser.js                 ⭐ API های مرور فایل
├── public/
│   ├── js/
│   │   └── file-browser.js        ⭐ رابط مرور فایل
│   └── css/
│       └── style.css              (به روز شده)
├── FEATURES.md                    ⭐ توثیق ویژگی ها
├── USAGE_GUIDE_FA.md              ⭐ راهنمای کامل
├── CHANGELOG.md                   ⭐ خلاصه تغييرات
└── ...
```

---

## 🎮 نمونه استفاده - Usage Examples

### مثال 1: Node.js Project
```
📍 مسیر: /home/user/my-app
🔍 تشخیص: Node.js
✅ دستور: npm start
⏹️ متوقف: npm stop
🏷️ برچسق: nodejs, web, api
```

### مثال 2: Python Project
```
📍 مسیر: /home/user/api
🔍 تشخیص: Python
✅ دستور: python app.py
🔐 متغیر: DATABASE_URL=postgresql://...
🏷️ برچسق: python, api, backend
```

### مثال 3: Django Project
```
📍 مسیر: /home/user/django-app
🔍 تشخیص: Django
✅ دستور: python manage.py runserver
🔐 متغیر: SECRET_KEY=...
🏷️ برچسق: django, web, production
```

---

## 🛠️ API های جديد - New APIs

### مرور فایل - File Browser
```
GET  /api/browser/browse?path=/home/user
GET  /api/browser/tree?path=/home/user
POST /api/browser/verify
POST /api/browser/detect-type
POST /api/browser/suggestions
GET  /api/browser/common-paths
```

### پروژه های بهبود یافته - Enhanced Projects
```
POST   /api/projects/:id/env           متغیرهای محیطی
GET    /api/projects/:id/env
DELETE /api/projects/:id/env/:key
GET    /api/projects/search/:query     جستجو
GET    /api/projects/status/running    فعال ها
```

---

## 📱 رابط کاربری - User Interface

### دکمه های جديد
```
📁 مرور          → انتخاب مسیر
💡 پیشنهادات    → دیدن دستورات
🔍 تصدیق       → بررسی مسیر
```

### بخش های جديد
```
🏷️ برچسق ها        → سازمان بندی
🔐 متغیرهای محیطی → اطلاعات حساس
✅ تصدیق مسیر     → اطلاعات تصدیق
```

---

## ⚡ مزایا اصلی - Main Benefits

| بخش | قبل | بعد |
|------|------|------|
| **انتخاب مسیر** | ❌ دستی | ✅ بصری |
| **دستورات** | ❌ تایپ | ✅ خودکار |
| **اعتبار سنجی** | ❌ نه | ✅ بله |
| **خطاها** | ❌ مبهم | ✅ واضح |
| **سازمان بندی** | ❌ نام فقط | ✅ برچسق |
| **جستجو** | ❌ نام | ✅ نام + برچسق |
| **متغیرها** | ❌ محدود | ✅ کامل |
| **امنیت** | ❌ ضعیف | ✅ قوی |

---

## 📚 سند های راهنما - Documentation

```
📄 README.md                → معرفی کلی
📄 FEATURES.md             → تمام ویژگی ها
📄 USAGE_GUIDE_FA.md       → راهنمای کامل فارسی
📄 CHANGELOG.md            → تاریخچه تغييرات
📄 INSTALL_SERVICE.md      → نصب سرویس
📄 setup.sh                → اسکریپت راه اندازی
```

---

## 🔍 تست سریع - Quick Test

### 1. راه اندازی سرور
```bash
npm install
node server.js
```

### 2. رفتن به آدرس
```
http://localhost:3000
```

### 3. تست ویژگی ها
```
1. افزودن پروژه ✓
2. انتخاب مسیر ✓
3. تشخیص نوع ✓
4. دستورات خودکار ✓
5. ذخیره ✓
```

---

## ⚙️ تنظیمات - Configuration

### فایل .env (اختیاری)
```env
PORT=3000
NODE_ENV=development
DB_PATH=./data/projects.db
```

### نیازمندی های سیستم
```
Node.js >= 14
npm >= 6
sqlite3 >= 3
```

---

## 🆘 در صورت مشکل - Troubleshooting

### مشکل 1: مسیر یافت نشد
```
✅ حل: از دکمه مرور استفاده کنید
```

### مشکل 2: دستور کار نمی کند
```
✅ حل: دستور دیگری را امتحان کنید
```

### مشکل 3: پروژه شروع نمی شود
```
✅ حل: مسیر و دستور را بررسی کنید
```

---

## 📞 تماس و پشتیبانی - Support

اگر مشکلی داشتید:

1. **بررسی دستاویز** - Check FEATURES.md
2. **راهنمای کامل** - Read USAGE_GUIDE_FA.md
3. **لاگ ها** - Check browser console

---

## 🎉 خلاصه - Summary

**نسخه جديد (2.0)** شامل:

✨ مرور بصری مسیر
✨ تشخیص نوع پروژه
✨ پیشنهاد دستورات
✨ اعتبار سنجی کامل
✨ متغیرهای محیطی
✨ برچسق گذاری
✨ جستجو و فیلتر
✨ خطاگیری بهتر

**نتیجه:**
```
دقیق تر ✓  ایمن تر ✓  آسان تر ✓  مطمئن تر ✓
```

---

**نسخه:** 2.0
**تاریخ:** 2024
**زبان:** فارسی / انگلیسی

🚀 **شروع کنید و لذت ببرید!** 🎊
