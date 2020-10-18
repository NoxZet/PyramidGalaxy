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
		
		cvs.addEventListener('mousedown', (e) => {
			if (e.button === 0) {
				gui.click('left', 'down', e.offsetX, e.offsetY);
			}
			else if (e.button === 2) {
				gui.click('right', 'down', e.offsetX, e.offsetY);
			};
			return false;
		});
		
		window.addEventListener('keydown', (e) => {
			gui.key(e.code, 'down');
			return false;
		});
		
		window.addEventListener('keyup', (e) => {
			gui.key(e.code, 'up');
			return false;
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