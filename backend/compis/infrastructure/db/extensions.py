from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy

from compis.infrastructure.db.models import Base

db = SQLAlchemy(model_class=Base)
migrate = Migrate()
