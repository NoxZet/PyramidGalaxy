if (typeof module === 'object' && typeof module.exports === 'object') {
	EventServer = require('./serverProxy/eventServer.js');
}

/**
 * Exists on both local and remote servers
 */
class World {
	constructor(planetFactory, unitFactory, userFactory) {
		this.objects = [];
		this.planets = [];
		this.users = [];
		this.objectId = 0;
		this.userId = 0;
		this.planetFactory = planetFactory;
		this.unitFactory = unitFactory;
		this.userFactory = userFactory;
	}
	/** Connects to a remote game or creates a local game, returns promise */
	connect(username) {
		for (let userId in this.users) {
			const user = this.users[userId];
			if (user.name === username) {
				return parseInt(userId);
			}
		}
		this.users.push(this.userFactory(this.userId, username));
		this.createPlanetStarter(this.userId);
		this.userId++;
		return this.userId - 1;
	}
	/** Disconnects from a remote game or closes a local game */
	disconnect(userId) {
		if (this.users[userId]) {
			const user = this.users[userId];
			user.removeEventCallback();
			user.notified = false;
		}
	}
	/** Add event callback */
	addEventCallback(userId, cb) {
		if (this.users[userId]) {
			const user = this.users[userId];
			user.addEventCallback(cb);
			if (!user.notified) {
				this.notifyAll(userId);
			}
		}
	}
	/** Send user interaction event */
	sendUserEvent(user, ue) {
		if (ue.unit !== '') {
			let object = this.objects[ue.unit];
			if (!object || object.isPlanet || object.owner !== user) {
				return;
			}
			let planet = this.objects[object.orbits];
			let args = ue.meta.toString().split(';');
			switch (ue.action) {
				case 'move':
					if (object.internal && object.internal.canMove) {
						let xtarget = parseFloat(args[0]);
						let ytarget = parseFloat(args[1]);
						if (!isNaN(xtarget) && !isNaN(ytarget)) {
							object.internal.xtarget = xtarget;
							object.internal.ytarget = Math.max(ytarget, planet.radius);
						}
					}
				break;
				case 'queue':
					let queue = parseInt(ue.meta);
					if (isNaN(queue) || queue < -1) {
						queue = 0;
					}
					object.eventQueue(queue);
				break;
				case 'select':
					this.users[user].selected = parseInt(ue.unit);
				break;
				case 'metalLoad':
					let loadObject = this.objects[ue.meta];
					if (loadObject && object.metalCanLoad && loadObject.metalCanUnload) {
						// add range check
						loadObject.loading = undefined;
						object.loading = 1;
						object.loadingTarget = ue.meta;
					}
				break;
				case 'metalUnload':
					let unloadObject = this.objects[ue.meta];
					if (unloadObject && object.metalCanUnload && unloadObject.metalCanLoad) {
						// add range check
						unloadObject.loading = undefined;
						object.loading = 2;
						object.loadingTarget = ue.meta;
					}
				break;
			}
		}
	}
	
	createPlanet(type, orbits, x, y, radius) {
		const planet = this.planetFactory(this.objectId, ...arguments);
		this.planets.push(planet);
		this.objects[this.objectId] = planet;
		
		const event = new EventServer(this.objectId, 'exists', planet.eventExists);
		for (let userId in this.users) {
			const user = this.users[userId];
			user.eventCallback(event);
		}
		
		this.objectId++;
		return planet;
	}
	createUnit(owner, type, orbits, x, y, angular, size) {
		const unit = this.unitFactory(this.objectId, ...arguments);
		this.objects[this.objectId] = unit;
		
		const event = new EventServer(this.objectId, 'exists', unit.eventExists);
		this.notifyAllEvent(event);
		
		this.objectId++;
		return unit;
	}
	createPlanetStarter(userId) {
		const user = this.users[userId];
		const planet = this.createPlanet(0, null, 600 * userId, 0, 250);
		this.createUnit(userId, 1, planet.id, 0, planet.radius, true);
		this.createUnit(userId, 3, planet.id, Math.atan(50 / planet.radius), planet.radius, true);
		//this.createUnit(userId, 0, planet.id, Math.PI/*Math.atan(90 / planet.radius)*/, planet.radius, true);
	}
	sendUI(frame) {
		for (let userId in this.users) {
			const user = this.users[userId];
			let unit;
			if (
				typeof user.selected === 'number'
				&& (unit = this.objects[user.selected])
				&& unit.owner === user.id
			) {
				user.eventCallback(new EventServer(user.selected, 'ui', unit.eventUI));
			}
		}
	}
	resourceFindClose(object, arr) {
		for (let objectId in arr) {
			const other = arr[objectId][0];
			const objectCoords = object.getCoords(this.objects);
			const otherCoords = other.getCoords(this.objects);
			const xdif = objectCoords[0]-otherCoords[0];
			const ydif = objectCoords[1]-otherCoords[1];
			const distance = Math.sqrt(xdif*xdif + ydif*ydif);
			if (distance <= 50) {
				return objectId;
			}
		}
	}
	resourceLoad(frame) {
		if (frame % 12 !== 0) {
			return;
		}
		let metalLoaders = {};
		let metalUnloaders = {};
		let metalManual = {};
		for (let objectId in this.objects) {
			let object = this.objects[objectId];
			if (object.isPlanet) {
				continue;
			}
			if (object.internal.metalCanLoad && object.internal.metal < object.internal.metalCapacity) {
				metalLoaders[objectId] = [object, Math.min(object.size, object.internal.metalCapacity-object.internal.metal)];
			}
			if (object.internal.metalCanUnload && object.internal.metal > 0) {
				metalUnloaders[objectId] = [object, Math.min(object.size, object.internal.metal)];
			}
			if (object.internal.loading > 0) {
				metalManual[objectId] = object;
			}
		}
		/*while (metalManual.length > 0) {
			let objectId = Object.keys(metalManual)[0];
			let object = metalManual[objectId];
			if (object.loading === 1) {
				resourceFindClose() {
					
				}
			}
		}*/
		// Only dealing with autoloading now, remove unloaders without autounloading
		for (let objectId of Object.keys(metalUnloaders)) {
			if (!metalUnloaders[objectId][0].internal.metalAutoUnload) {
				delete metalUnloaders[objectId];
			}
		}
		// Go over loaders and try to load autoloaders
		let stop = 5;
		while (Object.keys(metalLoaders).length > 0 && stop > 0) {
			stop--;
			let objectId = Object.keys(metalLoaders)[0];
			let object = metalLoaders[objectId][0];
			let transfer = metalLoaders[objectId][1];
			if (!object.internal.metalAutoLoad) {
				delete metalLoaders[objectId];
				continue;
			}
			let otherId = this.resourceFindClose(object, metalUnloaders);
			if (!otherId) {
				delete metalLoaders[objectId];
				continue;
			}
			let other = metalUnloaders[otherId][0];
			let transferOther = metalUnloaders[otherId][1];
			let transferActual = Math.min(transfer, transferOther);
			
			if (transferActual === transfer) {
				delete metalLoaders[objectId];
			}
			else {
				metalLoaders[objectId][1] -= transferActual;
			}
			
			if (transferActual === transferOther) {
				delete metalUnloaders[otherId];
			}
			else {
				metalUnloaders[otherId][1] -= transferActual;
			}
			
			object.internal.metal += transferActual;
			other.internal.metal -= transferActual;
		}
	}
	tick(frame) {
		for (let objectId in this.objects) {
			const object = this.objects[objectId];
			if (object.isPlanet) {
				continue;
			}
			const objEvents = object.tick(frame);
			if (typeof objEvents === 'object') {
				if (typeof objEvents[0] === 'string') {
					this.handleObjEvent(object, objEvents);
				}
				else {
					for (let i in objEvents) {
						this.handleObjEvent(object, objEvents[i]);
					}
				}
			}
		}
		this.resourceLoad(frame);
		this.sendUI(frame);
	}
	handleObjEvent(object, objEvent) {
		switch (objEvent[0]) {
			case 'generate':
				this.createUnit(object.owner, objEvent[1], object.orbits, object.x, object.y, object.angular, objEvent[2]);
			break;
			case 'move':
				this.notifyAllEvent(new EventServer(object.id, 'move', `${objEvent[1]};${objEvent[2]}`));
			break;
		}
	}
	/** Notify all users of a single event */
	notifyAllEvent(event) {
		for (let userId in this.users) {
			const user = this.users[userId];
			user.eventCallback(event);
		}
	}
	/** Notify one user of all objects */
	notifyAll(userId) {
		if (this.users[userId]) {
			const user = this.users[userId];
			for (let objectId in this.objects) {
				const object = this.objects[objectId];
				user.eventCallback(new EventServer(objectId, 'exists', object.eventExists));
			}
			user.notified = true;
		}
	}
}

function worldFactory() {
	return new World(...arguments);
}

if (typeof module === 'object' && typeof module.exports === 'object') {
	module.exports = worldFactory;
}