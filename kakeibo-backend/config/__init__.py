# config/__init__.py

import oracledb
import sys

# Djangoの型検証（isinstance）を騙し切るためのダミーオブジェクトを定義
class DummyType:
    pass

# oracledbの初期化設定
oracledb.version = "8.3.0"
oracledb.is_thin_mode = lambda: True
oracledb.Binary = DummyType  # Djangoが探している「Binary」型を偽装して身代わりにする
oracledb.Timestamp = DummyType  # Djangoが探している「Timestamp」型を偽装して身代わりにする
oracledb.Datetime = DummyType   # Djangoが探している「Datetime」型を偽装して身代わりにする

# ウォレットの読み込み設定
# init_oracle_client の行はコメントアウトしました
# oracledb.init_oracle_client(config_dir='/home/opc/kakeibo/kakeibo-backend/kakeibo/wallet')

# モジュールのすり替え
sys.modules["cx_Oracle"] = oracledb