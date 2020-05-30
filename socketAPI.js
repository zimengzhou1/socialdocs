var socket_io = require('socket.io');
var io = socket_io();
var socketAPI = {};

socketAPI.io = io;

var numUsers = 0;
var usernames = [];

//listen on every connection
io.on('connection', (socket) => {
    console.log('New user connected')

    var addedUser = false;
    socket.on('add user', (username) => {
        if (addedUser) return;

        // we store the username in the socket session for this client
        socket.username = username;
        ++numUsers;
        usernames.push(username);
        addedUser = true;
        
        // Client will send the "people online" message (quite redundant) and verify connected status
        socket.emit('login', {
        numUsers: numUsers
        });
        console.log("reached here")
        // echo globally that a person has connected
        io.sockets.emit('user joined', {
        username: socket.username,
        numUsers: numUsers,
        usernames: usernames
        });
    });

    socket.on('get usernames', () => {
        io.sockets.emit('user joined', {usernames: usernames});
    })

    //listen on new_message (typing)
    socket.on('new_message', (data) => {
        //broadcast the new message
        console.log(data);
        socket.broadcast.emit('new_message', {inputToAdd : data.inputToAdd, id: data.id, username: data.username});
    })

    socket.on('new_position', (data) => {
        //broadcast new position
        console.log(data);
        socket.broadcast.emit('new_position', {left : data.left, top : data.top, id : data.id, username: data.username})
    })

    // removes elem globally when a user inputs more than 3 messages
    socket.on('remove elem', (data) => {
        socket.broadcast.emit('remove elem', {idValue: data.idValue})
    })

    socket.on('kill message', (data) => {
        console.log("Server emitted kill message response")
        io.sockets.emit('kill message', { id: data.id})
    });

    socket.on('disconnect', () => {
        if (addedUser) {
          --numUsers;
          usernames = usernames.filter(e => e !== socket.username);
    
          socket.broadcast.emit('user left', {
            username: socket.username,
            numUsers: numUsers
          });
        }
      });
})

module.exports = socketAPI;