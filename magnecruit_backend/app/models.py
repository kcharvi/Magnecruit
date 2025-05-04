# magnecruit_backend\app\models.py

from . import db
from datetime import datetime

class Users(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=True)
    email = db.Column(db.String(120), unique=True, nullable=True)
    password_hash = db.Column(db.String(128), nullable=True)
    conversations = db.relationship('Conversations', backref='users', lazy=True)
    jobs = db.relationship('Jobs', backref='users', lazy=True)
    created_at = db.Column(db.DateTime, default=datetime)

    def __repr__(self):
        return f'<Users {self.username}>'

class Conversations(db.Model):
    __tablename__ = 'conversations'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(255), nullable=True)
    messages = db.relationship('Messages', backref='conversations', lazy=True, cascade="all, delete-orphan")
    jobs = db.relationship('Jobs', backref='conversations', uselist=False, lazy=True, cascade="all, delete-orphan")
    created_at = db.Column(db.DateTime, default=datetime)

    def __repr__(self):
        return f'<Conversations {self.id}>'

class Messages(db.Model):
    __tablename__ = 'messages'
    id = db.Column(db.Integer, primary_key=True)
    conversation_id = db.Column(db.Integer, db.ForeignKey('conversations.id'), nullable=False)
    sender = db.Column(db.String(10), nullable=False) 
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime)

    def __repr__(self):
        return f'<Messages {self.id} from {self.sender}>'

class Jobs(db.Model):
    __tablename__ = 'jobs'
    id = db.Column(db.Integer, primary_key=True)
    conversation_id = db.Column(db.Integer, db.ForeignKey('conversations.id'), unique=True, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    jobrole = db.Column(db.String(255), nullable=True)
    description = db.Column(db.Text, nullable=True)
    sections = db.relationship('JobSections', backref='jobs', lazy=True, cascade="all, delete-orphan", order_by="JobSections.section_number")
    created_at = db.Column(db.DateTime, default=datetime.now)

    def __repr__(self):
        return f'<Jobs {self.id or self.jobrole}>'

class JobSections(db.Model):
    __tablename__ = 'job_sections'
    id = db.Column(db.Integer, primary_key=True)
    job_id = db.Column(db.Integer, db.ForeignKey('jobs.id'), nullable=False)
    section_number = db.Column(db.Integer, nullable=False)
    heading = db.Column(db.String(255), nullable=True)
    body = db.Column(db.Text, nullable=False)

    def __repr__(self):
        return f'<JobSections {self.section_number} for Jobs {self.job_id}>'