class UnitPyramid {
	constructor() {
		this.canMove = true;
		this.xtarget = undefined;
		this.ytarget = undefined;
		this.metal = 0;
		this.methane = 0;
		this.metalCanLoad = true;
		this.metalCanUnload = true;
	}
	get metalCapacity() {
		return this.unit.size * 200;
	}
	get methaneCapacity() {
		return this.unit.size * 200;
	}
	tick(frame) {
		if (this.unit.angular) {
			let x = this.unit.x;
			let y = this.unit.y;
			let speed = 1;
			// Calculate angular speed that equals given linear speed
			let xspeed = speed / y;
			if (this.xtarget !== undefined || this.ytarget !== undefined) {
				this.ytarget = undefined; // TODO: we don't do movement on y yet
				let leftDist = (x + Math.PI * 4 - this.xtarget) % (Math.PI * 2);
				let rightDist = (this.xtarget + Math.PI * 4 - x) % (Math.PI * 2);
				if (leftDist < rightDist) {
					if (leftDist <= xspeed) {
						this.unit.x = this.xtarget;
						this.xtarget = undefined;
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
					}
					else {
						this.unit.x += xspeed;
						if (this.unit.x >= Math.PI) {
							this.unit.x -= Math.PI * 2;
						}
					}
				}
				return ['move', this.unit.x, this.unit.y]; // x, y
			}
		}
	}
	get eventUI() {
		return `${this.metal};${this.metalCapacity};${this.methane};${this.methaneCapacity}`;
	}
}

if (typeof module === 'object' && typeof module.exports === 'object') {
	module.exports = UnitPyramid;
}