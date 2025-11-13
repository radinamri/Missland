#!/bin/bash
# Missland Deployment Quick Start Script for IP: 46.249.102.155
# This script helps set up the deployment configuration files

set -e

echo "=========================================="
echo "Missland Deployment Setup"
echo "Server IP: 46.249.102.155"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to generate a random secret key
generate_secret_key() {
    python3 -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
}

# Check if running on production server
if [ -d "/var/www/missland" ]; then
    APP_DIR="/var/www/missland"
    echo -e "${GREEN}✓ Detected production environment${NC}"
else
    APP_DIR="$(pwd)"
    echo -e "${YELLOW}! Running in development/local environment${NC}"
fi

echo ""
echo "Configuration Setup for IP: 46.249.102.155"
echo "==========================================="

# Prompt for database credentials
read -p "Enter database name [missland_db]: " DB_NAME
DB_NAME=${DB_NAME:-missland_db}

read -p "Enter database user [missland_user]: " DB_USER
DB_USER=${DB_USER:-missland_user}

read -sp "Enter database password: " DB_PASSWORD
echo ""

# Use existing Google OAuth credentials
GOOGLE_CLIENT_ID="665407123210-20j9tne8tqgfi5t7dn6jr6taj51o0elk.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="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"

echo -e "${YELLOW}Using configured Google OAuth credentials${NC}"
echo -e "${YELLOW}NOTE: Add http://46.249.102.155 to Google Console redirect URIs${NC}"

# Generate Django secret key
echo ""
echo -e "${YELLOW}Generating Django secret key...${NC}"
SECRET_KEY=$(generate_secret_key)

# Create backend .env file
echo ""
echo -e "${YELLOW}Creating backend .env file...${NC}"
cat > "$APP_DIR/backend/.env" <<ENVEOF
# Django Backend Environment Variables
# Generated on $(date)
# Server IP: 46.249.102.155

# Django Settings
DJANGO_SETTINGS_MODULE=config.settings_production
DJANGO_SECRET_KEY=$SECRET_KEY

# Database Configuration
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_HOST=localhost
DB_PORT=5432

# Redis Configuration
REDIS_URL=redis://127.0.0.1:6379/1

# Google OAuth
GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET

# Email Configuration (Update these if using email)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
DEFAULT_FROM_EMAIL=noreply@missland.app
ENVEOF

echo -e "${GREEN}✓ Backend .env file created${NC}"

# Create frontend .env.production file
echo ""
echo -e "${YELLOW}Creating frontend .env.production file...${NC}"
cat > "$APP_DIR/frontend/.env.production" <<ENVEOF
# Next.js Frontend Environment Variables (Production)
# Generated on $(date)
# Server IP: 46.249.102.155

# API Configuration (HTTP only)
NEXT_PUBLIC_API_URL=http://46.249.102.155/api

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID
ENVEOF

echo -e "${GREEN}✓ Frontend .env.production file created${NC}"

# Update systemd service files
if [ -f "$APP_DIR/deployment/systemd/missland-django.service" ]; then
    echo ""
    echo -e "${YELLOW}Updating systemd service files...${NC}"
    CURRENT_USER=$(whoami)
    sed -i.bak "s/YOUR_USERNAME/$CURRENT_USER/g" "$APP_DIR/deployment/systemd/missland-django.service"
    sed -i.bak "s/YOUR_SECRET_KEY_HERE/$SECRET_KEY/g" "$APP_DIR/deployment/systemd/missland-django.service"
    sed -i.bak "s/YOUR_USERNAME/$CURRENT_USER/g" "$APP_DIR/deployment/systemd/missland-nextjs.service"
    echo -e "${GREEN}✓ Systemd service files updated${NC}"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}Setup Complete!${NC}"
echo "=========================================="
echo ""
echo "Configuration Summary:"
echo "- Server IP: 46.249.102.155"
echo "- Protocol: HTTP (no SSL)"
echo "- Database: $DB_NAME"
echo "- Database User: $DB_USER"
echo ""
echo "Next Steps:"
echo "1. Review generated configuration files"
echo "2. Add http://46.249.102.155 to Google OAuth redirect URIs"
echo "3. Install backend dependencies:"
echo "   cd backend && python3 -m venv venv && source venv/bin/activate"
echo "   pip install -r requirements.txt"
echo "4. Install frontend dependencies:"
echo "   cd frontend && npm install"
echo "5. Run migrations:"
echo "   cd backend && python manage.py migrate"
echo "   python manage.py collectstatic --no-input"
echo "   python manage.py createsuperuser"
echo "6. Build frontend:"
echo "   cd frontend && npm run build"
echo "7. Copy systemd files:"
echo "   sudo cp deployment/systemd/*.service /etc/systemd/system/"
echo "8. Copy nginx config:"
echo "   sudo cp deployment/nginx/missland.conf /etc/nginx/sites-available/missland"
echo "   sudo ln -s /etc/nginx/sites-available/missland /etc/nginx/sites-enabled/"
echo "9. Start services:"
echo "   sudo systemctl daemon-reload"
echo "   sudo systemctl enable missland-django missland-nextjs"
echo "   sudo systemctl start missland-django missland-nextjs"
echo "   sudo systemctl restart nginx"
echo ""
echo "Access your app at: http://46.249.102.155"
echo ""
echo "For detailed instructions, see docs/DEPLOYMENT.md"
echo ""
