class UnitPyramid {
	constructor(grounded = true) {
		this.grounded = grounded;
		this.canMove = true;
		this.xtarget = undefined;
		this.ytarget = undefined;
		this.loadAutomove = false;
		const self = this;
		this.resource = [{
			amount: 0,
			canLoad: true,
			canUnload: true,
			get capacity() {
				return self.metalCapacity;
			},
		}, {
			amount: 0,
			canLoad: true,
			canUnload: true,
			get capacity() {
				return self.methaneCapacity;
			},
		}];
	}
	get metalCapacity() {
		return this.unit.size * 200;
	}
	get methaneCapacity() {
		return this.unit.size * 200;
	}
	eventLoad(action, arg) {
		switch (action) {
			case 'load': case 'unload':
				this.loadAutomove = true;
				return false;
			case 'cancel':
				return false;
			case 'range':
				let other;
				if (this.loadAutomove && (other = arg[this.unit.loadingTarget]) && this.unit.planet === other.planet) {
					this.loadxtarget = other.x;
					this.loadytarget = other.y;
					return true;
				} else {
					return false;
				}
		}
	}
	eventMove(x, y, planet, automove = false) {
		if (this.grounded) {
			this.xtarget = x;
		}
		this.loadAutomove = automove;
		this.loadxtarget = undefined;
		this.loadytarget = undefined;
	}
	tick(frame) {
		let loadMove
		let xtarget = this.xtarget || this.loadxtarget;
		let ytarget = this.ytarget || this.loadytarget;
		if (this.unit.angular) {
			let x = this.unit.x;
			let y = this.unit.y;
			let speed = 1;
			// Calculate angular speed that equals given linear speed
			let xspeed = speed / y;
			if (xtarget !== undefined || ytarget !== undefined) {
				// TODO: we don't do movement on y yet
				this.ytarget = undefined;
				this.loadytarget = undefined;
				let leftDist = (x + Math.PI * 4 - xtarget) % (Math.PI * 2);
				let rightDist = (xtarget + Math.PI * 4 - x) % (Math.PI * 2);
				if (leftDist < rightDist) {
					if (leftDist <= xspeed) {
						this.unit.x = xtarget;
						this.xtarget = undefined;
						this.loadxtarget = undefined;
					}
					else {
						this.unit.x -= xspeed;
						if (this.unit.x < 0) {
							this.unit.x += Math.PI * 2;
						}
					}
				}
				else {
					if (rightDist <= xspeed) {
						this.unit.x = this.xtarget;
						this.xtarget = undefined;
						this.loadxtarget = undefined;
					}
					else {
						this.unit.x += xspeed;
						if (this.unit.x >= Math.PI) {
							this.unit.x -= Math.PI * 2;
						}
					}
				}
				if (this.unit.y * 0.5 * (Math.abs(this.unit.x - this.loadxtarget) % Math.PI * 2) < 45) {
					this.loadxtarget = undefined;
					this.loadytarget = undefined;
				}
				return ['move', this.unit.x, this.unit.y]; // x, y
			}
		}
	}
	get eventUI() {
		return `${this.resource[0].amount};${this.resource[0].capacity};${this.resource[1].amount};${this.resource[1].capacity};${this.unit.loading > 0 ? 1 : 0}`;
	}
}

if (typeof module === 'object' && typeof module.exports === 'object') {
	module.exports = UnitPyramid;
}