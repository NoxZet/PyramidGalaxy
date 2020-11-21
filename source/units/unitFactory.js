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