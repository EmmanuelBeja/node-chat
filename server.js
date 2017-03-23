var express = require('express'), app = express();
var http = require('http')
  , server = http.createServer(app)
  , io = require('socket.io').listen(server);
var ejs = require('ejs');
var pseudoArray = ['admin']; //block admin username (you can disable it)

// Views
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.set("view options", { layout: false });

app.use(express.static(__dirname + '/public'));

// Render page
app.get('/', function(req, res){
  res.render('home.ejs');
});

//listen port
server.listen(process.env.PORT || 16000)
console.log("Server listening on port 16000");


// Handle the socket.io connections

var users = 0; //count the users

io.sockets.on('connection', function (socket) { // First connection
	users += 1; // Add 1 to the count
	reloadUsers(); // Send the count to all the users
	socket.on('message', function (data) { // Broadcast the message to all
		if(pseudoSet(socket))
		{
			var transmit = {date : new Date().toISOString(), pseudo : socket.nickname, message : data};
			socket.broadcast.emit('message', transmit);
			console.log("user "+ transmit['pseudo'] +" said \""+data+"\"");
		}
	});
	socket.on('setPseudo', function (data) { // Assign a name to the user
		if (pseudoArray.indexOf(data) == -1) // Test if the name is already taken
		{
			pseudoArray.push(data);
			socket.nickname = data;
			socket.emit('pseudoStatus', 'ok');
			console.log("user " + data + " connected");
		}
		else
		{
			socket.emit('pseudoStatus', 'error') // Send the error
		}
	});
	socket.on('disconnect', function () { // Disconnection of the client
		users -= 1;
		reloadUsers();
		if (pseudoSet(socket))
		{
			console.log("disconnect...");
			var pseudo;
			pseudo = socket.nickname;
			var index = pseudoArray.indexOf(pseudo);
			pseudo.slice(index - 1, 1);
		}
	});
});

function reloadUsers() { // Send the count of the users to all
	io.sockets.emit('nbUsers', {"nb": users});
}
function pseudoSet(socket) { // Test if the user has a name
	var test;
	if (socket.nickname == null ) test = false;
	else test = true;
	return test;
}
