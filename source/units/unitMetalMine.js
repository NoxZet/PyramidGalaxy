class UnitMetalMine {
	constructor() {
		this.working = false;
		const self = this;
		this.resource = [{
			amount: 0,
			canLoad: true,
			canUnload: true,
			autoUnload: true,
			get capacity() {
				return self.metalCapacity;
			},
		}, undefined];
	}
	get metalCapacity() {
		return this.unit.size * 200;
	}
	tick(frame) {
		const metalMiningSpeed = this.unit.size;
		if (frame % 12 === 0) {
			if (this.resource[0].amount < this.resource[0].capacity) {
				this.working = true;
				this.resource[0].amount = Math.min(this.resource[0].amount + metalMiningSpeed, this.resource[0].capacity);
			}
		}
	}
	get eventUI() {
		return `${this.resource[0].amount};${this.resource[0].capacity}`;
	}
}

if (typeof module === 'object' && typeof module.exports === 'object') {
	module.exports = UnitMetalMine;
}