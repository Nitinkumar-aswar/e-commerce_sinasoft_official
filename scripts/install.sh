#!/bin/bash
set -e

echo "Installing backend dependencies..."

APP_DIR="/var/www/autokart/AutoKart-Backend"

if [ ! -d "$APP_DIR" ]; then
  echo "ERROR: $APP_DIR does not exist"
  exit 1
fi

cd "$APP_DIR"
npm install --production
