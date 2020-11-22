const UNIT_PRICE = [
	[0, 100, 100, 100],
	[0, 0, 0, 0]
];

const ITEM_INFO = {
	'thruster': {
		size: 3,
		price: [100, 50],
	},
	'laser': {
		size: 1,
		price: [50, 100],
	},
	'hull': {
		size: 1,
		price: [150],
	},
};

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
			amount: 100,
			canLoad: true,
			canUnload: true,
			get capacity() {
				return self.metalCapacity;
			},
		}, {
			amount: 100,
			canLoad: true,
			canUnload: true,
			get capacity() {
				return self.gasCapacity;
			},
		}];
		this.inventory = [];
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
	eventMorph(type) {
		// Check resources needed
		let canBuild = true;
		let newAmount = [];
		for (let resId in UNIT_PRICE) {
			if (UNIT_PRICE[resId][type] > 0 && this.resource[resId]) {
				newAmount[resId] = this.resource[resId].amount - UNIT_PRICE[resId][type] * this.unit.size;
				if (!(newAmount[resId] >= 0)) {
					canBuild = false;
				}
			}
			else if (UNIT_PRICE[resId][type] !== 0) {
				canBuild = false;
			}
		}
		// Modify resources
		if (canBuild) {
			for (let resId in UNIT_PRICE) {
				if (this.resource[resId]) {
					this.amount = newAmount[resId];
				}
			}
			// Merge object event removes this unit and updates the other unit
			return ['morph', type];
		}
		else {
			return ['notice', `Not enough resources`]
		}
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
			this.automovextarget = undefined;
			this.automoveytarget = undefined;
			const objectCoords = this.unit.getCoords(unitArray);
			const otherCoords = this.merging.getCoords(unitArray);
			const xdif = objectCoords[0]-otherCoords[0];
			const ydif = objectCoords[1]-otherCoords[1];
			const distance = Math.sqrt(xdif*xdif + ydif*ydif);
			// Attempt merge into merge target
			if (distance <= 20) {
				let type = this.merging.type
				// Check resources into target
				let targetResources = this.merging.internal.resource;
				let canBuild = true;
				let newAmount = [];
				for (let resId in UNIT_PRICE) {
					let thisAmount = this.resource[resId] ? this.resource[resId].amount : 0;
					let targetAmount = targetResources[resId] ? targetResources[resId].amount : 0;
					newAmount[resId] = thisAmount + targetAmount - UNIT_PRICE[resId][type];
					// if morph costs something, and both have this resource
					if (UNIT_PRICE[resId][type] > 0) {
						if (!(newAmount[resId] >= 0)) {
							canBuild = false;
						}
					}
					else if (UNIT_PRICE[resId][type] !== 0) {
						canBuild = false;
					}
				}
				if (canBuild) {
					this.merging.size += this.unit.size;
					for (let resId in UNIT_PRICE) {
						if (targetResources[resId]) {
							targetResources[resId].amount = Math.min(newAmount[resId], targetResources[resId].capacity);
						}
					}
					// Merge object event removes this unit and updates the other unit
					return ['merge', this.merging.id];
				}
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
	// Inventory stuff
	get inventoryTaken() {
		let taken = 0;
		for (let item of this.inventory) {
			taken += ITEM_INFO[item];
		}
		return taken;
	}
	eventItem(action, arg) {
		switch (action) {
			case 'remove':
				let pos = this.inventory.indexOf(arg);
				if (pos !== -1) {
					this.inventory.splice(pos, 1);
				}
			break;
			case 'make':
				let taken = this.inventoryTaken;
				if (ITEM_INFO.hasOwnProperty(arg) && taken + ITEM_INFO[arg].size <= this.unit.size) {
					let canBuild = true;
					for (let res in ITEM_INFO[arg].price) {
						if (!this.resource[res] || this.resource[res].amount < ITEM_INFO[arg].price[res]) {
							canBuild = false;
							break;
						}
					}
					if (canBuild) {
						for (let res in ITEM_INFO[arg].price) {
							this.resource[res].amount -= ITEM_INFO[arg].price[res];
						}
						this.inventory.push(arg);
					}
				}
			break;
		}
	}
	get eventUI() {
		return (
			`${this.resource[0].amount};${this.resource[0].capacity};${this.resource[1].amount};${this.resource[1].capacity};${this.unit.loading > 0 ? 1 : 0}`
			+ `;${this.inventoryTaken};${this.inventory.join('-')}`
		);
	}
}

if (typeof module === 'object' && typeof module.exports === 'object') {
	module.exports = UnitPyramid;
}