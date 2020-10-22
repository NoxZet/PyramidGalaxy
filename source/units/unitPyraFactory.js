class UnitPyraFactory {
	constructor() {
		this.working = false;
		/**
		 * 0 - not queued
		 * 1 to ... - queued count
		 * -1 - infinite queued
		 */
		this.queue = 0;
		this.progress = 0;
		const self = this;
		this.resource = [{
			amount: 0,
			canLoad: true,
			canUnload: true,
			autoLoad: true,
			get capacity() {
				return self.metalCapacity;
			},
		}, []];
	}
	get metalCapacity() {
		return this.unit.size * 200;
	}
	get progressNeeded() {
		return 100;
	}
	tick(frame) {
		// ticks needed at size 1 to complete
		const progressNeeded = this.progressNeeded;
		this.working = false;
		if (this.queue !== 0 && frame % 12 === 0) {
			let potential = Math.min(this.unit.size, this.resource[0].amount);
			let built = this.progress + potential >= progressNeeded;
			if (this.queue === 1 && built) {
				potential = progressNeeded - this.progress;
			}
			this.progress += potential;
			this.resource[0].amount -= potential;
			if (potential > 0) {
				this.working = true;
			}
			if (built) {
				this.progress -= progressNeeded;
				if (this.queue > 0) {
					this.queue--;
				}
				return ['generate', 0, 1]; // unit type, unit size
			}
		}
	}
	eventQueue(queue) {
		this.queue = queue;
	}
	get eventUI() {
		return `${this.resource[0].amount};${this.resource[0].capacity};${this.queue};${this.progress*100/this.progressNeeded}`;
	}
}

if (typeof module === 'object' && typeof module.exports === 'object') {
	module.exports = UnitPyraFactory;
}