from flask import Blueprint, request, jsonify, session
from .. import db
from ..models import Users

auth_bp = Blueprint('auth_bp', __name__, url_prefix='/api/auth')

# TODO: Remove test user credentials before going live
TEST_USER_EMAIL = 'magnec@example.com'
TEST_USER_PASSWORD = 'magnecpwd' 

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    if email == TEST_USER_EMAIL and password == TEST_USER_PASSWORD:
        user = db.session.query(Users).filter_by(email=email).first()
        if user:
            session['user_id'] = user.id
            session['username'] = user.username
            session['email'] = user.email
            print(f"Login successful for user {user.id} ({user.email}). Session: {session}")
            return jsonify({
                "id": user.id,
                "username": user.username,
                "email": user.email
            }), 200
        else:
            return jsonify({"error": "User not found in database despite matching test credentials"}), 500
    else:
        return jsonify({"error": "Invalid email or password"}), 401

@auth_bp.route('/logout', methods=['POST'])
def logout():
    user_id = session.get('user_id')
    if user_id:
        print(f"Logging out user {user_id}. Clearing session.")
    session.pop('user_id', None)
    session.pop('username', None)
    session.pop('email', None)
    return jsonify({"message": "Logout successful"}), 200

@auth_bp.route('/session', methods=['GET'])
def check_session():
    user_id = session.get('user_id')
    if user_id:
        user = db.session.query(Users).get(user_id)
        if user:
            return jsonify({
                "isLoggedIn": True,
                "user": {
                "id": user.id,
                "username": session.get('username'), 
                "email": session.get('email')
                }
            }), 200
        else:
            session.clear()
    
    return jsonify({"isLoggedIn": False, "user": None}), 200 