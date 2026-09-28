@echo off
title Patel R Mart - Push to GitHub
color 0B
cls
echo ================================================================
echo    PATEL R MART - UPLOAD TO GITHUB (Premv987/Billing-system)
echo ================================================================
echo.
echo [1/2] Connecting to GitHub and pushing project files...
echo (If a browser window opens, click "Sign in with browser" / "Authorize")
echo.
cd /d "%~dp0"
"C:\Program Files\Git\cmd\git.exe" push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ================================================================
    echo  [SUCCESS] All files pushed to GitHub successfully!
    echo  Your repository is live: https://github.com/Premv987/Billing-system
    echo.
    echo  Next: Go to vercel.com -> Add New Project -> Import -> Deploy!
    echo ================================================================
) else (
    echo.
    echo ================================================================
    echo  [NOTICE] If GitHub says "Repository not found":
    echo  Make sure you created the repo at https://github.com/new
    echo  with the exact name: Billing-system
    echo  Then re-run this file!
    echo ================================================================
)
echo.
pause
