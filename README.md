# Seven Electric - Proyecto

Repositorio del proyecto "Seven Electric" (aplicación para gestión de servicios y cotizaciones).

## Estructura
- `frontend/` - Aplicación React + Vite
- `backend/` - Servidor Node/Express con SQLite
- `prueba.html` y otros archivos auxiliares

## Requisitos
- Node.js (v14+)
- npm
- Git

## Levantar backend
```powershell
cd backend
npm install
node server.js
```
El servidor corre en `http://localhost:3000`.

## Levantar frontend
```powershell
cd frontend
npm install
npm run dev
```
La app de desarrollo de Vite estará disponible en `http://localhost:5173` (u otro puerto que indique Vite).

## Subir a GitHub (pasos rápidos)
1. Abre PowerShell en la carpeta del proyecto:
```powershell
cd C:\Users\adono\Desktop\prueba
```
2. Verifica que `git` esté disponible:
```powershell
git --version
```
Si el comando no se reconoce, reinicia la terminal o instala Git desde https://git-scm.com/download/win.

3. Inicializa y sube (usa la URL del repo remoto que ya creaste):
```powershell
git init
git add .
git commit -m "Initial commit: proyecto Seven Electric"
git remote add origin https://github.com/NAS-157/Sistemas-de-informaci-n.git
git branch -M main
git push -u origin main
```
Si Git pregunta por usuario/contraseña, usa tu usuario de GitHub y un token de acceso personal (PAT) como contraseña.

## Si subiste por error archivos grandes (ej. database.sqlite)
Para quitarlo del repo pero mantenerlo local:
```powershell
git rm --cached backend/database.sqlite
git commit -m "Remove database from repo"
git push
```

## Ayuda
Si necesitas, pega aquí la salida del comando `git --version` o de `git push` y te ayudo a resolverlo paso a paso.
