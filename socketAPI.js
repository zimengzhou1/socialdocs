var socket_io = require('socket.io');
var io = socket_io();
var socketAPI = {};

socketAPI.io = io;

var numUsers = 0;
var usernames = [];

// Listen on every connection
io.on('connection', (socket) => {
    var addedUser = false;
    socket.on('add_user', (username) => {
        if (addedUser) return;

        // Store the username in the socket session for this client
        socket.username = username;
        ++numUsers;
        usernames.push(username);
        addedUser = true;
        
        // Client will send the "people online" message (quite redundant) and verify connected status
        socket.emit('login', {
        numUsers: numUsers
        });
        // Echo globally that a person has connected
        io.sockets.emit('user_joined', {
        username: socket.username,
        numUsers: numUsers,
        usernames: usernames
        });
    });

    socket.on('get usernames', () => {
        io.sockets.emit('user joined', {usernames: usernames});
    })

    // Listen on new_message (typing)
    socket.on('new_message', (data) => {
        // Broadcast the new message
        socket.broadcast.emit('new_message', {inputToAdd : data.inputToAdd, id: data.id, username: data.username});
    })

    socket.on('new_position', (data) => {
        // Broadcast new position
        socket.broadcast.emit('new_position', {left : data.left, top : data.top, id : data.id, username: data.username})
    })

    // removes elem globally when a user inputs more than 3 messages
    socket.on('remove_elem', (data) => {
        socket.broadcast.emit('remove_elem', {idValue: data.idValue})
    })

    socket.on('disconnect', () => {
        if (addedUser) {
          --numUsers;
          usernames = usernames.filter(e => e !== socket.username);
    
          socket.broadcast.emit('user_left', {
            username: socket.username,
            numUsers: numUsers
          });
        }
      });
})

module.exports = socketAPI;