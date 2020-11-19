if (typeof module === 'object' && typeof module.exports === 'object') {
	throw new TypeError(`Not available in node`);
}

class GUI {
	constructor(proxy, userId) {
		this.proxy = proxy;
		this.userId = userId;
		this.units = [];
		this.selected = undefined;
		this.loading = undefined;
		this.merging = undefined;
		
		this.viewDir = undefined;
		this.vx = -400+userId*600;
		this.vy = -400;
		
		this.cursor = undefined;
		
		this.guiHUD = new GUIHUD(this, userId);
		
		const self = this;
		proxy.addEventCallback((event) => {
			self.eventCallback(event);
		});
	}
	
	eventCallback(event) {
		let split = event.meta.split(';');
		switch (event.action) {
			case 'exists':
				if (this.units[event.unit]) {
					guiModify(this.units[event.unit], ...split);
				}
				else {
					this.units[event.unit] = guiFactory(...split);
					this.units[event.unit].id = parseInt(event.unit);
				}
			break;
			case 'move':
				if (this.units[event.unit]) {
					const unit = this.units[event.unit];
					unit.x = parseFloat(split[0]);
					unit.y = parseFloat(split[1]);
				}
			break;
			case 'remove':
				if (this.units[event.unit]) {
					delete this.units[event.unit];
					if (this.loading && this.loading[1] === event.unit) {
						this.loading = undefined;
					}
					if (this.merging === event.unit) {
						this.merging = undefined;
					}
					if (this.selected === event.unit) {
						this.selected = undefined;
					}
				}
			case 'ui':
				if (this.selected === parseInt(event.unit)) {
					this.guiHUD.selected(this.units[this.selected], split);
				}
			break;
		}
	}
	
	loadResource(dir='cancel', unit) {
		switch (dir) {
			case 'cancel':
				this.proxy.sendUserEvent(new EventServer(unit, 'load', 'c'));
				this.loading = undefined;
			break;
			case 'load': case 'unload':
				this.loading = [dir, unit];
			break;
			case 'select':
				if (this.loading[1] !== unit) {
					this.proxy.sendUserEvent(new EventServer(this.loading[1], this.loading[0], unit));
				}
				this.loading = undefined;
			break;
		}
	}
	unitMerge(dir='cancel', unit) {
		switch (dir) {
			case 'init':
				this.merging = unit;
			break;
			case 'select':
				if (this.merging !== unit) {
					this.proxy.sendUserEvent(new EventServer(this.merging, 'merge', unit));
					this.merging = undefined;
				}
				this.merging = undefined;
			break;
		}
	}
	unitMove(unitId, x, y) {
		this.proxy.sendUserEvent(new EventServer(unitId, 'move', x + ';' + y));
	}
	unitQueue(unitId, queue) {
		this.proxy.sendUserEvent(new EventServer(unitId, 'queue', queue));
	}
	draw(ctx, frame) {
		if (this.viewDir) {
			const viewSpeed = 5;
			switch (this.viewDir) {
				case 'ArrowLeft': this.vx -= viewSpeed; break;
				case 'ArrowRight': this.vx += viewSpeed; break;
				case 'ArrowUp': this.vy -= viewSpeed; break;
				case 'ArrowDown': this.vy += viewSpeed; break;
			}
		}
		
		const width = ctx.canvas.width;
		const height = ctx.canvas.height;
		this.guiHUD.width = width;
		this.guiHUD.height = height;
		ctx.clearRect(0, 0, width, height);
		
		let circle;
		for (let unitId in this.units) {
			const unit = this.units[unitId];
			const bounds = unit.draw(ctx, frame, this.units, this.vx, this.vy);
			if (this.selected === parseInt(unitId)) {
				circle = bounds;
			}
		}
		if (circle) {
			ctx.beginPath();
			ctx.arc(circle[0][0], circle[0][1], circle[1], 0, 2 * Math.PI);
			ctx.strokeStyle = 'red';
			ctx.stroke();
		}
		this.guiHUD.draw(ctx, frame, width, height);
		if (this.cursor && (this.loading || this.merging)) {
			ctx.beginPath();
			ctx.arc(this.cursor[0], this.cursor[1], 10, 0, 2 * Math.PI);
			ctx.strokeStyle = 'blue';
			ctx.stroke();
		}
	}
	unitAt(x, y) {
		const unitIds = Object.keys(this.units).reverse();
		for (let unitId of unitIds) {
			const unit = this.units[unitId];
			if (unit.isPlanet || unit.owner !== this.userId) {
				continue;
			}
			if (unit.mouseInBounds(x, y, this.units)) {
				return parseInt(unitId);
			}
		}
	}
	mouseClick(button, type, x, y) {
		if (this.guiHUD.mouseClick(button, type, x, y)) {
			return;
		}
		if (type !== 'down') {
			return;
		}
		x += this.vx;
		y += this.vy;
		if (button === 'left') {
			let unitId = this.unitAt(x, y);
			if (unitId === undefined) {
				this.loading = undefined;
				this.merging = undefined;
				this.selected = undefined;
				this.guiHUD.selected(undefined);
				this.proxy.sendUserEvent(new EventServer('', 'select'));
			}
			else {
				if (this.loading) {
					this.loadResource('select', unitId);
				}
				else if (this.merging) {
					this.unitMerge('select', unitId)
				}
				else {
					this.selected = unitId;
					this.guiHUD.selected(undefined);
					this.proxy.sendUserEvent(new EventServer(this.selected, 'select'));
				}
			}
		}
		else if (button === 'right') {
			if (this.selected && this.units[this.selected]) {
				const selected = this.units[this.selected];
				let cx = 0;
				let cy = 0;
				if (typeof selected.orbits === 'number' && this.units[selected.orbits]) {
					[cx, cy] = this.units[selected.orbits].getDrawCoords();
				}
				let tx = x - cx;
				let ty = y - cy;
				if (selected.angular) {
					let dist = Math.sqrt(tx*tx + ty*ty);
					if (Math.abs(tx) >= Math.abs(ty)) {
						if (tx >= 0) {
							tx = Math.PI / 2 + Math.asin(ty / dist);
						} else {
							tx = Math.PI * 3 / 2 - Math.asin(ty / dist);
						}
					}
					else {
						if (ty < 0) {
							tx = Math.asin(tx / dist);
						} else {
							tx = Math.PI - Math.asin(tx / dist);
						}
					}
					tx = (tx + Math.PI * 2) % (Math.PI * 2);
					ty = dist;
				}
				this.unitMove(this.selected, tx, ty);
			}
		}
	}
	
	mouseMove(x, y) {
		this.cursor = (x === undefined) ? undefined : [x, y];
		this.guiHUD.cursor = (x === undefined) ? undefined : [x, y];
	}
	
	key(button, type) {
		if (button.length === 4 && button.search('Key') === 0) {
			this.guiHUD.key(button.substr(3, 1), type);
		}
		else if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(button)) {
			if (type === 'down') {
				this.viewDir = button;
			} else {
				this.viewDir = undefined;
			}
		}
	}
}