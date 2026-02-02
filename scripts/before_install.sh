#!/bin/bash
set -e

echo "BeforeInstall: Preparing system"

# Ensure base directory exists
mkdir -p /var/www/autokart

# Install Node.js if missing
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
  yum install -y nodejs
fi

# Install PM2 if missing
if ! command -v pm2 >/dev/null 2>&1; then
  npm install -g pm2
fi
