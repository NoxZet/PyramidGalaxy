class UnitPyraFactory {
	constructor() {
		this.metal = 0;
		this.working = false;
		/**
		 * 0 - not queued
		 * 1 to ... - queued count
		 * -1 - infinite queued
		 */
		this.queue = 0;
		this.progress = 0;
		this.metalAutoLoad = true;
		this.metalCanLoad = true;
		this.metalCanUnload = true;
	}
	get metalCapacity() {
		return this.unit.size * 200;
	}
	get progressNeeded() {
		return 240;
	}
	tick(frame) {
		// ticks needed at size 1 to complete
		const progressNeeded = this.progressNeeded;
		// 1/metal consumed per progress
		const metalDivProgress = 12;
		this.working = false;
		if (this.queue !== 0) {
			let potential = Math.min(this.unit.size, this.metal / metalDivProgress);
			let built = this.progress + potential >= progressNeeded;
			if (this.queue === 1 && built) {
				potential = progressNeeded - this.progress;
			}
			this.progress += potential;
			this.metal -= potential / metalDivProgress;
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
		return `${Math.round(this.metal)};${this.metalCapacity};${this.queue};${this.progress*100/this.progressNeeded}`;
	}
}

if (typeof module === 'object' && typeof module.exports === 'object') {
	module.exports = UnitPyraFactory;
}