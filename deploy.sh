#!/bin/bash

# Missland Production Deployment Script
# Server: 46.249.102.155
# This script should be run on the production server

set -e

echo "================================"
echo "Missland Deployment Script"
echo "================================"
echo ""

# Colors for output
RED='\033[0.31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.docker exists
if [ ! -f .env.docker ]; then
    echo -e "${RED}Error: .env.docker file not found!${NC}"
    echo "Please create .env.docker from .env.docker.example"
    exit 1
fi

echo -e "${YELLOW}Step 1: Pulling latest code from GitHub...${NC}"
git pull origin main

echo ""
echo -e "${YELLOW}Step 2: Building Docker images...${NC}"
docker-compose --env-file .env.docker build --no-cache

echo ""
echo -e "${YELLOW}Step 3: Stopping existing containers...${NC}"
docker-compose --env-file .env.docker down

echo ""
echo -e "${YELLOW}Step 4: Starting containers...${NC}"
docker-compose --env-file .env.docker up -d

echo ""
echo -e "${YELLOW}Step 5: Waiting for services to be healthy...${NC}"
sleep 30

echo ""
echo -e "${YELLOW}Step 6: Checking container status...${NC}"
docker-compose --env-file .env.docker ps

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "Service Status:"
docker-compose --env-file .env.docker ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "To view logs:"
echo "  docker-compose --env-file .env.docker logs -f"
echo ""
echo "To view specific service logs:"
echo "  docker-compose --env-file .env.docker logs -f django"
echo "  docker-compose --env-file .env.docker logs -f nextjs"
echo "  docker-compose --env-file .env.docker logs -f nginx"
echo ""
echo "Access your application at: http://46.249.102.155"
