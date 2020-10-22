window.onload = () => {

function gameFrame(proxy) {
	document.getElementById('logDiv').remove();
	proxy.connect().then((userId) => {
		let frame = 0;
		const cvs = document.getElementById('canvasGame');
		const ctx = cvs.getContext('2d');
		const gui = new GUI(proxy, userId);
		
		function tickFunction() {
			proxy.tick(frame);
			gui.draw(ctx, frame);
			frame++;
			window.requestAnimationFrame(tickFunction);
		}
		tickFunction();
		
		// Mouse
		function mouseClickHandler(e, type) {
			if (e.button === 0) {
				gui.mouseClick('left', type, e.offsetX, e.offsetY);
			}
			else if (e.button === 2) {
				gui.mouseClick('right', type, e.offsetX, e.offsetY);
			};
		}
		
		cvs.addEventListener('mousedown', (e) => {
			return mouseClickHandler(e, 'down');
		});
		
		cvs.addEventListener('mouseup', (e) => {
			return mouseClickHandler(e, 'up');
		});
		
		cvs.addEventListener('mousemove', (e) => {
			gui.mouseMove(e.offsetX, e.offsetY);
			return false;
		});
		
		cvs.addEventListener('mouseleave', (e) => {
			gui.mouseMove(undefined, undefined);
			return false;
		});
		
		// Keyboard
		function keyHandler(e, type) {
			gui.key(e.code, type);
			return false;
		}
		
		window.addEventListener('keydown', (e) => {
			return keyHandler(e, 'down');
		});
		
		window.addEventListener('keyup', (e) => {
			return keyHandler(e, 'up');
		});
	}).catch((e) => {
		console.log(e);
	});
}

document.getElementById('localButton').addEventListener('click', () => {
	const proxy = new ServerLocal(
		document.getElementById('nameInput').value
	);
	gameFrame(proxy);
});
document.getElementById('remoteButton').addEventListener('click', () => {
	const proxy = new ServerRemote(
		document.getElementById('sessionInput').value,
		document.getElementById('nameInput').value
	);
	gameFrame(proxy);
});


}