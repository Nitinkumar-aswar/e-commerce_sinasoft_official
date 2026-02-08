#!/bin/bash
set -e

echo "AfterInstall: Installing backend dependencies"

cd /var/www/autokart/AutoKart-Backend
npm install --production
