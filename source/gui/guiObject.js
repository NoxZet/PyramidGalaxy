if (typeof module === 'object' && typeof module.exports === 'object') {
	throw new TypeError(`Not available in node`);
}

class GUIObject {
	constructor(angular, orbits, x, y) {
		this.angular = angular == 1;
		this.orbits = orbits == -1 ? undefined : parseInt(orbits);
		this.x = parseFloat(x);
		this.y = parseFloat(y);
	}
	modify(angular, orbits, x, y) {
		this.angular = angular == 1;
		this.orbits = orbits == -1 ? undefined : parseInt(orbits);
		this.x = parseFloat(x);
		this.y = parseFloat(y);
	}
	getDrawCoords(unitArray=[]) {
		let x = 0;
		let y = 0;
		let angle = 0;
		if (typeof this.orbits === 'number' && unitArray[this.orbits]) {
			[x, y] = unitArray[this.orbits].getDrawCoords(unitArray);
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
}