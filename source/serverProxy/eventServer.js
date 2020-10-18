class EventServer {
	constructor(unit, action, meta) {
		this._unit = unit;
		this._action = action;
		this._meta = meta;
	}
	get unit() {
		return (typeof this._unit === 'string' || typeof this._unit === 'number') ? this._unit : '';
	}
	get action() {
		return (typeof this._action === 'string' || typeof this._action === 'number') ? this._action : '';
	}
	get meta() {
		return (typeof this._meta === 'string' || typeof this._meta === 'number') ? this._meta : '';
	}
}

if (typeof module === 'object' && typeof module.exports === 'object') {
	module.exports = EventServer;
}