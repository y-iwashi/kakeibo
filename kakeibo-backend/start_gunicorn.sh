#!/bin/sh

echo "Gunicornサーバーを起動します"

gunicorn --bind 127.0.0.1:8000 config.wsgi:application
