const planetFactory = require('./planet.js');
const unitFactory = require('./units/unitFactory.js');
const userFactory = require('./user.js');
const worldFactory = require('./world.js');
const EventServer = require('./serverProxy/eventServer.js');

class Session {
	constructor() {
		this.world = worldFactory(planetFactory, unitFactory, userFactory);
		this.connected = {};
		this.frame = 0;
	}
	connect(username, cb) {
		const userId = this.world.connect(username);
		cb(new EventServer('c', userId));
		this.world.addEventCallback(userId, cb);
		this.connected[username] = userId;
		return userId;
	}
	disconnect(username) {
		this.world.disconnect(this.connected[username]);
		delete this.connected[username];
	}
	/** Send user interaction event */
	sendUserEvent(username, e) {
		const userId = this.connected[username];
		let split = e.split(',');
		if (split.length > 3) {
			let end = split.splice(2).join(',');
			split[2] = end;
		}
		this.world.sendUserEvent(userId, new EventServer(...split));
	}
	tick() {
		if (Object.keys(this.connected).length > 0) {
			this.world.tick(this.frame);
			this.frame++;
		}
	}
};

module.exports = Session;