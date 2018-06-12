const PORT = process.env.PORT || 3000;

var express = require('express');
var app = express(),

    server = require('http').createServer(app),

    io = require('socket.io').listen(server),

    ent = require('ent'), // Permet de bloquer les caractères HTML (sécurité équivalente à htmlentities en PHP)

    fs = require('fs');
	

// Chargement de la page index.html

app.get('/', function (req, res) {

  res.sendfile(__dirname + '/index.html');

})

.use(express.static(__dirname + '/public'));


			
io.sockets.on('connection', function (socket) {
	
	var id_game, players, scores;
	
	function exist_set() {
		var board = socket.board;
		var len = board.length;
		console.log('exist_set() : len = ' + len);
		
		for(var i=0; i<len-2; i++) {
			for(var j=i+1; j<len; j++) {
				//Calcul du complémentaire à i et j
				var compl = '';
				/*for (var k=0; k=3; k++) {
					console.log('k=' + k);
					if(board[i][k] == board[j][k]) {
						compl += board[i][k];
					} else {
						compl += (3 - parseInt(board[i][k]) - parseInt(board[j][k])).toString();
					}
				}*/
				
				if(board[i][0] == board[j][0]) {
						compl += board[i][0];
				} else {
					compl += (3 - parseInt(board[i][0]) - parseInt(board[j][0])).toString();
				}
				
				if(board[i][1] == board[j][1]) {
						compl += board[i][1];
				} else {
					compl += (3 - parseInt(board[i][1]) - parseInt(board[j][1])).toString();
				}
				
				if(board[i][2] == board[j][2]) {
						compl += board[i][2];
				} else {
					compl += (3 - parseInt(board[i][2]) - parseInt(board[j][2])).toString();
				}
				
				if(board[i][3] == board[j][3]) {
						compl += board[i][3];
				} else {
					compl += (3 - parseInt(board[i][3]) - parseInt(board[j][3])).toString();
				}
				
				if(board.indexOf(compl) != -1) {
					console.log('set : ' + i + ',' + j + ',' + board.indexOf(compl));
					return true;
				}
			}
		}
					
		return false;
	}

	function create_deck() {
		
		var deck = [];
		
		for (var i=0;i<81;i++) {
			var card = i.toString(3);
			
			//Zero padding
			while(card.length<4) {
				card = '0' + card;
			}
			
			deck.push(card);
		}
		
		return deck;
	}
	
	console.log('Un client se connecte');
	
	socket.on('message', function(message) {
		console.log('On reçoit le message : ' + message);
	});


	socket.on('new_game', function(pseudo) {
		
		id_game = Math.floor((Math.random() * 1000)+1).toString(); // Génération de l'id de la partie
		
		socket.join(id_game);
		
		socket.adapter.rooms[id_game].players = [pseudo];
		socket.adapter.rooms[id_game].scores = [0];
		socket.adapter.rooms[id_game].owner = socket.id;
		socket.adapter.rooms[id_game].board = [];
		socket.adapter.rooms[id_game].deck = create_deck();
		
		console.log('New game created by ' + pseudo + ', id : ' + id_game);
		
		socket.emit('game_created', id_game);
		
		
	});
	

	socket.on('new_play', function(pseudo) {
		

		
		console.log('New game created by ' + pseudo);
		

		
		
	});
	

    

});



server.listen(PORT);

