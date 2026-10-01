@echo off
chcp 65001 >nul
title HANA-VI Config Editor
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\editor\server.ps1"
if errorlevel 1 pause
