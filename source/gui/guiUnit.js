if (typeof module === 'object' && typeof module.exports === 'object') {
	throw new TypeError(`Not available in node`);
}

class GUIUnit extends GUIObject {
	constructor(angular, orbits, x, y, owner, type, size) {
		super(angular, orbits, x, y);
		this.owner = parseInt(owner);
		this.type = parseInt(type);
		this.size = parseInt(size);
	}
	modify(angular, orbits, x, y, owner, type, size) {
		super.modify(angular, orbits, x, y);
		this.owner = parseInt(owner);
		this.type = parseInt(type);
		this.size = parseInt(size);
	}
	draw(ctx, frame, unitArray, vx, vy) {
		let x, y, angle;
		[x, y, angle] = this.getDrawCoords(unitArray);
		
		//x = 0; y = 5;
		
		ctx.beginPath();
		
		const scale = this.type === 0 ? 10 : 15;
		
		let x0 = x - vx + Math.cos(angle) * scale * Math.sqrt(this.size);
		let y0 = y - vy + Math.sin(angle) * scale * Math.sqrt(this.size);
		ctx.moveTo(
			x0,
			y0
		);
		ctx.lineTo(
			x - vx - Math.cos(angle) * scale * Math.sqrt(this.size),
			y - vy - Math.sin(angle) * scale * Math.sqrt(this.size)
		);
		ctx.lineTo(
			x - vx + Math.sin(angle) * scale * 1.73 * Math.sqrt(this.size),
			y - vy - Math.cos(angle) * scale * 1.73 * Math.sqrt(this.size)
		);
		ctx.lineTo(
			x0,
			y0
		);
		
		let strokeColor = ['blue', 'red', 'green', 'yellow', 'orange', 'purple', 'cyan'][this.owner];
		ctx.strokeStyle = strokeColor ? strokeColor : 'black';
		ctx.lineWidth = 2;
		ctx.stroke();
		let fillColor = ['#eee', '#b38847', '#69b38f', '#999'][this.type];
		ctx.fillStyle = fillColor ? fillColor : 'white';
		ctx.fill();
	}
	get isPlanet() {
		return false;
	}
}