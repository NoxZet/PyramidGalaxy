class UnitPyramid {
	constructor(grounded = true) {
		this.grounded = grounded;
		this.canMove = true;
		this.xtarget = undefined;
		this.ytarget = undefined;
		this.merging = false;
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
				return self.gasCapacity;
			},
		}];
	}
	get metalCapacity() {
		return this.unit.size * 200;
	}
	get gasCapacity() {
		return this.unit.size * 200;
	}
	eventLoad(action, arg) {
		switch (action) {
			case 'load': case 'unload':
				this.merging = false;
				this.loadAutomove = true;
				return false;
			case 'cancel':
				return false;
			case 'range':
				let other;
				if (this.loadAutomove && (other = arg[this.unit.loadingTarget]) && this.unit.planet === other.planet) {
					this.automovextarget = other.x;
					this.automoveytarget = other.y;
					return true;
				} else {
					return false;
				}
		}
	}
	eventMerge(target) {
		this.merging = target;
		this.loadAutomove = false;
		this.automovextarget = undefined;
		this.automoveytarget = undefined;
	}
	eventMove(x, y, planet) {
		if (this.grounded) {
			this.xtarget = x;
		}
		this.merging = false;
		this.loadAutomove = false;
		this.automovextarget = undefined;
		this.automoveytarget = undefined;
	}
	tick(frame, unitArray) {
		if (this.merging) {
			const objectCoords = this.unit.getCoords(unitArray);
			const otherCoords = this.merging.getCoords(unitArray);
			const xdif = objectCoords[0]-otherCoords[0];
			const ydif = objectCoords[1]-otherCoords[1];
			const distance = Math.sqrt(xdif*xdif + ydif*ydif);
			// Merge into merge target
			if (distance <= 20) {
				this.merging.size += this.unit.size;
				// Load resources into target
				let targetResources = this.merging.internal.resource;
				for (let resId in targetResources) {
					if (this.resource[resId]) {
						targetResources[resId].amount = Math.min(
							targetResources[resId].amount + this.resource[resId].amount,
							targetResources[resId].capacity
						);
					}
				}
				// Merge object event removes this unit and updates the other unit
				return ['merge', this.merging.id];
			}
			// Order to move closer if too far for merging
			else {
				this.automovextarget = this.merging.x;
				this.automoveytarget = this.merging.y;
			}
		}
		let xtarget = this.xtarget || this.automovextarget;
		let ytarget = this.ytarget || this.automoveytarget;
		if (this.unit.angular) {
			let x = this.unit.x;
			let y = this.unit.y;
			let speed = 1;
			// Calculate angular speed that equals given linear speed
			let xspeed = speed / y;
			if (xtarget !== undefined || ytarget !== undefined) {
				// TODO: we don't do movement on y yet
				this.ytarget = undefined;
				this.automoveytarget = undefined;
				// Choose which way around the planet is faster
				let leftDist = (x + Math.PI * 4 - xtarget) % (Math.PI * 2);
				let rightDist = (xtarget + Math.PI * 4 - x) % (Math.PI * 2);
				if (leftDist < rightDist) {
					if (leftDist <= xspeed) {
						this.unit.x = xtarget;
						this.xtarget = undefined;
						this.automovextarget = undefined;
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
						this.automovextarget = undefined;
					}
					else {
						this.unit.x += xspeed;
						if (this.unit.x >= Math.PI) {
							this.unit.x -= Math.PI * 2;
						}
					}
				}
				if (this.loadAutomove && this.unit.y * 0.5 * (Math.abs(this.unit.x - this.automovextarget) % Math.PI * 2) < 45) {
					this.automovextarget = undefined;
					this.automoveytarget = undefined;
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