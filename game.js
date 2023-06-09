class Example extends Phaser.Scene {

    addPlayer(playerInfo) {
        this.player.setBounce(0.2);
        this.player.setCollideWorldBounds(true);
        this.physics.add.collider(this.player, this.platforms);
    }

    addOtherPlayers(playerInfo) {
        var player = this.physics.add.sprite(100, 450, 'dude');
        player.setBounce(0.2);
        player.setCollideWorldBounds(true);
        this.physics.add.collider(player, this.platforms);
        player.id = playerInfo.id;
        this.otherPlayers.add(player);
    }

    playerMoved(data) {
        console.log(this.otherPlayers[data.id]);
        if (this.otherPlayers[data.id]) {
            this.otherPlayers[data.id].setPosition(data.x, data.y);
        }
    }

    preload() {
        this.load.image('box', 'assets/box-item-boxed.png');
        this.load.image('sky', 'assets/sky.png');
        this.load.image('bomb', 'assets/bomb.png');
        this.load.image('ground', 'assets/platform.png');
        this.load.image('star', 'assets/star.png');
        this.load.spritesheet('boom', 'assets/explosion.png', {frameWidth: 64, frameHeight: 64, endFrame: 23});
        this.load.spritesheet('dude', 'assets/dude.png', {
            frameWidth: 32,
            frameHeight: 48
        });
    }

    create() {
        this.createAnims();
        this.add.image(400, 300, 'sky');

        this.platforms = this.physics.add.staticGroup();
        this.platforms.create(400, 568, 'ground').setScale(2).refreshBody();
        this.player = this.physics.add.sprite(100, 450, 'dude');
        this.explosion = this.add.sprite(0, 0, 'boom').setVisible(false);
        this.otherPlayers = this.add.group();
        this.bombs = this.physics.add.group();
        this.boxes = this.add.group();
        this.socket = io();
        const self = this;

        this.socket.on("currentPlayers", function (players) {
            Object.keys(players).forEach(function (id) {

                console.log(self.socket.id);
                if (players[id].id === self.socket.id) {
                    self.addPlayer(players[id]);
                } else {
                    self.addOtherPlayers(players[id]);
                }
            });
        });

        this.socket.on("newPlayer", function (playerInfo) {
            self.addOtherPlayers(playerInfo);
        });


        this.socket.on('playerDisconnect', function (playerId) {
            console.log(self.otherPlayers);
            self.otherPlayers.getChildren().forEach(function (otherPlayer) {
                if (playerId === otherPlayer.id) {
                    otherPlayer.destroy();
                }
            });
        });

        this.socket.on('playerMoved', function (data) {
            self.otherPlayers.getChildren().forEach(function (otherPlayer) {
                if (data.player.id === otherPlayer.id) {
                    if (data.anim === 'turn')
                        otherPlayer.anims.play(data.anim)
                    else otherPlayer.anims.play(data.anim, true)
                    otherPlayer.setPosition(data.player.x, data.player.y);
                }
            });
        });

        this.socket.on('currentBombs', function (bombs) {
            // Создание спрайтов для каждой бомбы и добавление их в группу

            Object.values(bombs).forEach(function (bomb) {
                var sprite = self.physics.add.sprite(bomb.x, bomb.y, 'bomb');
                sprite.id = bomb.id;
                self.bombs.add(sprite);
                sprite.setBounce(0.8);
                sprite.setCollideWorldBounds(true);
                sprite.setVelocityX(50);
            });
            self.physics.add.collider(self.bombs, self.platforms);
        });

        this.socket.on('currentBoxes', function (boxes) {
            Object.values(boxes).forEach(function (box) {
                var sprite = self.physics.add.staticSprite(box.x, box.y, 'box');
                sprite.id = box.id;
                self.boxes.add(sprite);
            });
        });


        this.socket.on('bombsMovement', function (bombsData) {
            console.log(bombsData);
            console.log(self.bombs.getChildren());
            bombsData.forEach(function (bombData) {
                self.bombs.getChildren().forEach(function (bomb) {
                    if (bomb.id === bombData.id) {
                        bomb.setPosition(bombData.x, bombData.y);
                        bomb.setVelocityX(bombData.velocityX);
                    }
                });
            });
        });


        this.socket.on('destroyBomb', function (id) {
            self.bombs.getChildren().forEach(function (bomb) {
                if (bomb.id === id) {
                    console.log('Клиент уничтожение бомбы: ' + bomb);
                    self.explosion.copyPosition(bomb).play('explode');
                    bomb.destroy();
                }
            });

        });

        this.socket.on('destroyBox', function (data) {
            self.boxes.getChildren().forEach(function (box) {
                if (box.id === data.id) {
                    const player = self.otherPlayers.getChildren()[0]
                    player.setTintFill(0xffff00);
                    box.destroy();
                    self.time.delayedCall(5000, () => {
                        player.clearTint();
                    });
                }
            });

        });


        this.bombsCollider = this.physics.add.overlap(this.player, this.bombs, (player, bomb) => {
            this.explosion.copyPosition(bomb).play('explode');
            bomb.destroy();
            this.socket.emit('destroyBomb', bomb.id);
        });

        this.physics.add.overlap(this.player, this.boxes, (player, box) => {
            this.socket.emit('destroyBox', {id: box.id, player: player});
            this.bombsCollider.active = false;
            player.setTintFill(0xffff00);

            box.destroy();
            this.time.delayedCall(5000, () => {
                this.bombsCollider.active = true;
                player.clearTint();
            });
        });


        this.cursors = this.input.keyboard.createCursorKeys();
    }

    update() {
        const {left, right, up} = this.cursors;
        var anim = '';
        if (left.isDown) {
            this.player.setVelocityX(-160);
            anim = 'left'
            this.player.anims.play('left', true);
        } else if (right.isDown) {
            this.player.setVelocityX(160);
            anim = 'right'
            this.player.anims.play('right', true);
        } else {
            this.player.setVelocityX(0);
            anim = 'turn'
            this.player.anims.play('turn');
        }

        if (up.isDown && this.player.body.touching.down) {
            this.player.setVelocityY(-330);
        }

        this.socket.emit('playerMovement', {x: this.player.x, y: this.player.y, anim: anim});
        const bombsData = this.serializeBombsData(this.bombs.getChildren());
        this.socket.emit('bombsMovement', bombsData);
    }

    serializeBombsData(bombs) {
        const bombsData = [];
        bombs.forEach(bomb => {
            const bombData = {
                x: bomb.x,
                y: bomb.y,
                id: bomb.id,
                velocityX: bomb.body.velocity.x
            };
            bombsData.push(bombData);
        });
        return bombsData;
    }

    createAnims() {
        this.anims.create({
            key: 'explode',
            frames: 'boom',
            frameRate: 20,
            showOnStart: true,
            hideOnComplete: true
        });

        this.anims.create({
            key: 'left',
            frames: this.anims.generateFrameNumbers('dude', {start: 0, end: 3}),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'turn',
            frames: [{key: 'dude', frame: 4}],
            frameRate: 20
        });

        this.anims.create({
            key: 'right',
            frames: this.anims.generateFrameNumbers('dude', {start: 5, end: 8}),
            frameRate: 10,
            repeat: -1
        });
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'phaser-example',
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
            gravity: {y: 300}
        }
    },
    scene: Example
};

const game = new Phaser.Game(config);
