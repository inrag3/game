class Example extends Phaser.Scene
{
 	
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
    }SS

    playerMoved(data) {
    	console.log(this.otherPlayers[data.id]);
        if (this.otherPlayers[data.id]) {
            console.log("Moved");
            this.otherPlayers[data.id].setPosition(data.x, data.y);
        }
    }

    preload ()
    {
        this.load.image('box', 'assets/box-item-boxed.png');
        this.load.image('sky', 'assets/sky.png');
        this.load.image('bomb', 'assets/bomb.png');
        this.load.image('ground', 'assets/platform.png');
        this.load.image('star', 'assets/star.png');
        this.load.spritesheet('boom', 'assets/explosion.png', { frameWidth: 64, frameHeight: 64, endFrame: 23 });
        this.load.spritesheet('dude', 'assets/dude.png', {
            frameWidth: 32,
            frameHeight: 48
        });
    }

    create ()
    {
        this.createAnims();
        this.add.image(400, 300, 'sky');
        const box = this.physics.add.staticImage(400, 450, 'box');
        this.platforms = this.physics.add.staticGroup();
        this.platforms.create(400, 568, 'ground').setScale(2).refreshBody();
        this.player = this.physics.add.sprite(100, 450, 'dude');
	this.otherPlayers = this.add.group();
        this.socket = io();
        const self = this;
	
	this.socket.on("currentPlayers", function(players) {
	      Object.keys(players).forEach(function(id) {
	        
	        console.log(self.socket.id);
		if (players[id].id === self.socket.id) {
		  self.addPlayer(players[id]);
		} else {
		  self.addOtherPlayers(players[id]);
		}
	      });
	    });
        
        this.socket.on("newPlayer", function(playerInfo) {
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
        
        this.socket.on('playerMoved', function (playerInfo) {
	  self.otherPlayers.getChildren().forEach(function (otherPlayer) {
	    if (playerInfo.id === otherPlayer.id) {
	      otherPlayer.setPosition(playerInfo.x, playerInfo.y);
	    }
	  });
	});
        
        this.explosion = this.add.sprite(0, 0, 'boom').setVisible(false);



	

        /*this.bombs = this.physics.add.group({
            key: 'bomb',
            quantity: 10,
            setXY: { x: 10, y: 10, stepX: 80, stepY: 40 },
            bounceX: 0.8,
            bounceY: 0.8,
            collideWorldBounds: true,
            velocityX: 50
        });


        this.physics.add.collider(this.bombs, this.platforms);
        */

        /*const bombsCollider = this.physics.add.overlap(this.player, this.bombs, (player, bomb) =>
        {
            this.explosion.copyPosition(bomb).play('explode');
            bomb.destroy();
        });

	
        this.physics.add.overlap(this.player, box, (player, _box) =>
        {
            bombsCollider.active = false;
            player.setTintFill(0xffff00);
            _box.destroy();
            this.time.delayedCall(5000, () =>
            {
                bombsCollider.active = true;
                player.clearTint();
            });
        });
        
        */
        
        
        this.cursors = this.input.keyboard.createCursorKeys();
    }

    update ()
    {
        const { left, right, up } = this.cursors;

        if (left.isDown)
        {
            this.player.setVelocityX(-160);

            this.player.anims.play('left', true);
        }
        else if (right.isDown)
        {
            this.player.setVelocityX(160);

            this.player.anims.play('right', true);
        }
        else
        {
            this.player.setVelocityX(0);

            this.player.anims.play('turn');
        }

        if (up.isDown && this.player.body.touching.down)
        {
            this.player.setVelocityY(-330);
        }
        
        this.socket.emit('playerMovement', { x: this.player.x, y: this.player.y});
    }

    createAnims ()
    {
        this.anims.create({
            key: 'explode',
            frames: 'boom',
            frameRate: 20,
            showOnStart: true,
            hideOnComplete: true
        });

        this.anims.create({
            key: 'left',
            frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'turn',
            frames: [ { key: 'dude', frame: 4 } ],
            frameRate: 20
        });

        this.anims.create({
            key: 'right',
            frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
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
            gravity: { y: 300 }
        }
    },
    scene: Example
};

const game = new Phaser.Game(config);
