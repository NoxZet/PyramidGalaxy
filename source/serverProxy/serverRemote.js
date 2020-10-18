if (typeof module === 'object' && typeof module.exports === 'object') {
	throw new TypeError(`Not available in node`);
}

class ServerRemote {
	constructor(session, username, password) {
		this.session = session;
		this.username = username;
		this.password = password;
		this.connected = false;
		let loc = window.location.href;
		loc = loc.substring(0, loc.lastIndexOf('/') + 1);
		if (loc.search(/http:\/\//) === 0) {
			this.wsLoc = loc.replace(/http:\/\//, 'ws://');
		}
		else if (loc.search(/https:\/\//) === 0) {
			this.wsLoc = loc.replace(/https:\/\//, 'wss://');
		}
		else {
			this.wsLoc = null;
		}
	}
	/** Connects to a remote game or creates a local game, returns promise */
	connect() {
		if (!this.wsLoc) {
			return Promise.reject('Bad address');
		}
		const self = this;
		return new Promise((resolve, reject) => {
			const eventCallbacks = [];
			self.addEventCallbackInner = (cb) => {
				eventCallbacks.push(cb);
			};
			// Opens WebSocket
			const socket = new WebSocket(self.wsLoc, 'pyra-gala-server');
			socket.onopen = (e) => {
				socket.send(`c,${self.session},${self.username},${self.password}`);
			};
			// Handles messages - successful connect (c), reject (r) and others
			socket.onmessage = (e) => {
				let split = e.data.split(',');
				if (split.length > 3) {
					let end = split.splice(2).join(',');
					split[2] = end;
				}
				if (split[0] === 'r') {
					reject(`Server error: {split[1]}`);
				}
				else if (split[0] === 'c') {
					self.connected = true;
					resolve(parseInt(split[1]));
				}
				else if (self.connected) {
					let event = new EventServer(...split);
					for (let cb of eventCallbacks) {
						cb(event);
					}
				}
			}
			function onError() {
				if (self.connected) {
					for (let cb of eventCallbacks) {
						cb(new EventServer('d', 'Connection closed'));
					}
				}
				else {
					reject(`WebSocket error: {e.message}`);
				}
			}
			// Handles connection not being established
			socket.onerror = (e) => {
				onError;
			}
			socket.onclose = (e) => {
				onError;
			}
			self.sendUserEventInner = (ue) => {
				socket.send(ue.toString());
			};
			self.disconnectInner = () => {
				if (self.connected) {
					socket.close();
					self.connected = false;
				}
			}
		});
	}
	/** Disconnects from a remote game or closes a local game */
	disconnect() {
		if (self.connected) {
			self.disconnectInner();
		}
	}
	/** Add event callback */
	addEventCallback(cb) {
		this.addEventCallbackInner(cb);
	}
	/** Send user interaction event */
	sendUserEvent(ue) {
		this.sendUserEventInner(ue);
	}
	/** Tick on local, send periodic messages on server */
	tick(frame) {
		// Don't do anything
	}
}