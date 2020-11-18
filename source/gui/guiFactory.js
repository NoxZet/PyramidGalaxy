if (typeof module === 'object' && typeof module.exports === 'object') {
	throw new TypeError(`Not available in node`);
}

function guiFactory() {
	let allArgs = Array.from(arguments);
	let unitArgs = allArgs.splice(1);
	return (new (allArgs[0] === 'p' ? GUIPlanet : GUIUnit)(...unitArgs));
}

function guiModify(object) {
	let allArgs = Array.from(arguments);
	let unitArgs = allArgs.splice(2);
	if (allArgs[1] === 'p') {
		if (!(object instanceof GUIPlanet)) {
			return;
		}
	}
	else {
		if (!(object instanceof GUIUnit)) {
			return;
		}
	}
	object.modify(...unitArgs);
}