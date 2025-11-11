@echo off
REM Firebase Deployment Script for Windows
REM This script automates the deployment process

echo 🚀 Starting Firebase Deployment...
echo.

REM Check if Firebase CLI is installed
where firebase >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Firebase CLI is not installed
    echo    Install it with: npm install -g firebase-tools
    exit /b 1
)

REM Build React app
echo.
echo 🔨 Building React app...
call npm run build

if %errorlevel% neq 0 (
    echo ❌ Build failed!
    exit /b 1
)

echo ✅ Build successful!
echo.

REM Install function dependencies
echo 📦 Installing function dependencies...
cd functions
call npm install
cd ..

if %errorlevel% neq 0 (
    echo ❌ Function dependencies installation failed!
    exit /b 1
)

echo ✅ Dependencies installed!
echo.

REM Deploy
echo.
echo 🚀 Deploying to Firebase...
echo.
echo This will deploy both hosting and functions.
echo Press Ctrl+C to cancel, or
pause

firebase deploy

if %errorlevel% equ 0 (
    echo.
    echo ✅ Deployment successful!
    echo.
    echo 🌐 Your site should be live now!
    echo 📊 View logs with: firebase functions:log
) else (
    echo.
    echo ❌ Deployment failed!
    exit /b 1
)

