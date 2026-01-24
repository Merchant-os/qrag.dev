@echo off
REM Setup script for Q# RAG Agent with GLM (Windows)
REM This script installs all required dependencies

echo ==========================================
echo Q# RAG Agent - Setup Script
echo ==========================================
echo.

REM Check Python version
echo Checking Python version...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found. Please install Python 3.8 or higher.
    exit /b 1
)
echo.

REM Check pip availability
echo Checking pip availability...
pip --version >nul 2>&1
if %errorlevel% neq 0 (
    echo pip not found. Please install pip.
    echo Visit: https://pip.pypa.io/en/stable/installation/
    exit /b 1
)
echo.

REM Install packages
echo Installing Python packages...
echo ----------------------------------------
if exist requirements.txt (
    pip install -r requirements.txt
    if %errorlevel% equ 0 (
        echo [OK] Packages from requirements.txt installed
    ) else (
        echo [ERROR] Failed to install packages
        exit /b 1
    )
) else (
    echo requirements.txt not found. Installing default packages...
    pip install anthropic>=0.18.0 openai>=1.0.0 zhipuai>=2.0.0 numpy>=1.24.0
)
echo.

REM Verify installations
echo Verifying installations...
echo ----------------------------------------
python -c "import openai; print('[OK] openai: ' + openai.__version__)" 2>nul || echo [ERROR] openai: NOT INSTALLED
python -c "import anthropic; print('[OK] anthropic: ' + anthropic.__version__)" 2>nul || echo [WARN] anthropic: NOT INSTALLED (optional)
python -c "import zhipuai; print('[OK] zhipuai: ' + zhipuai.__version__)" 2>nul || echo [ERROR] zhipuai: NOT INSTALLED
python -c "import numpy; print('[OK] numpy: ' + numpy.__version__)" 2>nul || echo [ERROR] numpy: NOT INSTALLED
echo.

REM Check for data files
echo Checking data files...
echo ----------------------------------------
if not exist corpus\index.json (
    echo [WARN] corpus\index.json not found.
    echo   Run: python corpus\scrape_qdk.py
    echo   to generate Q# examples corpus.
) else (
    echo [OK] corpus\index.json found
)

if not exist rag\vectors.json (
    echo [WARN] rag\vectors.json not found.
    echo   Run: python rag\embed.py
    echo   to generate vector embeddings.
    echo   Or use mock mode: python rag\embed.py --mock
) else (
    echo [OK] rag\vectors.json found
)
echo.

REM Setup complete
echo ==========================================
echo Setup complete!
echo ==========================================
echo.
echo Next steps:
echo 1. Set your API keys:
echo    set OPENAI_API_KEY=your-openai-key
echo    set GLM_API_KEY=your-glm-key
echo.
echo 2. Generate embeddings:
echo    python rag\embed.py
echo.
echo 3. Test RAG agent:
echo    python agent\agent.py
echo.
echo For more information, see README.md
pause
