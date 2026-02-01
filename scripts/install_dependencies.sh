#!/bin/bash
set -e

cd /var/www/ecommerce/AutoKart-Backend
npm install

cd /var/www/ecommerce/AutoKart-Frontend
npm install
npm run build
