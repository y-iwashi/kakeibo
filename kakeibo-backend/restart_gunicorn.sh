#!/bin/sh

echo "-----------------------------------------------"
echo "Gunicornサーバーを再起動します..."
echo "-----------------------------------------------"

# Gunicornプロセスが存在する場合は停止して再起動、存在しない場合は起動する
if pkill -f "gunicorn --bind 127.0.0.1:8000"; then

    sh ./stop_gunicorn.sh >> nohup.out

    # Gunicornを再起動
    echo "Gunicornを再起動しています..." >> nohup.out

    nohup sh ./start_gunicorn.sh &

else

    echo "起動中のGunicornプロセスは見つかりませんでした。" >> nohup.out

    # Gunicornを起動
    echo "Gunicornを起動しています..." >> nohup.out

    nohup sh ./start_gunicorn.sh &

fi