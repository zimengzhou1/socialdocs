let expect = require('chai').expect
    , socketAPI = require('../socketAPI')
    , http = require('http')
    , io = socketAPI.io
    , sender
    , receiver

describe("SocketIO Server Tests", function(){
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

    it('Test emitting `new_message` message', function(done) {
        const senderInput = "hello";
        const senderId = "1234";
        const senderUsername = "sender"

        sender.emit('new_message', {inputToAdd: senderInput, id: senderId, username: senderUsername})
		receiver.on('new_message', (data) => {
            try {
            expect(data.inputToAdd).to.equal(senderInput, "Input message recieved should be the same as sent")
            expect(data.id).to.equal(senderId, "Input id recieved should be the same as sent")
            expect(data.username).to.equal(senderUsername, "Input username recieved should be the same as sent")
            done();
            } catch(error) {
                done(error);
            }
        });
        
	});

    it('Test emitting `new_position` message', function(done) {
        const senderX = "12345";
        const senderY = "54321";
        const senderId = "1234"
        const senderUsername = "username"
        
        sender.emit('new_position', {left: senderX, top: senderY, id : senderId, username: senderUsername})
		receiver.on('new_position', (data) => {
            try{
                expect(data.left).to.equal(senderX, "Input left-coord recieved should be the same as sent")
                expect(data.top).to.equal(senderY, "Input right-coord recieved should be the same as sent")
                expect(data.id).to.equal(senderId, "Input id recieved should be the same as sent")
                expect(data.username).to.equal(senderUsername, "Input username recieved should be the same as sent")
                done();
            } catch(error) {
                done(error);
            }
        });
        
	});

    it('Test emitting `remove elem` message', function(done) {
        const senderIdValue = "12345";

        sender.emit('remove_elem', {idValue: senderIdValue})
		receiver.on('remove_elem', (data) => {
            try {
                expect(data.idValue).to.equal(senderIdValue, "Input id recieved should be the same as sent")
                done();
            } catch(error) {
                done(error);
            }
        });
	});
})

