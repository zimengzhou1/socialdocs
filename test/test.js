let expect = require('chai').expect
    , socketAPI = require('../socketAPI')
    , http = require('http')
    , io = socketAPI.io
    , sender
    , receiver

describe("socketio server tests", function(){
    let server = undefined;

    before(function(done) {
		server = http.createServer();
        server.listen(4242, () => { console.log("Setting up server")});
        io.attach(server)

        // Finished beforeAll setup
        done();
	});

    after(function(done) {
		if (server) {
			server.on('close', () => { done(); });
			server.close(() => { console.log('Closing server'); server.unref(); });
		}
	});

    beforeEach(function(done){
        // Create two clients
		sender = require('socket.io-client')('http://localhost:4242/');
        receiver = require('socket.io-client')('http://localhost:4242/');
        done()
    })

    afterEach(function(done){
        // Disconnect clients
        sender.disconnect()
        receiver.disconnect()
        done()
    })

    it('Test emit `new_message` message', function(done) {
        const senderInput = "hello";
        const senderId = "1234";
        const senderUsername = "sender"

        sender.emit('new_message', {inputToAdd: senderInput, id: senderId, username: senderUsername})
		receiver.on('new_message', (data) => {
            expect(data.inputToAdd).to.equal(senderInput, "Input message recieved should be the same as sent")
            expect(data.id).to.equal(senderId, "Input id recieved should be the same as sent")
            expect(data.username).to.equal(senderUsername, "Input username recieved should be the same as sent")
        });
        done();
	});
})

