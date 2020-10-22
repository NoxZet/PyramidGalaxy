if (typeof module === 'object' && typeof module.exports === 'object') {
	throw new TypeError(`Not available in node`);
}

class GUI {
	constructor(proxy, userId) {
		this.proxy = proxy;
		this.userId = userId;
		this.units = [];
		this.selected = undefined;
		this.selectedUI = [];
		
		this.viewDir = undefined;
		this.vx = -400+userId*600;
		this.vy = -400;
		
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
				}
			break;
			case 'move':
				if (this.units[event.unit]) {
					const unit = this.units[event.unit];
					unit.x = parseFloat(split[0]);
					unit.y = parseFloat(split[1]);
				}
			break;
			case 'ui':
				if (this.selected === parseInt(event.unit)) {
					this.selectedUI = split;
				}
			break;
		}
	}
	
	drawUI(frame) {
		const self = this;
		if (this.selectedUI.length > 0) {
			const unit = this.units[this.selected];
			let ui = '';
			switch (unit.type) {
				case 0:
					ui += Math.round(this.selectedUI[0]) + '/' + Math.round(this.selectedUI[1]) + ' metal<br>';
					ui += Math.round(this.selectedUI[2]) + '/' + Math.round(this.selectedUI[3]) + ' methane';
					document.getElementById('hudBottom').innerHTML = ui;
				break;
				case 1:
					ui += Math.round(this.selectedUI[0]) + '/' + Math.round(this.selectedUI[1]) + ' metal';
					document.getElementById('hudBottom').innerHTML = ui;
				break;
				case 2:
					ui += Math.round(this.selectedUI[0]) + '/' + Math.round(this.selectedUI[1]) + ' methane';
					document.getElementById('hudBottom').innerHTML = ui;
				break;
				case 3:
					ui += Math.round(this.selectedUI[0]) + '/' + Math.round(this.selectedUI[1]) + ' metal<br>';
					const queue = parseInt(this.selectedUI[2]);
					ui += (queue === -1 ? 'infinite' : queue) + ' queued<br>';
					ui += `<a href='#' id='uireset'>reset</a> | <a href='#' id='uiinfinite'>infinite</a> | <a href='#' id='uiremove'>remove 1</a> | <a href='#' id='uiadd'>add 1</a><br>`;
					ui += Math.round(parseFloat(this.selectedUI[3])) + '%';
					document.getElementById('hudBottom').innerHTML = ui;
					document.getElementById('uireset').addEventListener('mousedown', () => {
						self.proxy.sendUserEvent(new EventServer(self.selected, 'queue', 0));
					});
					document.getElementById('uiinfinite').addEventListener('mousedown', () => {
						self.proxy.sendUserEvent(new EventServer(self.selected, 'queue', -1));
					});
					document.getElementById('uiremove').addEventListener('mousedown', () => {
						self.proxy.sendUserEvent(new EventServer(self.selected, 'queue', queue - 1));
					});
					document.getElementById('uiadd').addEventListener('mousedown', () => {
						self.proxy.sendUserEvent(new EventServer(self.selected, 'queue', queue + 1));
					});
				break;
			}
		}
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
		ctx.clearRect(0, 0, width, height);
		for (let unitId in this.units) {
			const unit = this.units[unitId]
			unit.draw(ctx, frame, this.units, this.vx, this.vy);
			if (this.selected === parseInt(unitId)) {
				let x, y;
				[x, y] = unit.getDrawCoords(this.units);
				ctx.beginPath();
				ctx.arc(x - this.vx, y - this.vy, 15, 0, 2 * Math.PI);
				ctx.strokeStyle = 'red';
				ctx.stroke();
			}
		}
		this.drawUI(frame);
	}
	
	click(button, type, x, y) {
		x += this.vx;
		y += this.vy;
		if (button === 'left') {
			for (let unitId in this.units) {
				const unit = this.units[unitId];
				if (unit.isPlanet || unit.owner !== this.userId) {
					continue;
				}
				const coords = unit.getDrawCoords(this.units);
				if (Math.sqrt((x-coords[0])*(x-coords[0]) + (y-coords[1])*(y-coords[1])) <= 15) {
					this.selected = parseInt(unitId);
					this.selectedUI = [];
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
				this.proxy.sendUserEvent(new EventServer(this.selected, 'move', tx + ';' + ty));
			}
		}
	}
	
	key(button, type) {
		if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(button)) {
			if (type === 'down') {
				this.viewDir = button;
			} else {
				this.viewDir = undefined;
			}
		}
	}
}