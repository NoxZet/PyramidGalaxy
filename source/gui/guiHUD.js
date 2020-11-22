if (typeof module === 'object' && typeof module.exports === 'object') {
	throw new TypeError(`Not available in node`);
}

const HUD_TILE_SIZE = 60;
const HUD_GRID_WIDTH = HUD_TILE_SIZE * 5 + 5;
const HUD_GRID_HEIGHT = HUD_TILE_SIZE * 3 + 5;
const HUD_PANEL_HEIGHT = 110;

class GUIHUD {
	constructor(gui, userId) {
		this.gui = gui;
		this.userId = userId;
		this.grid = {
			Q: [0, 0],
			W: [1, 0],
			E: [2, 0],
			R: [3, 0],
			T: [4, 0],
			A: [0, 1],
			S: [1, 1],
			D: [2, 1],
			F: [3, 1],
			G: [4, 1],
			Z: [0, 2],
			X: [1, 2],
			C: [2, 2],
			V: [3, 2],
			B: [4, 2],
		}
		this.unitName = '';
		this.unitText = '';
		this.selectedUnit = undefined;
		this.selectedData = undefined;
		this.selectedState = undefined;
	}
	selected(unit, data = undefined, state = undefined) {
		if (state !== undefined) {
			this.selectedState = state;
		}
		else if (unit !== this.selectedUnit) {
			this.selectedState = state = 0;
		}
		else {
			state = this.selectedState;
		}
		this.selectedUnit = unit;
		this.selectedData = data;
		
		this.unitText = '';
		for (let key in this.grid) {
			delete this.grid[key][3];
			delete this.grid[key][4];
		}
		if (unit !== undefined && data !== undefined) {
			this.unitText = '';
			const self = this;
			const gui = this.gui;
			switch (unit.type) {
				case 0:
					this.unitName = 'Pyramid'
					this.unitText += Math.round(data[0]) + '/' + Math.round(data[1]) + ' metal\n';
					this.unitText += Math.round(data[2]) + '/' + Math.round(data[3]) + ' gas';
					if (state === 0) {
						if (data[4] > 0) {
							this.grid['W'][3] = 'Cancel\nLoading';
							this.grid['W'][4] = () => {
								gui.loadResource('cancel', self.selectedUnit.id);
							};
						} else {
							this.grid['W'][3] = 'Load\nfrom';
							this.grid['W'][4] = () => {
								console.log(self.selectedUnit);
								gui.loadResource('load', self.selectedUnit.id);
							};
							this.grid['E'][3] = 'Unload\ninto';
							this.grid['E'][4] = () => {
								gui.loadResource('unload', self.selectedUnit.id);
							};
						}
						this.grid['S'][3] = 'Merge';
						this.grid['S'][4] = () => {
							gui.unitMerge('init', self.selectedUnit.id);
						};
						this.grid['Z'][3] = 'Morph';
						this.grid['Z'][4] = () => {
							this.selected(unit, data, 1);
						};
					}
					else if (state === 1) {
						this.grid['Q'][3] = 'Metal\nmine';
						this.grid['Q'][4] = () => {
							gui.unitMorph(self.selectedUnit.id, 1);
						};
						this.grid['W'][3] = 'Gas\nmine';
						this.grid['W'][4] = () => {
							gui.unitMorph(self.selectedUnit.id, 2);
						};
						this.grid['A'][3] = 'Pyra\nfactory';
						this.grid['A'][4] = () => {
							gui.unitMorph(self.selectedUnit.id, 3);
						};
						this.grid['B'][3] = 'Back';
						this.grid['B'][4] = () => {
							this.selected(unit, data, 0);
						};
					}
				break;
				case 1:
					this.unitName = 'Metal mine';
					this.unitText += Math.round(data[0]) + '/' + Math.round(data[1]) + ' metal';
				break;
				case 2:
					this.unitName = 'Gas mine';
					this.unitText += Math.round(data[0]) + '/' + Math.round(data[1]) + ' gas';
				break;
				case 3:
					this.unitName = 'Pyramid factory';
					this.unitText += Math.round(data[0]) + '/' + Math.round(data[1]) + ' metal\n';
					const queue = parseInt(data[2]);
					this.unitText += (queue === -1 ? 'Infinite' : queue) + ' queued\n';
					this.unitText += Math.round(parseFloat(data[3])) + '%';
					this.grid['Q'][3] = 'Add 1';
					this.grid['Q'][4] = () => {
						gui.unitQueue(self.selectedUnit.id, queue + 1);
					};
					this.grid['W'][3] = 'Rem 1';
					this.grid['W'][4] = () => {
						gui.unitQueue(self.selectedUnit.id, queue - 1);
					};
					this.grid['A'][3] = 'Infinite';
					this.grid['A'][4] = () => {
						gui.unitQueue(self.selectedUnit.id, -1);
					};
					this.grid['S'][3] = 'Reset';
					this.grid['S'][4] = () => {
						gui.unitQueue(self.selectedUnit.id, 0);
					};
				break;
			}
		}
	}
	drawText(ctx, text, x, y, spacing) {
		for (let line of text.split('\n')) {
			ctx.fillText(line, x, y);
			y += spacing;
		}
	}
	drawTeamRect(ctx, x, y, w, h) {
		ctx.fillStyle = ['blue', 'red', 'green', 'yellow', 'orange', 'purple', 'cyan'][this.userId];
		ctx.fillRect(x, y, w, h);
		ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
		ctx.fillRect(x, y, w, h);
	}
	drawGrid(ctx, frame, ex, ey) {
		this.drawTeamRect(ctx, ex - HUD_TILE_SIZE * 5 - 5, ey - HUD_TILE_SIZE * 3 - 5, HUD_TILE_SIZE * 5 + 5, HUD_TILE_SIZE * 3 + 5);
		for (let key in this.grid) {
			if (this.grid[key][3]) {
				const x = this.grid[key][0];
				const y = this.grid[key][1];
				ctx.fillStyle = 'white';
				const x1 = ex - HUD_TILE_SIZE * (5 - x);
				const y1 = ey - HUD_TILE_SIZE * (3 - y);
				ctx.fillRect(x1, y1, HUD_TILE_SIZE - 5, HUD_TILE_SIZE - 5);
				ctx.fillStyle = 'black';
				ctx.font = '14px Verdana';
				ctx.fillText(key, x1 + 2, y1 + 12);
				ctx.font = '12px Verdana';
				this.drawText(ctx, this.grid[key][3], x1 + 2, y1 + 32, 16);
			}
		}
	}
	drawPanel(ctx, frame, width, height) {
		const y1 = height - HUD_PANEL_HEIGHT;
		this.drawTeamRect(ctx, 0, y1, width - HUD_GRID_WIDTH, HUD_PANEL_HEIGHT);
		ctx.fillStyle = 'black';
		ctx.font = '20px Verdana';
		this.drawText(ctx, this.unitName, 200, y1 + 22);
		ctx.font = '16px Verdana';
		this.drawText(ctx, this.unitText, 200, y1 + 40, 18);
	}
	draw(ctx, frame, width, height) {
		this.drawTeamRect(ctx, 0, 0, 1, height);
		this.drawTeamRect(ctx, 0, 0, width, 1);
		this.drawTeamRect(ctx, width - 1, 0, 1, height);
		this.drawGrid(ctx, frame, width, height);
		this.drawPanel(ctx, frame, width, height);
	}
	action(button) {
		if (this.grid[button][4]) {
			this.grid[button][4]();
		}
	}
	mouseClick(button, type, mx, my) {
		if (type !== 'down' || (mx < this.width - HUD_GRID_WIDTH || my < this.height - HUD_GRID_HEIGHT)) {
			return false;
		}
		for (let key in this.grid) {
			const x = this.grid[key][0];
			const y = this.grid[key][1];
			const x1 = this.width - HUD_TILE_SIZE * (5 - x);
			const y1 = this.height - HUD_TILE_SIZE * (3 - y);
			if (mx >= x1 && my >= y1 && mx <= x1 + HUD_TILE_SIZE - 5 && my <= y1 + HUD_TILE_SIZE - 5) {
				this.action(key);
				return true;
			}
		}
		return true;
	}
	key(button, type) {
		if (button.length === 1) {
			if (type === 'up') {
				if (this.grid[button]) {
					delete this.grid[button][2];
				}
			}
			else if (type === 'down') {
				if (this.grid[button] && !this.grid[button][2]) {
					this.grid[button][2] = true;
					this.action(button);
				}
			}
		}
	}
}