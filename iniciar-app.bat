@echo off
REM Inicia el backend en una ventana nueva
start cmd /k "cd backend && node server.js"

REM Espera 2 segundos para que el backend inicie
ping 127.0.0.1 -n 3 > nul

REM Inicia la app de escritorio Electron
npx electron .

REM Fin del script
