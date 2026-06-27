# Kakeibo - サーバー構成メモ

## Nginx設定 (/etc/nginx/conf.d/server.conf)
```nginx
server {
    listen 80;
    server_name _;

    # 1. 通常のアクセス（/）はすべてReactの画面（distフォルダ）を直接返す
    location / {
        root /home/opc/kakeibo/kakeibo-frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html; # React Router（画面遷移）を使う時のための設定
    }

    # 2. Djangoの管理画面へのアクセスはGunicornに丸投げ
    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 3. 【将来用】ReactからDjangoのAPIを叩くためのパス
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 4. Django管理画面用の置き場所
    location /static/ {
        alias /home/opc/kakeibo/kakeibo-backend/static/;
    }
}
```

## SELinux 許可コマンド
```
sudo chcon -R -t httpd_sys_content_t /home/opc/kakeibo/kakeibo-frontend/dist
sudo chcon -R -t httpd_sys_content_t /home/opc/kakeibo/kakeibo-backend/static/
```

