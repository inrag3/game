var express = require('express')
app = express()
server = require('http').createServer(app)
var io = require('socket.io')(server)
app.use(express.static(__dirname))
server.listen(80)
console.log('Server has started')

var players = {};

io.on('connection', function (socket) {
    console.log('A user connected: ' + socket.id);

    var player = {
        id: socket.id,
        x: 0,
        y: 0
    };
    players[socket.id] = player;

    socket.on('playerMovement', function (movementData) {
	  players[socket.id].x = movementData.x;
	  players[socket.id].y = movementData.y;
	  // отправляем общее сообщение всем игрокам о перемещении игрока
	  socket.broadcast.emit('playerMoved', players[socket.id]);
	});

    socket.on('disconnect', function () {
        console.log('A user disconnected: ' + socket.id);
        delete players[socket.id];
        // отправляем сообщение всем игрокам, чтобы удалить этого игрока
        socket.broadcast.emit('playerDisconnect', socket.id);
    });

    // отправляем объект players новому игроку
    socket.emit('currentPlayers', players);
    // обновляем всем другим игрокам информацию о новом игроке
    socket.broadcast.emit('newPlayer', player);
});

