# مدیر پروژه های اوبونتو 🚀
# Ubuntu Project Manager

<div dir="rtl">

یک سامانه مدیریت قدرتمند برای اجرا، کنترل و مراقبت از چند پروژه روی سرور اوبونتو

## ویژگی های اصلی ✨

- ✅ مدیریت چند پروژه همزمان
- ✅ شروع، متوقف کردن و ریست پروژه ها
- ✅ رابط کاربری وب بسیار زیبا و کاربرپذیر
- ✅ نمایش لاگ های لحظه ای پروژه ها
- ✅ مدیریت مسیرهای مختلف پروژه ها
- ✅ پایگاه داده SQLite برای ذخیره داده ها
- ✅ اطلاعات سیستم و استفاده منابع
- ✅ Real-time updates با Socket.io
- ✅ پشتیبانی کامل فارسی

## نیازمندی ها 📋

- Node.js نسخه 14 یا بالاتر
- npm
- اوبونتو/لینوکس
- bash shell

## نصب و راه اندازی 🔧

### 1. نصب پروژه

```bash
cd RunProject
npm install
```

### 2. تنظیمات اولیه

ایجاد دایرکتوری برای پایگاه داده:

```bash
mkdir -p data
```

### 3. اجرای سرور

#### حالت توسعه (Development):
```bash
npm run dev
```

#### حالت تولید (Production):
```bash
npm start
```

سرور بر روی `http://localhost:3000` اجرا می شود

## استفاده 📖

### رابط کاربری

#### داشبورد
- نمایش خلاصه وضعیت سیستم
- تعداد پروژه های فعال
- پروژه های در حال اجرا
- لاگ های اخیر

#### مدیریت پروژه ها
- لیست تمام پروژه ها
- ویرایش اطلاعات پروژه
- حذف پروژه
- شروع/متوقف/ریست پروژه
- مشاهده لاگ های دتالی

#### افزودن پروژه
فرم برای اضافه کردن پروژه جدید:
- **نام پروژه**: نام منحصر به فرد
- **مسیر پروژه**: مسیر کامل پروژه (مثلاً `/home/user/projects/myapp`)
- **دستور شروع**: دستور اجرای پروژه (مثلاً `npm start`)
- **دستور متوقف کردن**: اختیاری (برای متوقف کردن سفارشی)
- **توضیحات**: شرح مختصر پروژه

#### معلومات سیستم
- اطلاعات سیستم عامل
- CPU و حافظه
- میزان استفاده منابع

## نمونه های دستورات 🎯

### نمونه 1: پروژه Node.js

```
نام: MyNodeApp
مسیر: /home/user/projects/nodeapp
دستور شروع: npm start
```

### نمونه 2: پروژه Python

```
نام: MyPythonApp
مسیر: /home/user/projects/pythonapp
دستور شروع: python3 app.py
```

### نمونه 3: پروژه Docker

```
نام: MyDockerApp
مسیر: /home/user/projects/dockerapp
دستور شروع: docker-compose up
دستور متوقف کردن: docker-compose down
```

### نمونه 4: سرویس Systemd

```
نام: MyService
مسیر: /home/user/projects/service
دستور شروع: systemctl start myservice
دستور متوقف کردن: systemctl stop myservice
```

## ساختار پروژه 📁

```
RunProject/
├── server.js                 # نقطه شروع سرور
├── package.json             # وابستگی ها
├── .env                     # متغیرهای محیطی
├── db/
│   └── database.js          # تنظیمات پایگاه داده
├── controllers/
│   └── projectController.js # منطق کنترل پروژه ها
├── routes/
│   ├── projects.js          # APIهای پروژه ها
│   └── system.js            # APIهای سیستم
├── public/
│   ├── index.html           # صفحه اصلی
│   ├── css/
│   │   └── style.css        # سبک ها
│   └── js/
│       └── app.js           # منطق فرانت‌اند
└── data/
    └── projects.db          # پایگاه داده (خودکار ایجاد می‌شود)
```

## API Endpoints 🔌

### پروژه ها

- `GET /api/projects` - دریافت تمام پروژه ها
- `POST /api/projects` - ایجاد پروژه جدید
- `GET /api/projects/:id` - دریافت اطلاعات پروژه
- `PUT /api/projects/:id` - به روز رسانی پروژه
- `DELETE /api/projects/:id` - حذف پروژه
- `POST /api/projects/:id/start` - شروع پروژه
- `POST /api/projects/:id/stop` - متوقف کردن پروژه
- `POST /api/projects/:id/reset` - ریست پروژه
- `GET /api/projects/:id/logs` - دریافت لاگ های پروژه

### سیستم

- `GET /api/system/info` - اطلاعات سیستم
- `GET /api/system/stats` - آمار کنونی سیستم

## نکات مهم ⚠️

1. **مجوزهای فایل**: اطمئین شوید که تمام پروژه‌ها مجوزهای اجرایی دارند:
   ```bash
   chmod +x /path/to/project/start.sh
   ```

2. **محدودیت‌های اجازه**: اگر پروژه نیاز به `sudo` دارد، می‌توانید `sudoers` را تنظیم کنید:
   ```bash
   sudo visudo
   # اضافه کنید: user ALL=(ALL) NOPASSWD: /path/to/command
   ```

3. **مدیریت حافظه**: برای پروژه‌های بزرگ، مراقب استفاده حافظه باشید

4. **Backup**: به طور منظم از پایگاه داده `data/projects.db` نسخه پشتیبان بگیرید

## عیب یابی 🔍

### پروژه شروع نمی‌شود

- بررسی کنید که مسیر صحیح است
- بررسی کنید که دستور شروع صحیح است
- لاگ‌های پروژه را بررسی کنید

### سرور اجرا نمی‌شود

```bash
# بررسی نصب وابستگی ها
npm install

# بررسی پورت
lsof -i :3000

# تغییر پورت در .env
PORT=3001
```

### خطا در دسترسی فایل

```bash
# افزایش مجوز
sudo chmod +x /path/to/project
```

## مسیول سازی 📝

این پروژه تحت مجوز MIT صادر شده است.

## کمک و مساهمه 🤝

برای گزارش مشکل یا پیشنهاد ویژگی جدید، لطفا issue باز کنید.

## تغییرات احتمالی در آینده 🚧

- [ ] صفحه‌بندی و جستجو
- [ ] تصدیق و احراز هویت
- [ ] گزارش‌های قطعی
- [ ] نسخه پشتیبان خودکار
- [ ] اطلاع‌رسانی‌های ایمیلی
- [ ] Kubernetes support

---

**ساخت شده با ❤️ برای مدیریت بهتر پروژه ها**

</div>

---

# Ubuntu Project Manager 🚀

A powerful management system for running, controlling and monitoring multiple projects on Ubuntu server

## Main Features ✨

- ✅ Manage multiple projects simultaneously
- ✅ Start, stop and reset projects
- ✅ Beautiful and user-friendly web interface
- ✅ Real-time project logs display
- ✅ Manage different project paths
- ✅ SQLite database for data storage
- ✅ System information and resource usage
- ✅ Real-time updates with Socket.io
- ✅ Full Persian (Farsi) support

## Requirements 📋

- Node.js version 14 or higher
- npm
- Ubuntu/Linux
- bash shell

## Installation & Setup 🔧

### 1. Install Project

```bash
cd RunProject
npm install
```

### 2. Initial Setup

Create directory for database:

```bash
mkdir -p data
```

### 3. Run Server

#### Development mode:
```bash
npm run dev
```

#### Production mode:
```bash
npm start
```

Server runs on `http://localhost:3000`

## Usage 📖

### User Interface

#### Dashboard
- System status overview
- Number of active projects
- Running projects
- Recent logs

#### Project Management
- List all projects
- Edit project information
- Delete projects
- Start/Stop/Reset projects
- View detailed logs

#### Add Project
Form to add new projects:
- **Project Name**: Unique name
- **Project Path**: Full path (e.g., `/home/user/projects/myapp`)
- **Start Command**: Command to run (e.g., `npm start`)
- **Stop Command**: Optional (for custom stop)
- **Description**: Brief description

#### System Information
- Operating system info
- CPU and memory
- Resource usage

## Examples 🎯

### Example 1: Node.js Project

```
Name: MyNodeApp
Path: /home/user/projects/nodeapp
Start Command: npm start
```

### Example 2: Python Project

```
Name: MyPythonApp
Path: /home/user/projects/pythonapp
Start Command: python3 app.py
```

### Example 3: Docker Project

```
Name: MyDockerApp
Path: /home/user/projects/dockerapp
Start Command: docker-compose up
Stop Command: docker-compose down
```

## Project Structure 📁

```
RunProject/
├── server.js
├── package.json
├── .env
├── db/
│   └── database.js
├── controllers/
│   └── projectController.js
├── routes/
│   ├── projects.js
│   └── system.js
├── public/
│   ├── index.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── app.js
└── data/
    └── projects.db
```

## API Endpoints 🔌

### Projects

- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project info
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `POST /api/projects/:id/start` - Start project
- `POST /api/projects/:id/stop` - Stop project
- `POST /api/projects/:id/reset` - Reset project
- `GET /api/projects/:id/logs` - Get project logs

### System

- `GET /api/system/info` - System information
- `GET /api/system/stats` - Current system stats

## Important Notes ⚠️

1. **File Permissions**: Ensure projects have execute permissions:
   ```bash
   chmod +x /path/to/project/start.sh
   ```

2. **Sudo Permissions**: Configure sudoers if needed:
   ```bash
   sudo visudo
   # Add: user ALL=(ALL) NOPASSWD: /path/to/command
   ```

3. **Memory Management**: Monitor memory usage for large projects

4. **Backup**: Regularly backup `data/projects.db`

## Troubleshooting 🔍

### Project won't start

- Verify the path is correct
- Check the start command
- Review project logs

### Server won't run

```bash
# Check dependencies
npm install

# Check port
lsof -i :3000

# Change port in .env
PORT=3001
```

### File permission errors

```bash
# Increase permissions
sudo chmod +x /path/to/project
```

## License 📝

This project is licensed under the MIT License.

## Contributing 🤝

To report bugs or suggest features, please open an issue.

## Roadmap 🚧

- [ ] Pagination and search
- [ ] Authentication
- [ ] Detailed reports
- [ ] Auto backup
- [ ] Email notifications
- [ ] Kubernetes support

---

**Built with ❤️ for better project management**
