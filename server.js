const http = require('http');
const fs = require('fs');
const WebSocketServer = require('websocket').server;
const { PerformanceObserver, performance } = require('perf_hooks');

const Session = require('./source/session.js')

const ipLog = {};

// Static serve
function getMime(file) {
    if (file.lastIndexOf('.') === -1) {
        return 'text/plain';
    }
    let ext = file.substring(file.lastIndexOf('.'));
    switch (ext) {
        case '.png':
            return 'image/png';
        case '.jpg': case '.jpeg':
            return 'image/jpeg';
        case '.gif':
            return 'image/gif';
        case '.ico':
            return 'image/x-icon';
        case '.svg':
            return 'image/svg+xml';
        case '.css':
            return 'text/css';
        case '.js':
            return 'text/javascript';
		case '.html': case '.htm':
			return 'text/html';
        default:
            return 'text/plain';
    }
}

async function handleServer(req, res) {
    let questPos = req.url.indexOf('?');
    let path = req.url.substring(1, questPos === -1 ? undefined : questPos);
	if (path === '') {
		path = 'index.html';
	}
	if (path.search(/data\//) !== 0 && path.search(/source\//) !== 0 && path !== 'client.js' && path !== 'index.html') {
		if (path.length >= 4 && path.search('.js') == path.length - 4) {
			path = 'data/' + path;
		}
	}
	let match = path.match(/\./g);
    if ((!match || match.length <= 1) && fs.existsSync(path)) {
		res.writeHead(200, {'Content-Type': getMime(path)});
		let stream = fs.createReadStream(path);
		stream.on('finish', function(){
			res.end();
		});
		stream.pipe(res);
    }
    else {
        res.writeHead(500, {'Content-Type': 'text/html'});
        res.end('Internal server error');
    }
}

const httpServer = http.createServer(function (req, res) {
	if (!ipLog['http-' + req.connection.remoteAddress]) {
		ipLog['http-' + req.connection.remoteAddress] = true;
		console.log('http: ' + req.connection.remoteAddress);
	}
	handleServer(req, res);
}).listen(80);

// WebSocket server
const wsServer = new WebSocketServer({
	httpServer: httpServer,
	autoAcceptConnections: false,
});

const sessions = {};

function setImmediatePromise() {
	return new Promise((resolve) => {
		setImmediate(resolve);
	});
}

let date = performance.now();
let frame = 0;
let fps = 60;
async function tickSessions() {
	while (true) {
		let now = performance.now();
		if (now < date + frame * 1000 / fps) {
			await setImmediatePromise();
		}
		else {
			for (let sessionId in sessions) {
				sessions[sessionId].tick();
			}
			frame++;
			if (frame >= fps) {
				frame -= 60;
				date += 1000;
			}
		}
	}
}

tickSessions();

wsServer.on('request', function(request) {
	if (!request.requestedProtocols.includes('pyra-gala-server')) {
		request.reject(undefined, 'Unspecified protocol');
		return;
	}
	var connection = request.accept('pyra-gala-server', request.origin);
	if (!ipLog['ws-' + connection.remoteAddress]) {
		ipLog['ws-' + connection.remoteAddress] = true;
		console.log('ws: ' + connection.remoteAddress);
	}
	
	let connected = undefined;
	let userId = undefined;
	let username = undefined;
	connection.on('message', (message) => {
		if (message.type === 'utf8') {
			const ue = message.utf8Data;
			if (typeof connected !== 'number') {
				let split = ue.split(',', 4);
				if (split[0] === 'c') {
					let sessionId = parseInt(split[1]);
					if (!sessions[sessionId]) {
						sessions[sessionId] = new Session();
					}
					connected = sessionId;
					username = split[2];
					userId = sessions[sessionId].connect(username, (e) => {
						//console.log('sending back: ' + e);
						connection.sendUTF(e.toString());
					});
				}
			}
			else {
				sessions[connected].sendUserEvent(username, message.utf8Data);
			}
			//console.log(request.remoteAddress + ' received message: ' + message.utf8Data);
		}
	});
	connection.on('close', function(reasonCode, description) {
		if (typeof connected === 'number') {
			userId = sessions[connected].disconnect(username);
		}
	});
});