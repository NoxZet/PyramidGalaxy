if (typeof module === 'object' && typeof module.exports === 'object') {
	throw new TypeError(`Not available in node`);
}

class GUIPlanet extends GUIObject {
	constructor(angular, orbits, x, y, type, radius) {
		super(angular, orbits, x, y);
		this.type = parseInt(type);
		this.radius = parseInt(radius);
	}
	modify(angular, orbits, x, y, type, radius) {
		super.modify(angular, orbits, x, y);
		this.type = parseInt(type);
		this.radius = parseInt(radius);
	}
	draw(ctx, frame, unitArray, vx, vy) {
		let x, y;
		[x, y] = this.getDrawCoords(unitArray);
		
		ctx.beginPath();
		ctx.arc(x - vx, y - vy, this.radius, 0, 2 * Math.PI);
		
		ctx.strokeStyle = 'black';
		ctx.stroke();
		ctx.fillStyle = '#86cbfc';
		ctx.fill();
	}
	get isPlanet() {
		return true;
	}
}