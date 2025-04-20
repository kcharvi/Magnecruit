from . import db

from datetime import datetime

class User(db.Model):
    __tablename__ = 'user'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=True)
    email = db.Column(db.String(120), unique=True, nullable=True)
    conversations = db.relationship('Conversation', backref='user', lazy=True)
    sequences = db.relationship('Sequence', backref='user', lazy=True)
    preferences = db.relationship('UserPreference', backref='user', lazy=True)
    created_at = db.Column(db.DateTime, default=datetime)

    def __repr__(self):
        return f'<User {self.username}>'

class Conversation(db.Model):
    __tablename__ = 'conversation'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(255), nullable=True)
    messages = db.relationship('Message', backref='conversation', lazy=True, cascade="all, delete-orphan")
    sequence = db.relationship('Sequence', backref='conversation', uselist=False, lazy=True, cascade="all, delete-orphan")
    created_at = db.Column(db.DateTime, default=datetime)

    def __repr__(self):
        return f'<Conversation {self.id}>'

class Message(db.Model):
    __tablename__ = 'message'
    id = db.Column(db.Integer, primary_key=True)
    conversation_id = db.Column(db.Integer, db.ForeignKey('conversation.id'), nullable=False)
    sender = db.Column(db.String(10), nullable=False) 
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime)

    def __repr__(self):
        return f'<Message {self.id} from {self.sender}>'

class Sequence(db.Model):
    __tablename__ = 'sequence'
    id = db.Column(db.Integer, primary_key=True)
    conversation_id = db.Column(db.Integer, db.ForeignKey('conversation.id'), unique=True, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    name = db.Column(db.String(255), nullable=True)
    description = db.Column(db.Text, nullable=True)
    steps = db.relationship('SequenceStep', backref='sequence', lazy=True, cascade="all, delete-orphan", order_by="SequenceStep.step_number")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<Sequence {self.name}>'

class SequenceStep(db.Model):
    __tablename__ = 'sequence_step'
    id = db.Column(db.Integer, primary_key=True)
    sequence_id = db.Column(db.Integer, db.ForeignKey('sequence.id'), nullable=False)
    step_number = db.Column(db.Integer, nullable=False)
    channel = db.Column(db.String(50), nullable=False)
    delay_days = db.Column(db.Integer, nullable=True)
    subject = db.Column(db.String(255), nullable=True)
    body = db.Column(db.Text, nullable=False)

    def __repr__(self):
        return f'<SequenceStep {self.step_number} for Sequence {self.sequence_id}>'

class UserPreference(db.Model):
    __tablename__ = 'user_preference'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    key = db.Column(db.String(100), nullable=False)
    value = db.Column(db.Text, nullable=False)

    __table_args__ = (db.UniqueConstraint('user_id', 'key', name='_user_key_uc'),)

    def __repr__(self):
        return f'<UserPreference {self.key} for User {self.user_id}>'