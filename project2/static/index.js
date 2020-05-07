const socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

const emojis = ['1F600', '1F601', '1F602', '1F603', '1F604', '1F605', '1F606', '1F607', '1F608',
                '1F609', '1F60A', '1F60B', '1F60C', '1F60D', '1F60E', '1F60F', '1F610', '1F611',
                '1F612', '1F613', '1F614', '1F615', '1F616', '1F617', '1F618', '1F617', '1F61A',
                '1F61B', '1F61C', '1F61D', '1F61E', '1F61F', '1F620', '1F621', '1F622', '1F623',
                '1F623', '1F624', '1F625', '1F626', '1F627', '1F628', '1F629', '1F62A', '1F62B',
                '1F62C', '1F62D', '1F62E', '1F62F', '1F630', '1F631', '1F631', '1F633', '1F634'];

const emojibox = document.createElement('div');

emojis.forEach(emoji => {
    let span = document.createElement('span');
    span.innerHTML = '&#x' + emoji + ';';
    emojibox.append(span);
});

document.querySelector('#emoji-box').append(emojibox);

const msg = document.getElementById("input-msg");
const user = document.getElementById("username");

document.addEventListener('DOMContentLoaded', () => {

    document.querySelector('i').onclick = () => {
        if(document.querySelector('#emoji-box').style.display == 'block'){
            document.querySelector('#emoji-box').style.display = 'none';
        }else{
            document.querySelector('#emoji-box').style.display = 'block';
        }       
    }

    document.querySelectorAll('span').forEach(e => {
        e.onclick = () => {
            msg.value += e.textContent
        }
    })


    if (!localStorage.getItem('channel')){
        localStorage.setItem('channel', 'general');
    }

    if (localStorage.getItem('username')) {
        userField();
        socket.emit('join', {
            username: localStorage.getItem('username'),
            room: localStorage.getItem('channel')
        });
        channelUpdate();
        getMessages();
    }


    socket.on('connect', () => {
        document.querySelector("#form").onsubmit = (e) => {
            e.preventDefault();
            let message = msg.value;
            if (validateUser()) {
                msg.value = '';
                socket.emit('message', { 'room': localStorage.getItem('channel'), 'username': localStorage.getItem('username'), 'message': message });
            } else {
                alert('User required');
            }
        }

        document.querySelector("#channel-form").onsubmit = (e) => {
            e.preventDefault();
            if (validateUser()) {
                socket.emit('create', { 'room-name': document.querySelector("#channel").value, 'username': localStorage.getItem('username') });
                document.querySelector("#channel").value = '';
            } else {
                alert('User required');
            }
        }

    })

    socket.on('message-reply', data => {
        printMessage(data);
    })

    socket.on('join-noti', data => {
        document.querySelector('#channel-name').innerHTML = 'Channel: ' + data.room
    })

    socket.on('leave-room', data => {
        console.log(data.username + ' leave ' + data.room);
    })

    socket.on('new-channel', data => {
        const div = document.createElement('div');
        div.innerHTML = data.channel;
        div.classList.add("channel");
        div.dataset.room = data.channel;
        div.setAttribute("name", "channel-box");
        document.querySelector("#main").append(div);
        channelUpdate();
    })

    socket.on('error', data => {
        if (data.username == localStorage.getItem('username')) {
            alert(data.message);
        }
    })
})

function validateUser() {
    if (localStorage.getItem('username')) {
        return true;
    } else {
        if (user.value.length > 0) {
            localStorage.setItem('username', user.value);
            socket.emit('join', {
                username: localStorage.getItem('username'),
                room: localStorage.getItem('channel')
            });
            userField();
            return true;
        }
    }
    user.autofocus = true;
    return false;
}

function userField() {
    user.readOnly = true;
    user.autofocus = false;
    user.classList.add('user-active');
    user.value = localStorage.getItem('username');
}

function channelUpdate() {
    document.getElementsByName("channel-box").forEach(element => {
        element.onclick = () => {
            if (element.dataset.room != localStorage.getItem('channel')) {
                socket.emit('leave', { 'room': localStorage.getItem('channel'), 'username': localStorage.getItem('username') })
                localStorage.setItem('channel', element.dataset.room);
                socket.emit('join', { 'room': localStorage.getItem('channel'), 'username': localStorage.getItem('username') });
                document.querySelector("#box-msg").innerHTML = '';
                getMessages();
            }
        }
    });
    return false;
}

function getMessages() {
    const request = new XMLHttpRequest();
    request.open('POST', '/get-messages');

    request.onload = () => {
        const data = JSON.parse(request.responseText);
        data.messages.forEach(m => {
            printMessage(m);
        })
    }

    const data = new FormData();
    data.append('room', localStorage.getItem('channel'));
    request.send(data);
    return false;
}

function printMessage(data){
    const div = document.createElement('div');
        div.innerHTML = '<strong>' + data.username + '</strong> : ' + data.message
        div.classList.add("message");
        if (data.username == localStorage.getItem('username')) {
            div.classList.add("my-message");
        }
        const span = document.createElement('span');
        span.innerHTML = data.date;
        div.append(span);
        document.querySelector("#box-msg").append(div);
}