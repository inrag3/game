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

    socket.on('playerMoved', function (data) {
        player.x = data.x;
        player.y = data.y;

        socket.broadcast.emit('playerMoved', {
            id: socket.id,
            x: player.x,
            y: player.y
        });
    });

    socket.on('disconnect', function () {
        console.log('A user disconnected: ' + socket.id);
        delete players[socket.id];
        socket.broadcast.emit('playerDisconnected', socket.id);
    });

    socket.emit('currentPlayers', players);
    socket.broadcast.emit('newPlayer', player);
});

