# magnecruit_backend\run.py

import os
from app import create_app, db, socketio
from app.models import (
    User,
    Conversation,
    Message,
    Sequence,
    SequenceStep,
    UserPreference
)

app = create_app(os.getenv('FLASK_CONFIG') or 'default')

@app.shell_context_processor
def make_shell_context():
    return dict(db=db,
                User=User,
                Conversation=Conversation,
                Message=Message,
                Sequence=Sequence,
                SequenceStep=SequenceStep,
                UserPreference=UserPreference)

if __name__ == '__main__':
    socketio.run(app, debug=app.config.get('DEBUG', False))