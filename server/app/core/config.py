# --filepath: server/app/core/config.py
from pathlib import Path

# 1. 统一获取项目根目录 (server/ 这一层)
# resolve().parent 是 config.py 所在的目录，即 server/
BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings:
    # --- 路径配置 ---
    APP_NAME: str = "Stock Analysis App"
    
    # 数据库路径
    DB_PATH: Path = Path("D:/DB/financial.db")
    
    # 财务字段配置路径
    FINANCIAL_FIELDS_JSON: Path = BASE_DIR / "config" / "financial_fields.json"
    
    # 默认导出路径
    DEFAULT_EXPORT_DIR: Path = Path("D:/雪球数据/个股财务报表")

    # --- 也可以放其他全局配置 ---
    XUEQIU_REFERER: str = "https://xueqiu.com/"
    TIMEOUT: float = 15.0

# 实例化
settings = Settings()