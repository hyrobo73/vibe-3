from pathlib import Path


class Settings:
    app_name = "Public Admin RPA Hub API"
    base_dir = Path(__file__).resolve().parents[2]
    data_dir = base_dir / "data"
    database_path = data_dir / "app.sqlite3"
    cors_origins = ["http://127.0.0.1:5173", "http://localhost:5173"]


settings = Settings()
