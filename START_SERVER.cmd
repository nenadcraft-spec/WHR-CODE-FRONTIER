@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Potreban Node.js 24 ili 26 LTS.
  pause
  exit /b 1
)
if not exist "node_modules\ws\index.js" (
  echo Prvo pokreni npm ci u ovom folderu.
  pause
  exit /b 1
)
echo WHR V7: otvori http://127.0.0.1:8080 u browseru.
echo Dva taba za 1v1, cetiri taba za 2v2. Server ostaje na ovom racunaru.
node server\server.cjs
pause
