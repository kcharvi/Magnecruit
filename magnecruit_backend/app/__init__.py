# magnecruit_backend\app\__init__.py

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
    
    allowed_origins_str = app.config.get('ALLOWED_ORIGINS', 'http://localhost:5173')
    allowed_origins_list = [origin.strip() for origin in allowed_origins_str.split(',')]
    
    print(f"Configuring CORS for origins: {allowed_origins_list}")
    cors.init_app(app, resources={r"/api/*": {"origins": allowed_origins_list}}, supports_credentials=True)
    
    from .routes import chat_routes, auth_routes, job_sections_routes
    from . import websockets 

    app.register_blueprint(chat_routes.chat_bp, url_prefix='/api/chat')
    app.register_blueprint(auth_routes.auth_bp, url_prefix='/api/auth')
    app.register_blueprint(job_sections_routes.job_sections_bp, url_prefix='/api/job-ssections')
    
    return app

