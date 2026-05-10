from .base import *  # noqa: F401, F403

DEBUG = True

# Relax DB path for local development (outside Docker)
from pathlib import Path as _Path  # noqa: E402
import os as _os

_LOCAL_DATA = _Path(__file__).resolve().parent.parent.parent.parent / "data"
_LOCAL_DATA.mkdir(exist_ok=True)

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": _LOCAL_DATA / "db.sqlite3",
    }
}
