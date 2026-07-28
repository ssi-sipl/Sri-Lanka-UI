@echo off

cd /d D:\Projects\Sri-Lanka-UI

start "" cmd /c "npm run dev"

echo Waiting for Next.js server...

:wait
netstat -ano | find ":3000" >nul
if errorlevel 1 (
    timeout /t 1 >nul
    goto wait
)

start "" http://localhost:3000