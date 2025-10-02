@echo off
REM Sets the title for the command prompt window.
TITLE Gallery Maker Starter

echo ===================================================
echo  Gallery Maker - Auto-Organizer ^& Static Generator
echo ===================================================
echo.

REM --- Step 1: Check for Node.js ---
echo Checking for Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not found in your system's PATH.
    echo Please install Node.js ^(v18 or higher is recommended^) and try again.
    pause
    exit /b 1
)
echo Node.js found.
echo.
REM --- Step 2: Check for dependencies (node_modules folder) ---
echo Checking for existing dependencies...
if exist "node_modules" (
    echo Dependencies found in 'node_modules'. Skipping installation.
) else (
    echo Dependencies not found. Installing now using 'npm install'...
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: Dependency installation failed. Please check the output above for errors.
        pause
        exit /b 1
    )
    echo Dependency installation complete.
)
echo.
REM --- Step 3: Check for exiftool (a required external dependency) ---
echo Checking for exiftool...
where exiftool >nul 2>nul
if %errorlevel% neq 0 (
    echo.
    echo WARNING: 'exiftool' was not found in your system's PATH.
    echo The 'ingest' command will fail without it.
    echo Please see the README.md for installation instructions.
    echo.
) else (
    echo exiftool found.
)
echo.
REM --- Step 4: Start the application ---
echo Starting the pipeline API and control center...
REM This launches both the API (http://localhost:3001) and the dashboard (http://localhost:5173)
call npm run dev

echo.
pause