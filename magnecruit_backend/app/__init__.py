from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_socketio import SocketIO
from flask_cors import CORS
from config import config

db = SQLAlchemy()
migrate = Migrate()
socketio = SocketIO()
cors = CORS()

def create_app(config_name='default'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])

    db.init_app(app)
    migrate.init_app(app, db)
    socketio.init_app(app, async_mode='eventlet', cors_allowed_origins="*")
    cors.init_app(app, resources={r"/api/*": {"origins":"*"}})
    from . import websockets
    return app

