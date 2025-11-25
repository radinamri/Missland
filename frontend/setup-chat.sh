#!/bin/bash

# AI Stylist Chat - Quick Setup Script
# This script helps set up the environment for the AI chat feature

echo "🎨 Missland AI Stylist Chat - Setup"
echo "===================================="
echo ""

# Check if we're in the frontend directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the frontend directory"
    exit 1
fi

# Check if .env.local exists
if [ -f ".env.local" ]; then
    echo "✅ .env.local already exists"
else
    echo "📝 Creating .env.local from template..."
    if [ -f ".env.local.example" ]; then
        cp .env.local.example .env.local
        echo "✅ Created .env.local"
        echo "⚠️  Please edit .env.local and set your environment variables"
    else
        echo "❌ Error: .env.local.example not found"
        exit 1
    fi
fi

echo ""
echo "🔍 Checking environment variables..."
echo ""

# Load .env.local
if [ -f ".env.local" ]; then
    source .env.local
    
    # Check NEXT_PUBLIC_API_URL
    if [ -z "$NEXT_PUBLIC_API_URL" ]; then
        echo "⚠️  NEXT_PUBLIC_API_URL is not set"
    else
        echo "✅ NEXT_PUBLIC_API_URL: $NEXT_PUBLIC_API_URL"
    fi
    
    # Check NEXT_PUBLIC_CHAT_API_URL
    if [ -z "$NEXT_PUBLIC_CHAT_API_URL" ]; then
        echo "⚠️  NEXT_PUBLIC_CHAT_API_URL is not set (will default to http://localhost:8000)"
    else
        echo "✅ NEXT_PUBLIC_CHAT_API_URL: $NEXT_PUBLIC_CHAT_API_URL"
    fi
fi

echo ""
echo "🔧 Checking backend health..."
echo ""

# Check if backend is running
BACKEND_URL="${NEXT_PUBLIC_CHAT_API_URL:-http://localhost:8000}"
if curl -s "${BACKEND_URL}/health" > /dev/null 2>&1; then
    echo "✅ Backend is running at ${BACKEND_URL}"
    echo ""
    echo "Backend health check:"
    curl -s "${BACKEND_URL}/health" | python3 -m json.tool 2>/dev/null || echo "Unable to parse health response"
else
    echo "❌ Backend is not running at ${BACKEND_URL}"
    echo ""
    echo "To start the backend:"
    echo "  1. Navigate to the backend directory"
    echo "  2. Run: python main.py (or uvicorn main:app --reload)"
    echo "  3. Verify it's running: curl ${BACKEND_URL}/health"
fi

echo ""
echo "📦 Checking dependencies..."
echo ""

if [ -d "node_modules" ]; then
    echo "✅ node_modules exists"
else
    echo "⚠️  node_modules not found"
    echo "Running: npm install"
    npm install
fi

echo ""
echo "🎯 Setup Summary"
echo "================"
echo ""
echo "✅ Configuration file: .env.local"
echo "✅ API service: utils/chatApi.ts"
echo "✅ Chat page: app/chat/page.tsx"
echo "✅ Documentation: docs/AI_CHAT_IMPLEMENTATION.md"
echo ""
echo "🚀 Next Steps:"
echo ""
echo "1. Edit .env.local with your configuration"
echo "2. Ensure backend is running at ${BACKEND_URL}"
echo "3. Run: npm run dev"
echo "4. Navigate to: http://localhost:3000/chat"
echo ""
echo "📚 Read docs/AI_CHAT_IMPLEMENTATION.md for detailed information"
echo ""
echo "✨ Happy coding!"
