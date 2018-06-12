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
	
	console.log('Un client se connecte');
	
	var id_game;
	
	function exist_set() {
		var board = socket.adapter.rooms[id_game].board;
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

	function is_set(i, j, k) {
		var res = parseInt(i) + parseInt(j) + parseInt(k);
		var d1 = Math.floor(res/1000),
			d2 = Math.floor((res%1000)/100),
			d3 = Math.floor((res%100)/10),
			d4 = res%10;
		
		return (d1%3 == 0 && d2%3 == 0 && d3%3 == 0 && d4%3 == 0);
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
	
	function create_game(pseudo) {
		
		socket.adapter.rooms[id_game].players = [pseudo];
		socket.adapter.rooms[id_game].scores = [0];
		socket.adapter.rooms[id_game].owner = socket.id;
		socket.adapter.rooms[id_game].board = [];
		socket.adapter.rooms[id_game].deck = create_deck();
		
		console.log('New game created by ' + pseudo + ', id : ' + id_game);
		
		socket.emit('game_created', id_game);
		send_players();
		
	}
	
	function send_players() {
		socket.emit('players', {players: socket.adapter.rooms[id_game].players.join(','), scores: socket.adapter.rooms[id_game].scores.join(',')});
		socket.to(id_game).emit('players', {players: socket.adapter.rooms[id_game].players.join(','), scores: socket.adapter.rooms[id_game].scores.join(',')});
	}
	
	function send_board() {
		socket.emit('board', socket.adapter.rooms[id_game].board.join(','));
		socket.to(id_game).emit('board', socket.adapter.rooms[id_game].board.join(','));
	}
	
	function send_end() {
		socket.emit('end', {players: socket.adapter.rooms[id_game].players.join(','), scores: socket.adapter.rooms[id_game].scores.join(',')});
		socket.to(id_game).emit('end', {players: socket.adapter.rooms[id_game].players.join(','), scores: socket.adapter.rooms[id_game].scores.join(',')});
		
		socket.adapter.rooms[id_game].players = [];
	}
	
	socket.on('message', function(message) {
		console.log('On reçoit le message : ' + message);
	});

	socket.on('new_game', function(pseudo) {
		
		id_game = Math.floor((Math.random() * 1000)+1).toString(); // Génération de l'id de la partie
		
		socket.join(id_game);
		
		create_game(ent.encode(pseudo));	
		
	});
	
	socket.on('new_player', function(data) {	

		console.log('Nouveau joueur ' + ent.encode(data.pseudo) + ' pour la partie ' + data.id);
		
		id_game = data.id;
		
		socket.join(id_game);
		
		//Check si la partie existe
		var game_exists = typeof socket.adapter.rooms[id_game].players != 'undefined';
		
		if (game_exists && socket.adapter.rooms[id_game].players.length > 0) {
			console.log('La game existe, on ajoute ' + ent.encode(data.pseudo));
			socket.adapter.rooms[id_game].players.push(ent.encode(data.pseudo));
			socket.adapter.rooms[id_game].scores.push(0);
			send_players();
		} else {
			//Créer la game
			console.log('La game n existe pas');
			
			create_game(ent.encode(data.pseudo));
		}
		
	});
	
	socket.on('begin', function() {
		
		console.log('Début de la partie : ' + id_game);
		socket.to(id_game).emit('begin', 'the game begin');
		socket.emit('begin', 'the game begin');		
		//Création du board
		var rand_card;
		
		//Génération du board
		
		for (var i=0; i<12; i++) {
				rand_card = Math.floor((Math.random() * socket.adapter.rooms[id_game].deck.length));
				socket.adapter.rooms[id_game].board.push(socket.adapter.rooms[id_game].deck[rand_card]);
				socket.adapter.rooms[id_game].deck.splice(rand_card,1);
		}
		
		while(!exist_set()) {
			
			//Remettre les cartes dans le deck
			socket.adapter.rooms[id_game].deck = socket.adapter.rooms[id_game].deck.concat(socket.adapter.rooms[id_game].board);
			socket.adapter.rooms[id_game].board = [];
			
			for (var i=0; i<12; i++) {
				rand_card = Math.floor((Math.random() * socket.adapter.rooms[id_game].deck.length));
				socket.adapter.rooms[id_game].board.push(socket.adapter.rooms[id_game].deck[rand_card]);
				socket.adapter.rooms[id_game].deck.splice(rand_card,1);
			}
		}
		
		send_board();
	});
    
	socket.on('set', function(data) {
		console.log('On recoit un set');
		
		var cards_to_remove = data.set.split(',');
		if (is_set(socket.adapter.rooms[id_game].board[cards_to_remove[0]], socket.adapter.rooms[id_game].board[cards_to_remove[1]], socket.adapter.rooms[id_game].board[cards_to_remove[2]])) {
			//Le traitement si on a un set
			
			//Ajout des points
			socket.adapter.rooms[id_game].scores[socket.adapter.rooms[id_game].players.indexOf(data.pseudo)]++;
			send_players();
			
			if (socket.adapter.rooms[id_game].deck.length == 0) {
				console.log('On va retirer : ' + cards_to_remove.join(','));
				console.log('Etat du board : ' + socket.adapter.rooms[id_game].board.join(','));
				
				//On trie dans l'ordre décroissant
				cards_to_remove[0] = parseInt(cards_to_remove[0]);
				cards_to_remove[1] = parseInt(cards_to_remove[1]);
				cards_to_remove[2] = parseInt(cards_to_remove[2]);
				
				cards_to_remove.sort(function(a, b){return b - a});
				
				//On retire les cartes du set trouvé
				cards_to_remove.forEach(function(card_remove) { 
					console.log('On retire ' + card_remove);
					socket.adapter.rooms[id_game].board.splice(parseInt(card_remove),1);
				});
				
				console.log('Après avoir retiré les cartes, il reste : ' + socket.adapter.rooms[id_game].board.length);
				console.log('Etat du board : ' + socket.adapter.rooms[id_game].board.join(','));
				if(exist_set()) {
					console.log('Plus de cartes, mais toujours un set');
					//on avertit tout le monde du changement
					send_board();
				} else {
					//Fin de la partie
					send_end();
				}
			} else if (socket.adapter.rooms[id_game].deck.length == 3) { //Cas où il reste que 3 cartes
				console.log('Reste 3 cartes');
				cards_to_remove.forEach(function(card) { //On change les cartes du set trouvé
					var new_card = Math.floor((Math.random() * socket.adapter.rooms[id_game].deck.length));
					socket.adapter.rooms[id_game].board.splice(parseInt(card),1,socket.adapter.rooms[id_game].deck[new_card]);
					socket.adapter.rooms[id_game].deck.splice(new_card,1);
				});
				
				if (exist_set()) { //Si il reste un set
				console.log('Et toujours un set');
					//on avertit tout le monde du changement
					send_board();
				} else {
					send_end();
				}
			} else { //Cas où il reste plein de cartes
				var board_tried = 0;
				console.log('Encore plein de cartes');
				var new_card0, new_card1, new_card2;
				
				do {
					new_card0 = Math.floor((Math.random() * socket.adapter.rooms[id_game].deck.length));
					socket.adapter.rooms[id_game].board.splice(parseInt(cards_to_remove[0]),1,socket.adapter.rooms[id_game].deck[new_card0]);
					socket.adapter.rooms[id_game].deck.splice(new_card0,1);                   

					new_card1 = Math.floor((Math.random() * socket.adapter.rooms[id_game].deck.length));             
					socket.adapter.rooms[id_game].board.splice(parseInt(cards_to_remove[1]),1,socket.adapter.rooms[id_game].deck[new_card1]);
					socket.adapter.rooms[id_game].deck.splice(new_card1,1);                   

					new_card2 = Math.floor((Math.random() * socket.adapter.rooms[id_game].deck.length));             
					socket.adapter.rooms[id_game].board.splice(parseInt(cards_to_remove[2]),1,socket.adapter.rooms[id_game].deck[new_card2]);
					
					//On rajoute les cartes au deck au cas où il n'y ait pas de set
					socket.adapter.rooms[id_game].deck.push(socket.adapter.rooms[id_game].board[parseInt(cards_to_remove[0])]);
					socket.adapter.rooms[id_game].deck.push(socket.adapter.rooms[id_game].board[parseInt(cards_to_remove[1])]);
					
					board_tried++;
				} while (!exist_set() && board_tried<100);
				
				socket.adapter.rooms[id_game].deck.pop();
				socket.adapter.rooms[id_game].deck.pop();
				socket.adapter.rooms[id_game].deck.splice(new_card2,1);
				
				if (board_tried == 100) {
					send_end();
				}
				
				//on avertit tout le monde du changement
				send_board();
			}
			
		}
	});
});



server.listen(PORT);

