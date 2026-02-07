#!/bin/bash
set -e

<<<<<<< HEAD
echo "Starting AutoKart Backend"

cd /var/www/autokart/AutoKart-Backend

pm2 stop autokart || true
pm2 delete autokart || true

pm2 start index.js --name autokart
pm2 save
=======
echo "Starting AutoKart Backend as ec2-user"

cd /var/www/autokart/AutoKart-Backend

sudo -u ec2-user pm2 stop autokart || true
sudo -u ec2-user pm2 delete autokart || true

sudo -u ec2-user pm2 start index.js --name autokart
sudo -u ec2-user pm2 save
>>>>>>> master
