#!/bin/bash

# Missland Server Cleanup Script
# WARNING: This will remove all Missland containers, images, and volumes
# Make sure you have backed up media files before running this!

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${RED}================================${NC}"
echo -e "${RED}Missland Server Cleanup${NC}"
echo -e "${RED}================================${NC}"
echo ""
echo -e "${YELLOW}This script will:${NC}"
echo "  1. Stop all Missland containers"
echo "  2. Remove all Missland containers"
echo "  3. Remove all Missland images"
echo "  4. Remove code directory (keeps backup)"
echo "  5. Keep media volume backup in /tmp"
echo ""
echo -e "${RED}WARNING: This is destructive!${NC}"
echo -e "${YELLOW}Make sure you have backed up media files!${NC}"
echo ""
read -p "Are you sure you want to continue? (type 'yes' to proceed): " -r
echo

if [ "$REPLY" != "yes" ]; then
    echo "Cleanup cancelled."
    exit 0
fi

echo ""
echo -e "${YELLOW}Step 1: Checking for media backup...${NC}"
if [ -f /tmp/missland_media_backup.tar.gz ]; then
    echo -e "${GREEN}✓ Media backup found at /tmp/missland_media_backup.tar.gz${NC}"
else
    echo -e "${RED}✗ No media backup found!${NC}"
    read -p "Continue anyway? (type 'yes'): " -r
    if [ "$REPLY" != "yes" ]; then
        echo "Cleanup cancelled."
        exit 0
    fi
fi

echo ""
echo -e "${YELLOW}Step 2: Stopping Missland containers...${NC}"
cd ~/Missland 2>/dev/null || true
docker-compose down 2>/dev/null || true

echo ""
echo -e "${YELLOW}Step 3: Removing Missland containers...${NC}"
docker ps -a | grep missland | awk '{print $1}' | xargs -r docker rm -f 2>/dev/null || true

echo ""
echo -e "${YELLOW}Step 4: Removing Missland images...${NC}"
docker images | grep missland | awk '{print $3}' | xargs -r docker rmi -f 2>/dev/null || true

echo ""
echo -e "${YELLOW}Step 5: Removing Missland network...${NC}"
docker network rm missland_network 2>/dev/null || true

echo ""
echo -e "${YELLOW}Step 6: Backing up code directory...${NC}"
if [ -d ~/Missland ]; then
    mv ~/Missland ~/Missland_old_$(date +%Y%m%d_%H%M%S)
    echo -e "${GREEN}✓ Code backed up${NC}"
fi

echo ""
echo -e "${YELLOW}Step 7: Checking Docker volumes...${NC}"
echo "Current Missland volumes:"
docker volume ls | grep missland || echo "No volumes found"
echo ""
echo -e "${YELLOW}NOTE: Volumes are kept for data safety${NC}"
echo "To remove them manually:"
echo "  docker volume rm missland_postgres_data"
echo "  docker volume rm missland_redis_data"
echo "  docker volume rm missland_static_volume"
echo "  docker volume rm missland_media_volume  # ⚠️ Contains nail images!"

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Cleanup Complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "Media backup: /tmp/missland_media_backup.tar.gz"
echo ""
echo "Ready for fresh deployment!"
echo ""
echo "Next steps:"
echo "  1. cd ~"
echo "  2. git clone https://github.com/radinamri/Missland.git"
echo "  3. cd Missland"
echo "  4. cp .env.docker.example .env.docker"
echo "  5. nano .env.docker  # Configure your secrets"
echo "  6. ./deploy.sh"
