require('rootpath')();
var express = require('express');
var app = express();
var session = require('express-session');
var bodyParser = require('body-parser');
var expressJwt = require('express-jwt');
var config = require('config.json');
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
users = [];
connections= [];
 
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({ secret: config.secret, resave: false, saveUninitialized: true }));
 
// use JWT auth to secure the api
app.use('/api', expressJwt({ secret: config.secret }).unless({ path: ['/api/users/authenticate', '/api/users/register'] }));
 
// routes
app.use('/login', require('./controllers/login.controller'));
app.use('/register', require('./controllers/register.controller'));
app.use('/app', require('./controllers/app.controller'));
app.use('/api/users', require('./controllers/api/users.controller'));
 
// make '/app' default route
app.get('/', function (req, res) {
    return res.redirect('/app');
});
 
// start server
server.listen(5000, function () {
    console.log('Server listening at localhost:' + server.address().port);
});

io.sockets.on('connection', function(socket){
    connections.push(socket);
    console.log("Connected: %s sockets connected", connections.length);

    //DisConnect
    socket.on("disconnect", function(data){
      users.splice(users.indexOf(socket.nickName), 1);
      updateUserNames();
      connections.splice(connections.indexOf(socket), 1);
      console.log("Disconnected %s sockets  connected", connections.length);
    });

    //Send Msg
    socket.on("send message", function(data){
    	console.log(data);
        io.sockets.emit("new message", {msg: data, user: socket.nickName});
    });

    //New User
     socket.on("new user", function(data, callback){
    	callback(true);
        socket.nickName = data;
        users.push(socket.nickName);
        updateUserNames();
    });

    function updateUserNames(){
        io.sockets.emit('get users', users);
    };
});
