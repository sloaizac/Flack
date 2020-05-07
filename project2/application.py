import os

from datetime import datetime
from flask import Flask, render_template, redirect, url_for, request, jsonify
from flask_socketio import SocketIO, emit, join_room, leave_room, send

app = Flask(__name__, template_folder="./templates")
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

rooms = ['general']
messages_data = []

@app.route("/")
def index():
    return render_template("index.html", channels=rooms)

@app.route("/get-messages", methods=['POST'])
def getMessages():
    room = request.form.get("room")
    index = rooms.index(room)
    if len(messages_data) > index:
        data = messages_data[index]
    else:
        data = []
    return jsonify(messages=data)

@socketio.on('join')
def join(data):
    username = data['username']
    room = data['room']
    join_room(room)
    socketio.emit('join-noti', {'username': username, 'room': room}, room=room)

@socketio.on('leave')
def leave(data):
    room = data['room']
    username = data['username']
    leave_room(room)
    socketio.emit('leave-room', {'username': username, 'room': room}, room=room)

@socketio.on('create')
def create(data):
    room_name =  data['room-name']
    username = data['username']
    try:
        if rooms.index(room_name):
            socketio.emit('error', {'message': 'channel name not aviable', 'username': username}, broadcast=True)
    except:
        rooms.append(room_name)
        socketio.emit('new-channel', {'channel': room_name}, broadcast=True)

@socketio.on('message')
def recived(data):
    msg =  data['message']
    username =  data['username']
    room = data['room']
    index = rooms.index(room)
    if len(messages_data) == 100:
        messages_data.pop(0)
    if len(messages_data) > index:
        messages_data[index].append({'username': username, 'message': msg , 'date': datetime.now().strftime("%d/%m %H:%M")})
    else:
        messages_data.append([{'username': username, 'message': msg, 'date': datetime.now().strftime("%d/%m %H:%M")}])
    socketio.emit('message-reply', {'username': username, 'message': msg, 'date': datetime.now().strftime("%d/%m %H:%M")}, room=room)
