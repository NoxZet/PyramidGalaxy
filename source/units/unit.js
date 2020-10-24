class Unit {
	constructor(id, owner, type, orbits, x, y, angular, size) {
		this.id = id;
		this.owner = owner;
		this.type = type;
		this.orbits = orbits;
		this.x = x;
		this.y = y;
		this.angular = angular;
		this.size = size;
		this.internal = undefined;
	}
	getCoords(unitArray=[]) {
		let x = 0;
		let y = 0;
		let angle = 0;
		if (typeof this.orbits === 'number' && unitArray[this.orbits]) {
			[x, y] = unitArray[this.orbits].getCoords(unitArray);
		};
		if (this.angular) {
			x += Math.sin(this.x) * this.y;
			y += -Math.cos(this.x) * this.y;
			angle = this.x;
		}
		else {
			x += this.x;
			y += this.y;
		}
		return [x, y, angle];
	}
	tick(frame) {
		if (this._internal && this._internal.tick) {
			return this._internal.tick(frame);
		}
	}
	set internal(v) {
		if (typeof v === 'object' && v !== null) {
			this._internal = v;
			v.unit = this;
		}
		else {
			this._internal = undefined;
		}
	}
	get internal() {
		return this._internal;
	}
	get eventExists() {
		return (
			'u'
			+ ';' + (this.angular ? '1' : '0')
			+ `;` + (typeof this.orbits === 'number' ? this.orbits : -1)
			+ `;${this.x};${this.y};${this.owner};${this.type};${this.size}`
			+ (this.internal && this.internal.eventExists ? (';' + this.internal.eventExists) : '')
		);
	}
	get eventUI() {
		return this.internal.eventUI ? this.internal.eventUI : '';
	}
	eventQueue(queue) {
		return this.internal.eventQueue ? this.internal.eventQueue(queue) : undefined;
	}
	eventMove(x, y, planet) {
		return this.internal.eventMove ? this.internal.eventMove(x, y, planet) : undefined;
	}
	eventLoad(action, arg) {
		if (this.internal.eventLoad && !this.internal.eventLoad(action, arg)) {
			switch (action) {
				case 'load': case 'unload':
					this.loading = action === 'unload' ? 2 : 1;
					this.loadingTarget = arg;
				break;
				case 'cancel': case 'range':
					this.loading = undefined;
				break;
			}
		}
	}
	get isPlanet() {
		return false;
	}
}

if (typeof module === 'object' && typeof module.exports === 'object') {
	module.exports = Unit;
}