class Planet {
	constructor(id, type, orbits, x, y, radius=250) {
		this.id = id;
		this.type = type;
		this.orbits = orbits;
		this.x = x;
		this.y = y;
		this.radius = radius;
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
	get eventExists() {
		return (
			'p'
			+ ';' + `0;`
			+ (typeof this.orbits === 'number' ? this.orbits : -1)
			+ `;${this.x};${this.y};${this.type};${this.radius}`
		);
	}
	get isPlanet() {
		return true;
	}
}

function planetFactory() {
	return new Planet(...arguments);
}

if (typeof module === 'object' && typeof module.exports === 'object') {
	module.exports = planetFactory;
}