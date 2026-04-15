#!/bin/bash
# OpenSlide PDF Server — VPS setup script
# Run once on a fresh Ubuntu 22.04 VPS as root or sudo user
# Usage: bash setup.sh

set -e

echo "=== Installing Node.js 20 ==="
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

echo "=== Installing PM2 ==="
npm install -g pm2

echo "=== Installing Chromium dependencies ==="
apt-get install -y \
  ca-certificates \
  fonts-liberation \
  libappindicator3-1 \
  libasound2t64 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libc6 \
  libcairo2 \
  libcups2 \
  libdbus-1-3 \
  libexpat1 \
  libfontconfig1 \
  libgbm1 \
  libgcc1 \
  libglib2.0-0 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libpango-1.0-0 \
  libpangocairo-1.0-0 \
  libstdc++6 \
  libx11-6 \
  libx11-xcb1 \
  libxcb1 \
  libxcomposite1 \
  libxcursor1 \
  libxdamage1 \
  libxext6 \
  libxfixes3 \
  libxi6 \
  libxrandr2 \
  libxrender1 \
  libxss1 \
  libxtst6 \
  lsb-release \
  wget \
  xdg-utils

echo "=== Installing server dependencies ==="
cd /opt/openslides-pdf
npm install

echo "=== Setting up .env ==="
if [ ! -f .env ]; then
  cp .env.example .env
  SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
  sed -i "s/replace-with-a-long-random-secret/$SECRET/" .env
  echo ""
  echo ">>> Generated PDF_SERVER_SECRET. Add this to your Vercel env vars:"
  grep PDF_SERVER_SECRET .env
  echo ""
fi

echo "=== Starting with PM2 ==="
pm2 start ecosystem.config.js
pm2 save
pm2 startup | tail -1 | bash

echo ""
echo "=== Done! PDF server running on port 3001 ==="
echo "Test it: curl http://localhost:3001/health"
