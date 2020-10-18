const http = require('http');
const fs = require('fs');
const WebSocketServer = require('websocket').server;

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
	connection.on('message', function(message) {
		if (message.type === 'utf8') {
			console.log(request.remoteAddress + ' received message: ' + message.utf8Data);
			connection.sendUTF('yooooo, wassup wassup');
			//connection.sendUTF(message.utf8Data);
		}
		else if (message.type === 'binary') {
			console.log(request.remoteAddress + ' received binary message of ' + message.binaryData.length + ' bytes');
			connection.sendBytes(message.binaryData);
		}
	});
	connection.on('close', function(reasonCode, description) {
		console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
	});
});