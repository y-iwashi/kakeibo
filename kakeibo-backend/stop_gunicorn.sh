#!/bin/sh

# 現在時刻を取得 (例: 2026-07-20 17:15:00)
STOP_TIME=$(date "+%Y/%m/%d %H:%M:%S")

echo "-----------------------------------------------"
echo "Gunicornサーバーを停止します..."
echo "-----------------------------------------------"

# Gunicornプロセスが存在するか確認して停止
if pkill -f "gunicorn --bind 127.0.0.1:8000"; then

    echo "Gunicornを正常に停止しました。"
    echo "停止時刻: ${STOP_TIME}"

else

    echo "起動中のGunicornプロセスは見つかりませんでした。"
    
fi



