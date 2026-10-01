@echo off
chcp 65001 >nul
title HANA-VI 4.1 Build
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\build.ps1"
