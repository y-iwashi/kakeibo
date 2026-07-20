#!/bin/sh

# 現在時刻を取得 (例: 2026/07/20 17:15:00)
START_TIME=$(date "+%Y/%m/%d %H:%M:%S")

echo "--------------------------------------"
echo "Gunicornサーバーを起動します"
echo "--------------------------------------"
echo "起動時刻: ${START_TIME}"
echo "Django内部で発生した例外（Traceback）は、標準エラー出力（stderr）（ここ）に出力されます"

gunicorn --bind 127.0.0.1:8000 config.wsgi:application \
  --access-logfile ./logs/gunicorn_access.log \
  --error-logfile ./logs/gunicorn_error.log \
  --log-level debug
