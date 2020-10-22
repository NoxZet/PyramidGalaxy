if (typeof module === 'object' && typeof module.exports === 'object') {
	throw new TypeError(`Not available in node`);
}

class ServerLocal {
	constructor(username) {
		this.username = username;
		this.world = worldFactory(planetFactory, unitFactory, userFactory);
	}
	/** Connects to a remote game or creates a local game, returns promise */
	connect() {
		this.userId = this.world.connect(this.username);
		return Promise.resolve(this.userId);
	}
	/** Disconnects from a remote game or closes a local game */
	disconnect() {
		this.world.disconnect(this.userId);
	}
	/** Add event callback */
	addEventCallback(cb) {
		this.world.addEventCallback(this.userId, cb);
	}
	/** Send user interaction event */
	sendUserEvent(ue) {
		this.world.sendUserEvent(this.userId, ue);
	}
	/** Tick on local, send periodic messages on server */
	tick(frame) {
		this.world.tick(frame);
	}
}