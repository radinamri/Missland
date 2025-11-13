#!/bin/bash
# Missland Health Check Script
# Checks the status of all services and components

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "=========================================="
echo "Missland Health Check"
echo "=========================================="
echo ""

# Function to check service status
check_service() {
    local service=$1
    if systemctl is-active --quiet "$service"; then
        echo -e "${GREEN}✓${NC} $service is running"
        return 0
    else
        echo -e "${RED}✗${NC} $service is not running"
        return 1
    fi
}

# Function to check URL
check_url() {
    local url=$1
    local name=$2
    if curl -s -f -o /dev/null "$url"; then
        echo -e "${GREEN}✓${NC} $name is accessible at $url"
        return 0
    else
        echo -e "${RED}✗${NC} $name is not accessible at $url"
        return 1
    fi
}

# Check PostgreSQL
echo "Database:"
if systemctl is-active --quiet postgresql; then
    echo -e "${GREEN}✓${NC} PostgreSQL is running"
else
    echo -e "${RED}✗${NC} PostgreSQL is not running"
fi

# Check Redis
echo ""
echo "Cache:"
if systemctl is-active --quiet redis-server || systemctl is-active --quiet redis; then
    echo -e "${GREEN}✓${NC} Redis is running"
    if redis-cli ping > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Redis is responding to commands"
    else
        echo -e "${RED}✗${NC} Redis is not responding"
    fi
else
    echo -e "${RED}✗${NC} Redis is not running"
fi

# Check Django service
echo ""
echo "Backend:"
check_service "missland-django"

# Check Next.js service
echo ""
echo "Frontend:"
check_service "missland-nextjs"

# Check Nginx
echo ""
echo "Web Server:"
check_service "nginx"

# Check disk space
echo ""
echo "Disk Space:"
df -h / | tail -1 | awk '{
    used = $5
    gsub(/%/, "", used)
    if (used > 90)
        printf "\033[0;31m✗\033[0m Disk usage: %s (Critical!)\n", $5
    else if (used > 75)
        printf "\033[1;33m!\033[0m Disk usage: %s (Warning)\n", $5
    else
        printf "\033[0;32m✓\033[0m Disk usage: %s\n", $5
}'

# Check memory
echo ""
echo "Memory:"
free -m | awk 'NR==2{
    used = $3/$2 * 100
    if (used > 90)
        printf "\033[0;31m✗\033[0m Memory usage: %.0f%% (Critical!)\n", used
    else if (used > 75)
        printf "\033[1;33m!\033[0m Memory usage: %.0f%% (Warning)\n", used
    else
        printf "\033[0;32m✓\033[0m Memory usage: %.0f%%\n", used
}'

# Check URLs (if running on production)
echo ""
echo "Endpoints:"
if [ -d "/var/www/missland" ]; then
    check_url "http://localhost:8000" "Django Backend (local)"
    check_url "http://localhost:3000" "Next.js Frontend (local)"
    
    # Try to get domain from Nginx config
    DOMAIN=$(grep -oP 'server_name \K[^;]+' /etc/nginx/sites-available/missland 2>/dev/null | head -1 | awk '{print $1}')
    if [ ! -z "$DOMAIN" ] && [ "$DOMAIN" != "your-domain.com" ]; then
        check_url "https://$DOMAIN" "Public Website"
        check_url "https://$DOMAIN/api/" "Public API"
        check_url "https://$DOMAIN/admin/" "Django Admin"
    fi
else
    echo -e "${YELLOW}!${NC} Not running on production server, skipping endpoint checks"
fi

# Check recent errors in logs
echo ""
echo "Recent Errors (last hour):"
if [ -d "/var/log/missland" ]; then
    ERROR_COUNT=$(find /var/log/missland -name "*.log" -mmin -60 -exec grep -i "error" {} \; 2>/dev/null | wc -l)
    if [ "$ERROR_COUNT" -eq 0 ]; then
        echo -e "${GREEN}✓${NC} No errors found in logs"
    else
        echo -e "${YELLOW}!${NC} Found $ERROR_COUNT error(s) in logs (last hour)"
        echo "   Run: tail -f /var/log/missland/*.log"
    fi
else
    echo -e "${YELLOW}!${NC} Log directory not found at /var/log/missland"
fi

echo ""
echo "=========================================="
echo "Health Check Complete"
echo "=========================================="
echo ""
echo "For service logs, run:"
echo "  sudo journalctl -u missland-django -f"
echo "  sudo journalctl -u missland-nextjs -f"
echo ""
