#!/bin/bash

# مثال برای استفاده از پروژه - Project Manager Example Script
# این اسکریپت یک نمونه از نحوه ایجاد و مدیریت پروژه ها است

echo "🚀 Ubuntu Project Manager - Setup Example"
echo "==========================================="
echo ""

# رنگ‌ها برای output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. نصب وابستگی‌ها
echo -e "${BLUE}[1]${NC} Installing dependencies..."
npm install

# 2. ایجاد دایرکتوری‌های لازم
echo -e "${BLUE}[2]${NC} Creating necessary directories..."
mkdir -p data
mkdir -p logs

# 3. بررسی وجود Node.js
echo -e "${BLUE}[3]${NC} Checking Node.js installation..."
if command -v node &> /dev/null; then
    echo -e "${GREEN}✓ Node.js found: $(node --version)${NC}"
else
    echo -e "${YELLOW}✗ Node.js not found. Please install Node.js${NC}"
    exit 1
fi

# 4. بررسی پورت
echo -e "${BLUE}[4]${NC} Checking port 3000..."
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${YELLOW}⚠ Port 3000 is already in use${NC}"
    read -p "Enter a different port (default 3000): " PORT
    PORT=${PORT:-3000}
    export PORT
else
    echo -e "${GREEN}✓ Port 3000 is available${NC}"
fi

# 5. اجرای سرور
echo ""
echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN}🎉 Ready to start the server!${NC}"
echo -e "${GREEN}==========================================${NC}"
echo ""
echo "To start the server, run:"
echo -e "  ${YELLOW}npm start${NC}    (Production mode)"
echo "or"
echo -e "  ${YELLOW}npm run dev${NC}  (Development mode with auto-reload)"
echo ""
echo "Then open: http://localhost:3000"
echo ""
