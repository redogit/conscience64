@echo off
where node >nul 2>nul || (echo Node.js is required to run the local server.& pause & exit /b 1)
start "" http://127.0.0.1:4173
node serve.mjs
