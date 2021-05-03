const expect = require('chai').expect;
const socketAPI = require('../socketAPI');
const http = require('http');

describe("socketio server tests", function(){
    let server = undefined;

    before(function(done) {
		server = http.createServer();
        server.listen(4242);
        var io = socketAPI.io;
        io.attach(server)

        // Finished beforeAll setup
        done();
	});

    after(function(done) {
		if (server) {
			server.on('close', () => { console.log('AFTER'); done(); });
			server.close(() => { console.log('CLOSING'); server.unref(); });
		}
	});

    it('Initial test', function(done) {
		const client = require('socket.io-client')('http://localhost:4242/');
		client.on('connection', () => console.log('Client connected'));
        done();

	});
})

