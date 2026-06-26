#!/usr/bin/env bash
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
RESET='\033[0m'

echo ""
echo -e "${BOLD}docblueprint-engine — setup check${RESET}"
echo "──────────────────────────────────"

# Check Node.js
if ! command -v node &>/dev/null; then
  echo -e "${RED}✗ Node.js not found.${RESET}"
  echo "  Install Node.js 18+ from https://nodejs.org or via nvm:"
  echo "    nvm install 18 && nvm use 18"
  exit 1
fi

NODE_MAJOR=$(node -e "process.stdout.write(process.version.split('.')[0].replace('v',''))")
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo -e "${RED}✗ Node.js $NODE_MAJOR detected — version 18 or higher required.${RESET}"
  echo "  Upgrade with: nvm install 18 && nvm use 18"
  exit 1
fi

echo -e "${GREEN}✓ Node.js $(node --version)${RESET}"

# Check ANTHROPIC_API_KEY
if [ -z "${ANTHROPIC_API_KEY:-}" ]; then
  echo -e "${RED}✗ ANTHROPIC_API_KEY is not set.${RESET}"
  echo ""
  echo "  Get your key at: https://console.anthropic.com"
  echo "  Then add it to your shell profile:"
  echo ""
  echo -e "    ${YELLOW}export ANTHROPIC_API_KEY=sk-ant-...${RESET}"
  echo ""
  echo "  Or set it inline for a single run:"
  echo ""
  echo -e "    ${YELLOW}ANTHROPIC_API_KEY=sk-ant-... npx docblueprint-engine interview${RESET}"
  exit 1
fi

echo -e "${GREEN}✓ ANTHROPIC_API_KEY is set${RESET}"

echo ""
echo -e "${BOLD}All checks passed. You're ready to go.${RESET}"
echo ""
echo "Next steps:"
echo ""
echo "  1. Run the interview to build your project config:"
echo -e "     ${YELLOW}make interview${RESET}  (or: npx docblueprint-engine interview)"
echo ""
echo "  2. Generate all 99 documents:"
echo -e "     ${YELLOW}make generate${RESET}   (or: npx docblueprint-engine generate:docs)"
echo ""
echo "  3. Validate consistency:"
echo -e "     ${YELLOW}make validate${RESET}   (or: npx docblueprint-engine validate)"
echo ""
