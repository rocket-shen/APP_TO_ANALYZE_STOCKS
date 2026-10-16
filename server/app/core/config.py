# server/app/core/config.py
from pathlib import Path
from typing import List

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# server/ 这一层
BASE_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    APP_NAME: str = "Stock Analysis App"
    ENV: str = "dev"  # dev | prod

    # 路径：可用环境变量覆盖；未设置时用相对路径
    DB_PATH: Path = BASE_DIR / "data" / "financial.db"
    DEFAULT_EXPORT_DIR: Path = BASE_DIR / "data" / "exports"
    STOCK_DICT_A_PATH: Path = BASE_DIR / "data" / "stock_dict_a.npy"
    OUTPUT_JSON_DIR: Path = BASE_DIR / "data" / "output"

    FINANCIAL_FIELDS_JSON: Path = BASE_DIR / "config" / "financial_fields.json"
    # view_financial_data_industrial 当前 46 列的中文字段映射
    INDUSTRIAL_FIELDS_ZH_JSON: Path = (
        BASE_DIR / "config" / "view_financial_data_industrial_zh.json"
    )
    SQL_DIR: Path = BASE_DIR / "app" / "queries"

    XUEQIU_REFERER: str = "https://xueqiu.com/"
    TIMEOUT: float = 15.0

    # API key / rate limit (sync & export; kept as secondary layer)
    API_KEY: str = ""  # empty = skip key check only when ENV=dev
    RATE_LIMIT_PER_MINUTE: int = 20

    # Single-user cookie login
    AUTH_USERNAME: str = "admin"
    AUTH_PASSWORD: str = ""  # empty + ENV=dev → login optional; set to enforce
    AUTH_SECRET: str = ""  # required when AUTH_PASSWORD is set
    AUTH_COOKIE_NAME: str = "stocks_session"
    AUTH_COOKIE_MAX_AGE: int = 7 * 24 * 3600  # 7 days

    CORS_ORIGINS: List[str] = Field(
        default_factory=lambda: [
            "http://localhost:3000",
            "http://localhost:5173",
        ]
    )

    @field_validator(
        "DB_PATH",
        "DEFAULT_EXPORT_DIR",
        "STOCK_DICT_A_PATH",
        "OUTPUT_JSON_DIR",
        "FINANCIAL_FIELDS_JSON",
        "INDUSTRIAL_FIELDS_ZH_JSON",
        "SQL_DIR",
        mode="before",
    )
    @classmethod
    def parse_path(cls, v):
        return Path(v) if v else v

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def split_origins(cls, v):
        if isinstance(v, str):
            return [s.strip() for s in v.split(",") if s.strip()]
        return v

    @property
    def is_dev(self) -> bool:
        return self.ENV.strip().lower() == "dev"

    @property
    def auth_enabled(self) -> bool:
        """True when AUTH_PASSWORD is set (login required)."""
        return bool((self.AUTH_PASSWORD or "").strip())

    def ensure_dirs(self) -> None:
        self.DB_PATH.parent.mkdir(parents=True, exist_ok=True)
        self.DEFAULT_EXPORT_DIR.mkdir(parents=True, exist_ok=True)
        self.OUTPUT_JSON_DIR.mkdir(parents=True, exist_ok=True)


settings = Settings()
settings.ensure_dirs()
