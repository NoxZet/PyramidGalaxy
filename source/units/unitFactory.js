if (typeof module === 'object' && typeof module.exports === 'object') {
	Unit = require('./unit.js');
	UnitPyramid = require('./unitPyramid.js');
	UnitMetalMine = require('./unitMetalMine.js');
	UnitGasMine = require('./unitGasMine.js');
	UnitPyraFactory = require('./unitPyraFactory.js');
}

INTERNAL_CLASSES = [UnitPyramid, UnitMetalMine, UnitGasMine, UnitPyraFactory];

function unitFactory() {
	const unitArgs = Array.from(arguments);
	const extraArgs = unitArgs.splice(8);
	// Default size
	if (!unitArgs[7]) {
		unitArgs[7] = 1;
	}
	const unit = new Unit(...unitArgs);
	const internalClass = INTERNAL_CLASSES[unitArgs[2]];
	if (internalClass) {
		unit.internal = new internalClass(extraArgs);
	}
	return unit;
}

unitFactory.morph = function(unit, type) {
	const internalClass = INTERNAL_CLASSES[type];
	if (internalClass) {
		const oldInternal = unit.internal;
		const newInternal = new internalClass();
		unit.internal = newInternal;
		for (let resId in newInternal.resource) {
			if (newInternal.resource[resId] && oldInternal.resource[resId]) {
				newInternal.resource[resId].amount = Math.min(
					oldInternal.resource[resId].amount,
					newInternal.resource[resId].capacity
				)
			}
		}
		unit.type = type;
	}
}

if (typeof module === 'object' && typeof module.exports === 'object') {
	module.exports = unitFactory;
}

/**
 * 0 - Pyramid
 * 1 - Metal mine
 * 2 - Gas mine
 * 3 - Pyramid factory
 * 4 - Orbital factory
 * 5 - Research lab
 * 6 - Orbital lab
 * 7 - Space elevator
 */