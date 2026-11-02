import oracledb

DB_USER = "ADMIN"
DB_PASSWORD = "Puri^2Games0228"  # TODO 環境変数から取得する
DSN = "puri2db_high"

WALLET_LOCATION = "/home/opc/kakeibo/kakeibo-backend/kakeibo/wallet"
WALLET_PASSWORD = "Puri^2Games0228"  # TODO 環境変数から取得する


connection = oracledb.connect(
    user=DB_USER,
    password=DB_PASSWORD,
    dsn=DSN,
    config_dir=WALLET_LOCATION,
    wallet_location=WALLET_LOCATION,
    wallet_password=WALLET_PASSWORD,
)

with connection:
    with connection.cursor() as cursor:
        cursor.execute("SELECT TO_CHAR(CURRENT_DATE, 'YYYY/MM/DD HH24:MI:SS') FROM DUAL")
        print(cursor.fetchone())
