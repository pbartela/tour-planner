#!/bin/bash

# Playwright Test Runner in Docker
# This script runs Playwright tests in a Docker container with proper networking

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🎭 Playwright Test Runner (Docker)${NC}"
echo ""

# Check if Supabase is running
echo -e "${YELLOW}Checking Supabase status...${NC}"
if ! curl -s http://127.0.0.1:54324/ > /dev/null 2>&1; then
    echo -e "${RED}❌ Mailpit is not accessible at http://127.0.0.1:54324/${NC}"
    echo -e "${YELLOW}Please start Supabase first: supabase start${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Supabase/Mailpit is running${NC}"
echo ""

# Check if dev server is running
echo -e "${YELLOW}Checking dev server status...${NC}"
if ! curl -s http://127.0.0.1:4321/ > /dev/null 2>&1; then
    echo -e "${RED}❌ Dev server is not running at http://127.0.0.1:4321/${NC}"
    echo -e "${YELLOW}Please start the dev server first: npm run dev${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Dev server is running${NC}"
echo ""

# Check if .env file exists
echo -e "${YELLOW}Checking environment configuration...${NC}"
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found${NC}"
    echo -e "${YELLOW}Please create a .env file with required variables${NC}"
    echo -e "${YELLOW}You can copy from .env.example if available${NC}"
    exit 1
fi
echo -e "${GREEN}✓ .env file found${NC}"
echo ""

# Build Docker image
echo -e "${YELLOW}Building Playwright Docker image...${NC}"
docker build -f Dockerfile.playwright -t tour-planner-playwright .
echo -e "${GREEN}✓ Docker image built${NC}"
echo ""

# Run Playwright tests with host network access
echo -e "${YELLOW}Running Playwright tests...${NC}"
echo ""

docker run --rm \
  --network host \
  --ipc=host \
  -v "$(pwd)/test-results:/app/test-results" \
  -v "$(pwd)/playwright-report:/app/playwright-report" \
  -v "$(pwd)/.env:/app/.env:ro" \
  -e BASE_URL=http://localhost:4321 \
  -e CI=true \
  tour-planner-playwright "$@"

# Check exit code
EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
else
    echo -e "${RED}❌ Some tests failed${NC}"
    echo -e "${YELLOW}View report: npm run test:e2e:report${NC}"
fi

exit $EXIT_CODE
