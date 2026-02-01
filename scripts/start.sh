#!/bin/bash
set -e

echo "Starting application with PM2..."

cd /var/www/autokart/AutoKart-Backend

pm2 stop autokart || true
pm2 delete autokart || true

pm2 start index.js --name autokart
pm2 save
