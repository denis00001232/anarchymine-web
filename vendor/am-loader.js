// AnarchyMine page loader in the main menu's mood (the stronghold end portal room): a dark stone-brick hall,
// an end portal window of drifting star layers (parallax), a flickering torch glow, embers and portal motes,
// the game's own logo (vendor/am-logo.png = promo/ads/logo_2048.png halved). Sits behind the engine's start
// overlay (the first div holding a <progress>; ids are renamed in builds, so it is found by structure).
// Pointer / device tilt shifts the layers, taps scatter portal sparks. Stops with the overlay.
(function () {
	'use strict';
	var css = [
		'#amload{position:fixed;inset:0;width:100%;height:100%;z-index:0;display:block;transition:opacity .8s;touch-action:none}',
		'.amload-root{background:transparent!important;z-index:1;pointer-events:none;justify-content:flex-end!important;padding-bottom:9vh;box-sizing:border-box}',
		'.amload-root>*{pointer-events:auto}',
		'.amload-root>img{display:none!important}',
		'#amload-logo{display:block!important;width:min(620px,88vw);height:auto;margin:0 0 26px;image-rendering:pixelated;',
		'filter:drop-shadow(0 6px 18px rgba(0,0,0,.8)) drop-shadow(0 0 22px rgba(40,160,130,.18))}',
		'.amload-root progress{-webkit-appearance:none;appearance:none;width:min(420px,78vw);height:6px;border:2px solid #ddd;background:#000a;padding:2px;box-sizing:content-box}',
		'.amload-root progress::-webkit-progress-bar{background:transparent}',
		'.amload-root progress::-webkit-progress-value{background:#eee}',
		'.amload-root progress::-moz-progress-bar{background:#eee}',
		'#amload-pct{font:14px/1 ui-monospace,Consolas,monospace;color:#d0d0d0;letter-spacing:.08em;text-shadow:2px 2px 0 #000;margin:12px 0 6px;text-align:center}',
		'#amload-tip{font:13px/1.4 system-ui,sans-serif;color:#8fa9a3;min-height:2.8em;max-width:min(520px,90vw);text-align:center;padding:0 16px;text-shadow:1px 1px 0 #000}'
	].join('');
	var TIPS = [
		'Первый запуск дольше: браузер собирает игру',
		'На анархии нет правил, но есть приваты: поставь золотой блок',
		'Аукцион: /ah — продавай и покупай у игроков',
		'Пригласи друга — получишь награды',
		'Коснись портала…'
	];
	var LAYERS = ['#16624f', '#185e64', '#1b4f6e', '#22466b', '#2b3f73', '#1f6b5e', '#3a3a7a', '#2a7a6a',
		'#4a8a7a', '#2f5f8f', '#6aa89a', '#3a8f8a'];

	function start() {
		var bar = document.querySelector('body > div > progress');
		if (!bar) return;
		var root = bar.parentElement;
		var st = document.createElement('style');
		st.textContent = css;
		document.head.appendChild(st);
		root.classList.add('amload-root');
		var logo = document.createElement('img'); logo.id = 'amload-logo'; logo.alt = 'AnarchyMine';
		logo.src = 'vendor/am-logo.png';
		bar.insertAdjacentElement('beforebegin', logo);
		var pct = document.createElement('div'); pct.id = 'amload-pct';
		var tip = document.createElement('div'); tip.id = 'amload-tip';
		bar.insertAdjacentElement('afterend', pct);
		pct.insertAdjacentElement('afterend', tip);
		var cv = document.createElement('canvas'); cv.id = 'amload';
		document.body.insertBefore(cv, root);
		var g = cv.getContext('2d');
		var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

		var W = 0, H = 0, dpr = 1, B = 32, px = 0, py = 0, spx = 0, spy = 0;
		var bricks = null, stars = [], motes = [], embers = [], sparks = [];
		function rnd(i, j) { var s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return s - Math.floor(s); }

		// stone bricks baked once per size, 16 texels per block: pixel noise, mortar, cracked and mossy ones
		function bake() {
			bricks = document.createElement('canvas');
			var cols = Math.ceil(W / B) + 2, rows = Math.ceil(H / B) + 2;
			bricks.width = cols * 16; bricks.height = rows * 16;
			var b = bricks.getContext('2d'), img = b.createImageData(bricks.width, bricks.height), d = img.data;
			for (var cy = 0; cy < rows; cy++) for (var cx = 0; cx < cols; cx++) {
				var kind = rnd(cx, cy), mossy = kind > .86, cracked = kind < .1;
				for (var y = 0; y < 16; y++) for (var x = 0; x < 16; x++) {
					var mortar = y === 7 || y === 15 || x === 15 || (x === 7 && y < 7);
					var v = mortar ? 70 : 98 + rnd(cx * 16 + x, cy * 16 + y) * 30;
					if (cracked && Math.abs(x - 4 - y * .6) < .7) v = 55;
					var r = v, gg = v, bb = v;
					if (mossy && rnd(x + cx * 31, y + cy * 17) > .55) { r = v * .6; gg = v * .85; bb = v * .45; }
					var o = ((cy * 16 + y) * bricks.width + cx * 16 + x) * 4;
					d[o] = r; d[o + 1] = gg; d[o + 2] = bb; d[o + 3] = 255;
				}
			}
			b.putImageData(img, 0, 0);
		}
		function resize() {
			dpr = Math.min(window.devicePixelRatio || 1, 2);
			W = window.innerWidth; H = window.innerHeight;
			cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
			cv.style.width = W + 'px'; cv.style.height = H + 'px';
			B = Math.max(28, Math.round(Math.min(W, H) / 12));
			bake();
		}
		resize();
		window.addEventListener('resize', resize);
		for (var i = 0; i < 520; i++) stars.push({ x: Math.random(), y: Math.random(), l: i % LAYERS.length, s: 1 + (Math.random() * 3 | 0) });
		window.addEventListener('pointermove', function (e) { px = e.clientX / W - .5; py = e.clientY / H - .5; });
		window.addEventListener('deviceorientation', function (e) {
			if (e.gamma != null) { px = Math.max(-.5, Math.min(.5, e.gamma / 60)); py = Math.max(-.5, Math.min(.5, (e.beta - 45) / 90)); }
		});

		// the portal window in the upper middle, on the brick grid
		function portal() {
			var size = Math.max(2, Math.round(Math.min(B * 5, W * .6, H * .34) / B)) * B;
			return { x: Math.round((W - size) / 2 / B) * B - spx * 10, y: Math.round(H * .1 / B) * B + B - spy * 6, s: size };
		}
		function tickList(list, color, size, dt, t) {
			for (var i = list.length - 1; i >= 0; i--) {
				var p = list[i]; p.x += p.vx * dt; p.y += p.vy * dt; p.l -= dt;
				if (p.g) p.vy += p.g * dt;
				if (p.l <= 0) { list.splice(i, 1); continue; }
				g.globalAlpha = Math.min(1, p.l * .8) * (.6 + .4 * Math.sin(t * 8 + i));
				g.fillStyle = p.c || color;
				var q = p.s || size;
				g.fillRect(p.x | 0, p.y | 0, q, q);
			}
		}

		var last = performance.now(), t = 0, done = false, running = true, tipK = -1;
		function frame(now) {
			if (done) return;
			var dt = Math.min(0.05, (now - last) / 1000); last = now;
			if (!running) { requestAnimationFrame(frame); return; }
			t += reduce ? dt * .2 : dt;
			spx += (px - spx) * Math.min(1, dt * 3); spy += (py - spy) * Math.min(1, dt * 3);
			g.setTransform(dpr, 0, 0, dpr, 0, 0);
			g.imageSmoothingEnabled = false;
			g.globalCompositeOperation = 'source-over';
			// walls
			g.drawImage(bricks, -B - spx * 10, -B - spy * 6, bricks.width / 16 * B, bricks.height / 16 * B);
			g.fillStyle = 'rgba(3,5,8,.80)'; g.fillRect(0, 0, W, H);
			// the portal: a void with parallax star layers
			var P = portal();
			g.save();
			g.beginPath(); g.rect(P.x, P.y, P.s, P.s); g.clip();
			g.fillStyle = '#04070b'; g.fillRect(P.x, P.y, P.s, P.s);
			stars.forEach(function (s) {
				var depth = (s.l + 1) / LAYERS.length, sp = .006 + depth * .012;
				var x = (s.x + t * sp * Math.cos(s.l * 1.3) + spx * depth * .25) % 1, y = (s.y + t * sp * Math.sin(s.l * 1.3) + spy * depth * .25) % 1;
				if (x < 0) x += 1;
				if (y < 0) y += 1;
				g.globalAlpha = (.25 + depth * .6) * (.7 + .3 * Math.sin(t * (1 + s.l * .3) + s.x * 40));
				g.fillStyle = LAYERS[s.l];
				var q = Math.max(1, B / 28 * s.s * (.3 + depth)) | 0;
				g.fillRect(P.x + x * P.s | 0, P.y + y * P.s | 0, q, q);
			});
			g.globalAlpha = 1;
			var inner = g.createRadialGradient(P.x + P.s / 2, P.y + P.s / 2, 0, P.x + P.s / 2, P.y + P.s / 2, P.s * .75);
			inner.addColorStop(0, 'rgba(40,140,120,.06)'); inner.addColorStop(1, 'rgba(0,0,0,.7)');
			g.fillStyle = inner; g.fillRect(P.x, P.y, P.s, P.s);
			g.restore();
			// end portal frame blocks around it, eyes in the top row
			var fb = B / 2, n = P.s / fb;
			for (var k = -1; k <= n; k++) {
				[[P.x + k * fb, P.y - fb], [P.x + k * fb, P.y + P.s], [P.x - fb, P.y + k * fb], [P.x + P.s, P.y + k * fb]].forEach(function (c, side) {
					g.fillStyle = (k + side) & 1 ? '#2c3428' : '#363f30';
					g.fillRect(c[0], c[1], fb, fb);
					g.fillStyle = 'rgba(255,255,230,.07)'; g.fillRect(c[0], c[1], fb, 2);
					g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(c[0], c[1] + fb - 3, fb, 3);
					g.fillStyle = 'rgba(80,90,60,.25)'; g.fillRect(c[0] + fb * .3, c[1] + fb * .4, 2, 2);
					if (side === 0 && k >= 0 && k < n && (k & 1)) {
						g.fillStyle = '#1d3b33'; g.fillRect(c[0] + fb * .25, c[1] + fb * .25, fb * .5, fb * .5);
						g.fillStyle = 'rgba(75,209,166,' + (.7 + .3 * Math.sin(t * 2 + k)) + ')'; g.fillRect(c[0] + fb * .38, c[1] + fb * .38, fb * .24, fb * .24);
					}
				});
			}
			// portal light on the walls
			var glow = g.createRadialGradient(P.x + P.s / 2, P.y + P.s / 2, P.s * .3, P.x + P.s / 2, P.y + P.s / 2, Math.max(W, H) * .7);
			glow.addColorStop(0, 'rgba(30,120,100,.22)'); glow.addColorStop(1, 'rgba(30,120,100,0)');
			g.fillStyle = glow; g.fillRect(0, 0, W, H);
			// wall torches on both sides of the portal: stick + pixel flame, warm glow, embers off the flame tip
			var u = Math.max(3, B / 10), ty = P.y + P.s * .4;
			[P.x - B * 1.6, P.x + P.s + B * 1.6 - u * 2].forEach(function (tx, side) {
				var fl = .8 + .12 * Math.sin(t * 9 + side * 2) * Math.sin(t * 3.7 + side) + .08 * Math.sin(t * 23 + side * 5);
				g.globalCompositeOperation = 'source-over';
				g.fillStyle = '#4a3420'; g.fillRect(tx, ty, u * 2, u * 9);
				g.fillStyle = '#6b4a2a'; g.fillRect(tx, ty, u, u * 9);
				var hop = Math.sin(t * 13 + side * 3) > .6 ? u : 0;
				g.fillStyle = '#ff8a1c'; g.fillRect(tx - u * .5, ty - u * 2, u * 3, u * 2.5);
				g.fillStyle = '#ffd34a'; g.fillRect(tx, ty - u * 3 - hop * .5, u * 2, u * 2.5);
				g.fillStyle = '#fff6c0'; g.fillRect(tx + u * .5, ty - u * 1.5, u, u);
				g.globalCompositeOperation = 'lighter';
				var cx = tx + u, cy = ty - u * 2, r = Math.max(W, H) * .42;
				var glow2 = g.createRadialGradient(cx, cy, 0, cx, cy, r);
				glow2.addColorStop(0, 'rgba(255,170,70,' + (.42 * fl) + ')'); glow2.addColorStop(.15, 'rgba(255,120,40,' + (.16 * fl) + ')');
				glow2.addColorStop(1, 'rgba(0,0,0,0)');
				g.fillStyle = glow2; g.fillRect(cx - r, cy - r, r * 2, r * 2);
				if (Math.random() < dt * 5) embers.push({ x: cx + (Math.random() - .5) * u * 2, y: cy - u * 2, vx: (Math.random() - .5) * 12,
					vy: -25 - Math.random() * 35, l: 1 + Math.random() * 1.6, s: Math.max(1, u * .8 | 0), c: Math.random() < .3 ? '#fff0a0' : '#ff9a40' });
				if (Math.random() < dt * 1.5) embers.push({ x: cx, y: cy - u * 3, vx: (Math.random() - .5) * 6, vy: -18 - Math.random() * 10,
					l: 2.5, s: Math.max(2, u * 1.5 | 0), c: 'rgba(70,70,70,.5)' });
			});
			// lava far below: a slow pulsing glow from the bottom edge with sparks rising out of it
			var lv = .55 + .2 * Math.sin(t * .9) + .08 * Math.sin(t * 3.1);
			var lava = g.createLinearGradient(0, H, 0, H * .55);
			lava.addColorStop(0, 'rgba(255,90,20,' + (.38 * lv) + ')'); lava.addColorStop(.35, 'rgba(180,50,10,' + (.12 * lv) + ')'); lava.addColorStop(1, 'rgba(0,0,0,0)');
			g.fillStyle = lava; g.fillRect(0, H * .55, W, H * .45);
			if (Math.random() < dt * 4) embers.push({ x: Math.random() * W, y: H + 4, vx: (Math.random() - .5) * 20, vy: -60 - Math.random() * 80,
				l: 1.5 + Math.random() * 2, s: Math.max(2, u | 0), c: Math.random() < .5 ? '#ff6a1a' : '#ffb340' });
			// dust drifting through the light
			if (motes.length < 70 && Math.random() < dt * 6) motes.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * 6, vy: (Math.random() - .5) * 6,
				l: 4 + Math.random() * 4, s: 1, c: 'rgba(220,200,170,.5)' });
			if (motes.length < 70 && Math.random() < dt * 10) motes.push({ x: P.x + Math.random() * P.s, y: P.y + P.s * Math.random(), vx: (Math.random() - .5) * 14, vy: -6 - Math.random() * 14, l: 3 + Math.random() * 4 });
			tickList(embers, '#ffb060', Math.max(2, B / 14 | 0), dt, t);
			tickList(motes, '#7ff0c8', Math.max(2, B / 16 | 0), dt, t);
			tickList(sparks, '#b07cff', 3, dt, t);
			g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
			// vignette
			var v = g.createRadialGradient(W / 2, H * .45, Math.min(W, H) * .25, W / 2, H * .5, Math.max(W, H) * .8);
			v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.85)');
			g.fillStyle = v; g.fillRect(0, 0, W, H);
			if (bar.max > 0 && bar.hasAttribute('value')) pct.textContent = 'Загрузка мира… ' + Math.floor(bar.value / bar.max * 100) + '%';
			else pct.textContent = 'Загрузка мира…';
			var k6 = t / 6 | 0;
			if (k6 !== tipK) { tipK = k6; tip.textContent = TIPS[k6 % TIPS.length]; }
			if (!root.isConnected) finish();
			requestAnimationFrame(frame);
		}

		cv.addEventListener('pointerdown', function (e) {
			for (var i = 0; i < 26; i++) {
				var a = Math.random() * 6.283, sp = 40 + Math.random() * 160;
				sparks.push({ x: e.clientX, y: e.clientY, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: 60, l: .8 + Math.random() * .8,
					c: i % 3 ? LAYERS[(Math.random() * LAYERS.length) | 0] : '#c8a0ff', s: 2 + (Math.random() * 3 | 0) });
			}
		});
		document.addEventListener('visibilitychange', function () { running = !document.hidden; last = performance.now(); });
		function finish() {
			if (done) return;
			done = true; cv.style.opacity = '0';
			setTimeout(function () { cv.remove(); st.remove(); }, 900);
		}
		requestAnimationFrame(frame);
	}
	if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
