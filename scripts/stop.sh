#!/bin/bash
set -e

echo "Stopping existing PM2 app..."

pm2 stop autokart || true
pm2 delete autokart || true
