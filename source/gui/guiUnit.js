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
	getBounds(unitArray, vx, vy) {
		let x, y, angle;
		[x, y, angle] = this.getDrawCoords(unitArray);
		
		const scale = (this.type === 0 ? 10 : 15) * Math.sqrt(this.size);
		
		return [
			[
				x - vx + Math.cos(angle) * scale,
				y - vy + Math.sin(angle) * scale
			],
			[
				x - vx - Math.cos(angle) * scale,
				y - vy - Math.sin(angle) * scale
			],
			[
				x - vx + Math.sin(angle) * scale * 1.73,
				y - vy - Math.cos(angle) * scale * 1.73
			],
			[
				x - vx + Math.sin(angle) * scale * 0.577,
				y - vy - Math.cos(angle) * scale * 0.577
			],
			scale * 0.82
		];
	}
	pointIsRight(a, b, m) {
		return (b[0] - a[0]) * (m[1] - a[1]) - (b[1] - a[1]) * (m[0] - a[0]) >= 0;
	}
	mouseInBounds(mx, my, unitArray) {
		let bounds = this.getBounds(unitArray, 0, 0);
		return (
			this.pointIsRight(bounds[0], bounds[1], [mx, my])
			&& this.pointIsRight(bounds[1], bounds[2], [mx, my])
			&& this.pointIsRight(bounds[2], bounds[0], [mx, my])
		);
	}
	draw(ctx, frame, unitArray, vx, vy, selected) {
		ctx.beginPath();
		
		const bounds = this.getBounds(unitArray, vx, vy);
		ctx.moveTo(...bounds[0]);
		ctx.lineTo(...bounds[1]);
		ctx.lineTo(...bounds[2]);
		ctx.lineTo(...bounds[0]);
		
		let strokeColor = ['blue', 'red', 'green', 'yellow', 'orange', 'purple', 'cyan'][this.owner];
		ctx.strokeStyle = strokeColor ? strokeColor : 'black';
		ctx.lineWidth = 2;
		ctx.stroke();
		let fillColor = ['#eee', '#b38847', '#69b38f', '#999'][this.type];
		ctx.fillStyle = fillColor ? fillColor : 'white';
		ctx.fill();
		
		return [bounds[3], bounds[4]];
	}
	get isPlanet() {
		return false;
	}
}