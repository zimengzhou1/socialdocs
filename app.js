var PORT = process.env.PORT || 3000;
const express = require('express');
const app = express();

var http = require('http');
var server = http.Server(app);

//set template engine ejs
app.set('view engine', 'ejs');

//middlewares
app.use(express.static('public'));

//routes
app.get('/', (req, res) => {
    res.render('index')
});

//Listen on port 3000 or whatever the hell heroku does
server.listen(PORT);

//socket.io instantiation
const io = require("socket.io")(server)

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

    //listen on new_message (typing)
    socket.on('new_message', (data) => {
        //broadcast the new message
        console.log(data);
        socket.broadcast.emit('new_message', {inputToAdd : data.inputToAdd, id: data.id, username: data.username});
    })

    socket.on('new_position', (data) => {
        //broadcast new position
        console.log(data);
        socket.broadcast.emit('new_position', {left : data.left, top : data.top, id : data.id})
    })

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
    /*
    //listen on typing
    socket.on('typing', (data) => {
        console.log(data);
    	socket.emit('typing', {message : data.message})
    })

    //listen on not typing
    socket.on('nottyping', () => {
    	socket.broadcast.emit('nottyping')
    })
    */
})