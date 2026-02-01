#!/bin/bash
set -e

echo "Checking backend directory..."
if [ ! -d "/var/www/ecommerce/AutoKart-Backend" ]; then
  echo "❌ Backend directory not found"
  ls -l /var/www/ecommerce
  exit 1
fi

echo "Installing backend dependencies"
cd /var/www/ecommerce/AutoKart-Backend
npm install

echo "Checking frontend directory..."
if [ ! -d "/var/www/ecommerce/AutoKart-Frontend" ]; then
  echo "❌ Frontend directory not found"
  ls -l /var/www/ecommerce
  exit 1
fi

echo "Installing frontend dependencies"
cd /var/www/ecommerce/AutoKart-Frontend
npm install
npm run build
