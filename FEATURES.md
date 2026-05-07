# مدیریت پروژه بهبود یافته - Enhanced Project Manager

## ویژگی های جدید - New Features

### 1. مرور پوشه ها - File Browser
- **انتخاب صحیح مسیر** - Accurate path selection with visual browser
- **میانبرهای سریع** - Quick shortcuts to common directories (Desktop, Documents, Projects, etc.)
- **تصدیق خودکار مسیر** - Automatic path verification

### 2. تشخیص نوع پروژه - Project Type Detection
پشتیبانی از انواع پروژه زیر:
- **Node.js** - npm, node packages
- **Python** - requirements.txt, setup.py, Pipfile
- **Django** - Django web framework
- **Ruby/Rails** - Gemfile, Rails projects
- **Docker** - Docker containers
- **Go** - Go projects
- **Rust** - Cargo projects
- **Git Repositories** - General git projects

### 3. پیشنهاد دستورات خودکار - Auto-Suggested Commands
- برای هر نوع پروژه، دستورات شروع و متوقف پیشنهاد می شود
- مثال برای Node.js:
  - شروع: `npm start`
  - متوقف: `npm stop`
- مثال برای Python:
  - شروع: `python app.py`

### 4. اعتبار سنجی صحیح مسیر - Path Validation
**بررسی های انجام شده:**
- ✓ وجود مسیر
- ✓ پوشه بودن
- ✓ قابلیت خواندگی
- ✓ تشخیص نوع پروژه
- ✓ اطلاعات محیط (Node.js, Python versions)

### 5. متغیرهای محیطی - Environment Variables
- اضافه کردن متغیرهای محیطی برای هر پروژه
- پشتیبانی از متغیرهای حساس (Secret)
- مدیریت آسان ENV variables

### 6. برچسب گذاری - Tagging System
- برچسب گذاری پروژه ها برای سازمان بندی بهتر
- جستجو بر اساس برچسب ها

### 7. جستجو و فیلتر - Search & Filter
- جستجوی نام پروژه
- فیلتر کردن براساس برچسب ها
- یافتن سریع پروژه ها

### 8. مدیریت بهبود یافته خطاها - Better Error Handling
- پیام های خطای دقیق به فارسی و انگلیسی
- اطلاعات جزئی در صورت خطا
- راهنمایی برای رفع مشکل

## API Endpoints جدید - New API Endpoints

### Browser Endpoints (`/api/browser/`)

#### مرور پوشه - Browse Directory
```
GET /api/browser/browse?path=/home/user&depth=2&files=true&dirs=true
```
پاسخ:
```json
{
  "path": "/home/user",
  "parent": "/home",
  "contents": [
    { "name": "file.txt", "path": "/home/user/file.txt", "type": "file" },
    { "name": "Projects", "path": "/home/user/Projects", "type": "directory" }
  ]
}
```

#### درخت دایرکتوری - Directory Tree
```
GET /api/browser/tree?path=/home/user&depth=2&maxItems=50
```

#### تصدیق مسیر - Verify Path
```
POST /api/browser/verify
Body: { "path": "/home/user/project" }
```
پاسخ:
```json
{
  "valid": true,
  "projectType": { "type": "nodejs", "name": "Node.js" },
  "suggestions": {
    "startCommand": "npm start",
    "stopCommand": "npm stop",
    "alternates": ["node index.js", "npm run dev"]
  },
  "environment": {
    "nodeVersion": "v18.0.0",
    "npmVersion": "9.0.0"
  }
}
```

#### مسیرهای عمومی - Common Paths
```
GET /api/browser/common-paths
```
پاسخ:
```json
[
  { "name": "صفحه اصلی - Home", "path": "/home/user", "icon": "home" },
  { "name": "Desktop", "path": "/home/user/Desktop", "icon": "monitor" },
  { "name": "Projects", "path": "/home/user/Projects", "icon": "folder" }
]
```

#### تشخیص نوع - Detect Type
```
POST /api/browser/detect-type
Body: { "path": "/home/user/project" }
```

#### دستورات پیشنهادی - Get Suggestions
```
POST /api/browser/suggestions
Body: { "path": "/home/user/project" }
```

### Projects Enhanced Endpoints (`/api/projects/`)

#### جستجو - Search
```
GET /api/projects/search/query
```

#### متغیرهای محیطی - Environment Variables
```
GET /api/projects/:id/env
POST /api/projects/:id/env
DELETE /api/projects/:id/env/:key
```

#### پروژه های در حال اجرا - Running Projects
```
GET /api/projects/status/running
```

## استفاده - Usage

### اضافه کردن پروژه جدید - Adding New Project

1. **رفتن به صفحه "افزودن پروژه"** - Go to "Add Project" page
2. **نام پروژه را وارد کنید** - Enter project name
3. **کلیک بر "مرور"** - Click "Browse" button
4. **انتخاب پوشه پروژه** - Select project folder
5. **دستورات خودکار پر می شوند** - Commands auto-fill
6. **اختیاری: اضافه کردن توضیحات و برچسب** - Optional: Add description and tags
7. **کلیک "ذخیره"** - Click "Save"

### اضافه کردن متغیرهای محیطی - Adding Environment Variables

1. **انتخاب پروژه** - Select project
2. **رفتن به "متغیرهای محیطی"** - Go to "Environment Variables" tab
3. **کلیک "اضافه کردن"** - Click "Add"
4. **وارد کردن کلید و مقدار** - Enter key and value
5. **ذخیره** - Save

## Database Schema

### جداول جدید - New Tables

#### environment_variables
```sql
CREATE TABLE environment_variables (
  id INTEGER PRIMARY KEY,
  projectId INTEGER,
  key TEXT NOT NULL,
  value TEXT,
  isSecret BOOLEAN,
  createdAt DATETIME,
  FOREIGN KEY(projectId) REFERENCES projects(id)
)
```

#### project_backups
```sql
CREATE TABLE project_backups (
  id INTEGER PRIMARY KEY,
  projectId INTEGER,
  backupName TEXT,
  backupPath TEXT,
  backupSize INTEGER,
  createdAt DATETIME,
  FOREIGN KEY(projectId) REFERENCES projects(id)
)
```

### فیلدهای جدید در جدول projects - New Fields in projects Table

```sql
ALTER TABLE projects ADD COLUMN projectType TEXT;
ALTER TABLE projects ADD COLUMN environmentVariables TEXT;
ALTER TABLE projects ADD COLUMN autoStart BOOLEAN DEFAULT 0;
ALTER TABLE projects ADD COLUMN maxRetries INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN retryCount INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN healthCheckCommand TEXT;
ALTER TABLE projects ADD COLUMN backupPath TEXT;
ALTER TABLE projects ADD COLUMN tags TEXT;
```

## بهبودهای امنیتی - Security Improvements

✓ **تصدیق مسیر** - Path verification
✓ **اعتبار سنجی دستور** - Command validation
✓ **جلوگیری از دستورات خطرناک** - Prevention of dangerous commands
✓ **متغیرهای حساس** - Secret environment variables
✓ **کنترل دسترسی** - Access control

## بهبودهای عملکردی - Performance Improvements

✓ **کش کردن نتایج** - Result caching
✓ **بارگذاری تدریجی** - Progressive loading
✓ **محدود کردن درخت دایرکتوری** - Limited directory tree size
✓ **جستجوی سریع** - Fast searching

## استثنا های شناسایی شده - Known Limitations

⚠ **محدودیت عمق دایرکتوری** - Directory depth limited to 2 by default
⚠ **محدودیت تعداد آیتم** - Max 50 items in tree by default
⚠ **پشتیبانی سیستم عامل** - Platform-specific commands (Windows vs Linux/Mac)

## توسعه آینده - Future Enhancements

🔜 **Backup و Restore** - Backup and restore functionality
🔜 **Health Check** - Project health monitoring
🔜 **Auto Start** - Automatic project startup
🔜 **Retry Logic** - Automatic retry on failure
🔜 **Webhook Support** - Webhook integrations
🔜 **Multi-user Support** - Multiple user support
🔜 **Project Templates** - Project templates
🔜 **Batch Operations** - Batch project operations

---

**نسخه** Version: 2.0
**تاریخ آخرین بروزرسانی** Last Updated: 2024
