class UnitGasMine {
	constructor() {
		this.working = false;
		const self = this;
		this.resource = [undefined, {
			amount: 0,
			canLoad: true,
			canUnload: true,
			autoUnload: true,
			get capacity() {
				return self.gasCapacity;
			},
		}];
	}
	get gasCapacity() {
		return this.unit.size * 200;
	}
	tick(frame) {
		const gasMiningSpeed = this.unit.size;
		if (frame % 12 === 0) {
			if (this.resource[1].amount < this.resource[1].capacity) {
				this.working = true;
				this.resource[1].amount = Math.min(this.resource[1].amount + gasMiningSpeed, this.resource[1].capacity);
			}
		}
	}
	get eventUI() {
		return `${this.resource[1].amount};${this.resource[1].capacity}`;
	}
}

if (typeof module === 'object' && typeof module.exports === 'object') {
	module.exports = UnitGasMine;
}