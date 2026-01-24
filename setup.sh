#!/bin/bash
# Setup script for Q# RAG Agent with GLM
# This script installs all required dependencies

set -e  # Exit on error

echo "=========================================="
echo "Q# RAG Agent - Setup Script"
echo "=========================================="
echo ""

# Check Python version
echo "Checking Python version..."
python3 --version || { echo "Python 3 not found. Please install Python 3.8 or higher."; exit 1; }
echo ""

# Check if pip is available
echo "Checking pip availability..."
if ! command -v pip3 &> /dev/null; then
    echo "pip3 not found. Attempting to install pip..."
    curl -sS https://bootstrap.pypa.io/get-pip.py | python3 -
fi
echo ""

# Install packages
echo "Installing Python packages..."
echo "----------------------------------------"

# Install from requirements.txt
if [ -f "requirements.txt" ]; then
    pip3 install -r requirements.txt
    echo "✓ Packages from requirements.txt installed"
else
    echo "requirements.txt not found. Installing default packages..."
    pip3 install anthropic>=0.18.0 openai>=1.0.0 zhipuai>=2.0.0 numpy>=1.24.0
fi
echo ""

# Verify installations
echo "Verifying installations..."
echo "----------------------------------------"
python3 -c "import openai; print('✓ openai: ' + openai.__version__)" 2>&1 || echo "✗ openai: NOT INSTALLED"
python3 -c "import anthropic; print('✓ anthropic: ' + anthropic.__version__)" 2>&1 || echo "✗ anthropic: NOT INSTALLED (optional)"
python3 -c "import zhipuai; print('✓ zhipuai: ' + zhipuai.__version__)" 2>&1 || echo "✗ zhipuai: NOT INSTALLED"
python3 -c "import numpy; print('✓ numpy: ' + numpy.__version__)" 2>&1 || echo "✗ numpy: NOT INSTALLED"
echo ""

# Check for corpus/index.json
echo "Checking data files..."
echo "----------------------------------------"
if [ ! -f "corpus/index.json" ]; then
    echo "⚠ corpus/index.json not found."
    echo "  Run: python corpus/scrape_qdk.py"
    echo "  to generate the Q# examples corpus."
else
    echo "✓ corpus/index.json found"
fi

if [ ! -f "rag/vectors.json" ]; then
    echo "⚠ rag/vectors.json not found."
    echo "  Run: python rag/embed.py"
    echo "  to generate vector embeddings."
    if [ -z "$OPENAI_API_KEY" ]; then
        echo "  Or use mock mode: python rag/embed.py --mock"
    fi
else
    echo "✓ rag/vectors.json found"
fi
echo ""

# Setup complete
echo "=========================================="
echo "Setup complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Set your API keys:"
echo "   export OPENAI_API_KEY='your-openai-key'"
echo "   export GLM_API_KEY='your-glm-key'"
echo ""
echo "2. Generate embeddings:"
echo "   python rag/embed.py"
echo ""
echo "3. Test the RAG agent:"
echo "   python agent/agent.py"
echo ""
echo "For more information, see README.md"
