class User {
	constructor(id, name) {
		this.id = id;
		this.name = name;
		this.notified = false;
		this.cb = undefined;
	}
	removeEventCallback() {
		this.cb = undefined;
	}
	addEventCallback(cb) {
		this.cb = cb;
	}
	eventCallback(event) {
		if (typeof this.cb === 'function') {
			this.cb(event);
		}
	}
}

function userFactory() {
	return new User(...arguments);
}

if (typeof module === 'object' && typeof module.exports === 'object') {
	module.exports = userFactory;
}