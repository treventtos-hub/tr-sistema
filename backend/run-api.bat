@echo off
cd /d "%~dp0"
if exist ".env.local" (
  for /f "usebackq tokens=1,* delims==" %%A in (".env.local") do set "%%A=%%B"
)
netstat -ano | findstr /R /C:":8081 .*LISTENING" > nul
if not errorlevel 1 (
  echo API ja esta rodando em http://localhost:8081 > api-run-combined.log
  exit /b 0
)

call mvnw.cmd spring-boot:run > api-run-combined.log 2>&1
