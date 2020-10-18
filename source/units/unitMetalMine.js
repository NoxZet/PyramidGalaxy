class UnitMetalMine {
	constructor() {
		this.metal = 0;
		this.working = false;
		this.metalAutoUnload = true;
		this.metalCanLoad = true;
		this.metalCanUnload = true;
	}
	get metalCapacity() {
		return this.unit.size * 200;
	}
	tick(frame) {
		const metalMiningSpeed = this.unit.size;
		if (frame % 3 === 0) {
			if (this.metal < this.metalCapacity) {
				this.working = true;
				this.metal = Math.min(this.metal + metalMiningSpeed, this.metalCapacity);
			}
		}
	}
	get eventUI() {
		return `${this.metal};${this.metalCapacity}`;
	}
}

if (typeof module === 'object' && typeof module.exports === 'object') {
	module.exports = UnitMetalMine;
}