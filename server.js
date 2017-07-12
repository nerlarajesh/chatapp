var express = require('express');
var path = require('path');
var fs = require("fs");
var bodyParser = require('body-parser');
var multer = require('multer');
var app = express();
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
var storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './uploads/');
    },
    filename: function(req, file, cb) {
        var ext = require('path').extname(file.originalname);
        ext = ext.length > 1 ? ext : "." + require('mime').extension(file.mimetype);
        require('crypto').pseudoRandomBytes(16, function(err, raw) {
            cb(null, (err ? undefined : file.originalname));
        });
    }
});

var upload = multer({ storage: storage });
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
users = [];
connections = [];
server.listen(process.env.PORT || 3000);
console.log('server running ..');
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});
app.post('/upload', upload.any(), function(req, res, next) {
    io.sockets.emit('file upload', req.files[0].originalname);
    return false;
});
io.sockets.on('connection', function(socket) {
    connections.push(socket);
    console.log('Connected: %s sockets conected',
        connections.length);
    // Disconnect
    socket.on('disconnect', function(data) {
        users.splice(users.indexOf(socket.username), 1);
        updateUsernames();
        connections.splice(connections.indexOf(socket), 1);
        console.log('Disconnected:%s sockets conected',
            connections.length);
        io.sockets.emit('user disconnected', socket.username);
    });
    socket.on('send message', function(data) {
        io.sockets.emit('new message', { msg: data, user: socket.username });
    });
    //New User
    socket.on('new user', function(data, callback) {
        callback(true);
        socket.username = data;
        users.push(socket.username);
        updateUsernames();
    });
    socket.on('typing', function(data) {
        socket.broadcast.emit('typing', data);
    });

    function updateUsernames() {
        io.sockets.emit('get users', users);
    }
});