var PORT = process.env.PORT || 3000;
const express = require('express');
const app = express();

//set template engine ejs
app.set('view engine', 'ejs');

//middlewares
app.use(express.static('public'));

//routes
app.get('/', (req, res) => {
    res.render('index')
});

//Listen on port 3000 or whatever the hell heroku does
server = app.listen(PORT);

//socket.io instantiation
const io = require("socket.io")(server)


//listen on every connection
io.on('connection', (socket) => {
    console.log('New user connected')

    //listen on new_message
    socket.on('new_message', (data) => {
        //broadcast the new message
        console.log(data);
        socket.broadcast.emit('new_message', {inputToAdd : data.inputToAdd, id: data.id});
    })

    socket.on('new_position', (data) => {
        //broadcast new position
        console.log(data);
        socket.broadcast.emit('new_position', {left : data.left, top : data.top, id : data.id})
    })

    //listen on typing
    socket.on('typing', (data) => {
        console.log(data);
    	socket.emit('typing', {message : data.message})
    })

    //listen on not typing
    socket.on('nottyping', () => {
    	socket.broadcast.emit('nottyping')
    })
})