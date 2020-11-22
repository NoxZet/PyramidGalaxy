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
		this.users[this.userId] = this.userFactory(this.userId, username);
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
					let xtarget = parseFloat(args[0]);
					let ytarget = parseFloat(args[1]);
					if (object.internal && object.internal.canMove && !isNaN(xtarget) && !isNaN(ytarget)) {
						object.eventMove(xtarget, ytarget, planet);
					}
				break;
				case 'queue':
					let queue = parseInt(args[0]);
					if (isNaN(queue) || queue < -1) {
						queue = 0;
					}
					object.eventQueue(queue);
				break;
				case 'select':
					this.users[user].selected = parseInt(ue.unit);
				break;
				case 'load': case 'unload':
					if (args[0] === 'c') {
						object.eventLoad('cancel');
					}
					else {
						let unloading = ue.action === 'unload';
						let otherObject = this.objects[args[0]];
						if (otherObject && otherObject.owner === user && otherObject !== object && (
							(!unloading && object.internal.resource[0].canLoad && otherObject.internal.resource[0].canUnload)
							||
							(unloading && object.internal.resource[0].canUnload && otherObject.internal.resource[0].canLoad)
						)) {
							// TODO: add range check
							otherObject.eventLoad('cancel');
							object.eventLoad(ue.action, args[0]);
						}
					}
				break;
				case 'merge':
					let otherObject = this.objects[args[0]];
					if (otherObject && otherObject.owner === user && otherObject !== object) {
						object.eventMerge(otherObject);
					}
				break;
				case 'morph':
					let result = object.eventMorph(args[0]);
					if (result) {
						this.handleObjEvent(object, result);
					}
				break;
			}
		}
		else {
			switch (ue.action) {
				case 'select':
					this.users[user].selected = undefined;
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
		this.createUnit(userId, 0, planet.id, Math.atan(90 / planet.radius), planet.radius, true);
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
	resourceTransfer(loaders, unloaders, loaderId, unloaderId, res) {
		let loader = loaders[loaderId][0];
		let unloader = unloaders[unloaderId][0];
		let loaderTransfer = loaders[loaderId][1];
		let unloaderTransfer = unloaders[unloaderId][1];
		
		let transferActual = Math.min(loaderTransfer, unloaderTransfer);
		
		if (transferActual === loaderTransfer) {
			delete loaders[loaderId];
		} else {
			loaders[loaderId][1] -= transferActual;
		}
		
		if (transferActual === unloaderTransfer) {
			delete unloaders[unloaderId];
		} else {
			unloaders[unloaderId][1] -= transferActual;
		}
		
		loader.internal.resource[res].amount += transferActual;
		unloader.internal.resource[res].amount -= transferActual;
	}
	resourceLoad(frame, res) {
		if (frame % 12 !== 0) {
			return;
		}
		let loaders = {};
		let unloaders = {};
		let manual = {};
		for (let objectId in this.objects) {
			let object = this.objects[objectId];
			if (object.isPlanet) {
				continue;
			}
			let objRes = object.internal.resource[res];
			if (!objRes) {
				continue;
			}
			if (objRes.canLoad && objRes.amount < objRes.capacity) {
				loaders[objectId] = [object, Math.min(object.size * 2, objRes.capacity-objRes.amount)];
			}
			if (objRes.canUnload && objRes.amount > 0) {
				unloaders[objectId] = [object, Math.min(object.size * 2, objRes.amount)];
			}
			if (object.loading > 0) {
				manual[objectId] = object;
			}
		}
		// Manual loading
		while (Object.keys(manual).length > 0) {
			let objectId = Object.keys(manual)[0];
			let object = manual[objectId];
			let otherId = object.loadingTarget;
			let other = this.objects[otherId];
			
			const objectCoords = object.getCoords(this.objects);
			const otherCoords = other.getCoords(this.objects);
			const xdif = objectCoords[0]-otherCoords[0];
			const ydif = objectCoords[1]-otherCoords[1];
			const distance = Math.sqrt(xdif*xdif + ydif*ydif);
			if (distance > 50) {
				object.eventLoad('range', this.objects);
				delete manual[objectId];
				continue;
			}
			
			// Picking behavior - manual load/unload
			let loaderId = object.loading === 1 ? objectId : otherId;
			let unloaderId = object.loading === 1 ? otherId : objectId;

			// Transfer
			let loader = loaders[loaderId];
			let unloader = unloaders[unloaderId];
			if (loader && loader[1] > 0 && unloader && unloader[1] > 0) {
				this.resourceTransfer(loaders, unloaders, loaderId, unloaderId, res);
			} else {
				delete manual[objectId];
			}
			
			if (
				(object.loading === 1 && !loaders[objectId])
				||
				(object.loading !== 1 && !unloaders[objectId])
			) {
				delete manual[objectId];
			}
		}
		// Only dealing with autoloading now, remove unloaders without autounloading
		for (let objectId of Object.keys(unloaders)) {
			if (!unloaders[objectId][0].internal.resource[res].autoUnload) {
				delete unloaders[objectId];
			}
		}
		for (let objectId of Object.keys(loaders)) {
			if (!loaders[objectId][0].internal.resource[res].autoLoad) {
				delete loaders[objectId];
			}
		}
		// Go over loaders and try to load autoloaders
		while (Object.keys(loaders).length > 0) {
			let objectId = Object.keys(loaders)[0];
			let object = loaders[objectId][0];
			let transfer = loaders[objectId][1];
			let otherId = this.resourceFindClose(object, unloaders);
			if (!otherId) {
				delete loaders[objectId];
				continue;
			}
			this.resourceTransfer(loaders, unloaders, objectId, otherId, res);
		}
	}
	tick(frame) {
		for (let objectId in this.objects) {
			const object = this.objects[objectId];
			if (object.isPlanet) {
				continue;
			}
			const objEvents = object.tick(frame, this.objects);
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
		this.resourceLoad(frame, 0);
		this.resourceLoad(frame, 1);
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
			case 'merge':
				delete this.objects[object.id];
				this.notifyAllEvent(new EventServer(object.id, 'remove'));
				let other = this.objects[objEvent[1]];
				if (other) {
					console.log(other);
					this.notifyAllEvent(new EventServer(other.id, 'exists', other.eventExists));
				}
			break;
			case 'morph':
				this.unitFactory.morph(object, objEvent[1]);
				this.notifyAllEvent(new EventServer(object.id, 'exists', object.eventExists));
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