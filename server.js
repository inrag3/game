var express = require('express')
app = express()
server = require('http').createServer(app)
var io = require('socket.io')(server)
app.use(express.static(__dirname))
server.listen(80)
console.log('Server has started')

var players = {};
var bombs = {};
var boxes = {};
var bombsOwner = null; // Идентификатор сокета клиента, владеющего бомбами


io.on('connection', function (socket) {
    console.log('A user connected: ' + socket.id);
    if (!bombsOwner) {
        bombsOwner = socket.id;
        for (var i = 0; i < 10; i++) {
            var x = 10 + i * 80;
            var y = 10 + i * 40;
            bombs[i] = {x: x, y: y, id: i};
        }
        boxes[0] = {x: 300, y: 450, id: 0};
        boxes[1] = {x: 400, y: 450, id: 1};
    }
    socket.emit('currentBombs', bombs);

    var player = {
        id: socket.id,
        x: 0,
        y: 0
    };
    players[socket.id] = player;

    socket.on('playerMovement', function (data) {
        players[socket.id].x = data.x;
        players[socket.id].y = data.y;
        // отправляем общее сообщение всем игрокам о перемещении игрока
        socket.broadcast.emit('playerMoved', {player: players[socket.id], anim: data.anim});
    });

    socket.on('bombsMovement', function (bombs) {
        if (bombsOwner === socket.id) {
            socket.broadcast.emit('bombsMovement', bombs);
        }
    });

    socket.on('destroyBomb', function (id) {
        console.log('Bomb destroy: ' + id);
        delete bombs[id]
        socket.broadcast.emit('destroyBomb', id);
    });


    socket.on('destroyBox', function (data) {
        console.log('Box destroy: ' + data.id);
        delete boxes[data.id]
        data = {id: data.id, playerId: socket.id};
        console.log(data);
        socket.broadcast.emit('destroyBox', data);
    });

    socket.on('disconnect', function () {
        console.log('A user disconnected: ' + socket.id);
        delete players[socket.id];
        // отправляем сообщение всем игрокам, чтобы удалить этого игрока
        socket.broadcast.emit('playerDisconnect', socket.id);

        if (socket.id === bombsOwner) {
            bombsOwner = null;
            const newOwner = players[Object.keys(players)[0]];
            if (newOwner) {
                bombsOwner = newOwner.id;
            }

        }
        console.log(bombsOwner);
    });

    // отправляем объект players новому игроку

    socket.emit('currentBoxes', boxes);
    socket.emit('currentPlayers', players);
    // обновляем всем другим игрокам информацию о новом игроке
    socket.broadcast.emit('newPlayer', player);
});

