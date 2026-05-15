@echo off
setlocal

cd /d "%~dp0"

set "MSG=%*"
if "%MSG%"=="" set "MSG=Atualizacao automatica"

git status --short
git add .
git diff --cached --quiet
if not errorlevel 1 (
  echo Nenhuma alteracao para enviar.
  exit /b 0
)

git commit -m "%MSG%"
if errorlevel 1 exit /b %errorlevel%

git push
if errorlevel 1 exit /b %errorlevel%

echo Projeto enviado para o GitHub.
