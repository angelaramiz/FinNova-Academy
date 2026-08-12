Write-Host "=== Iniciando Simulador Laboral 3D ===" -ForegroundColor Cyan
Write-Host ""

# Backend (puerto 3001)
Start-Process -FilePath "cmd.exe" -ArgumentList "/k title Backend && cd /d C:\Users\angel\Desktop\academicFinace\backend && set PORT=3001 && npx tsx src/server.ts"
Write-Host "[1/2] Backend iniciando en puerto 3001..." -ForegroundColor Yellow

Start-Sleep -Seconds 2

# Frontend (puerto 3000)
Start-Process -FilePath "cmd.exe" -ArgumentList "/k title Frontend && cd /d C:\Users\angel\Desktop\academicFinace\alumnos && npx vite --port=3000 --host=0.0.0.0"
Write-Host "[2/2] Frontend iniciando en puerto 3000..." -ForegroundColor Yellow

Start-Sleep -Seconds 4

Write-Host ""
Write-Host "=== Servidores iniciados ===" -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host "Backend:  http://localhost:3001/api/health" -ForegroundColor Green
Write-Host ""
Write-Host "Usuarios locales: demo@simulador.com / test123" -ForegroundColor Cyan
Write-Host "Usuarios produccion: prueba@demo.com / test123" -ForegroundColor Cyan
Write-Host ""
Write-Host "Cierra las ventanas CMD para detener los servidores" -ForegroundColor Red

Start-Sleep -Seconds 5
