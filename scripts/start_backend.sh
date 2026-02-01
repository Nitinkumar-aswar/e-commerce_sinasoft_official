#!/bin/bash

cd /var/www/ecommerce/AutoKart-Backend
pm2 start index.js --name AutoKart-backend || pm2 restart AutoKart-backend
