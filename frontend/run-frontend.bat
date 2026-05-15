@echo off
cd /d "%~dp0"
call npm.cmd run dev > frontend-live.log 2>&1
