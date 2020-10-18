window.onload = () => {

const proxy = new ServerLocal('Test');
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
			gui.click('left', e.offsetX, e.offsetY);
		}
		else if (e.button === 2) {
			gui.click('right', e.offsetX, e.offsetY);
		};
		return false;
	});
}).catch((e) => {
	console.log(e);
});

}