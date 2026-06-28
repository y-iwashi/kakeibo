#!/bin/sh
echo "--------------------------------------"
echo "Gunicornサーバーを起動します"
echo "--------------------------------------"
gunicorn --bind 127.0.0.1:8000 config.wsgi:application
