@echo off
echo Starting local web server at http://localhost:8001
echo Press Ctrl+C in this window to stop the server.
python -m http.server 8000
pause