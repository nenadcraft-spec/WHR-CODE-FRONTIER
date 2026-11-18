/* WHR CODE FRONTIER · 0.1. Local economy sandbox. No networking or combat yet. */
(function (root) {
  'use strict';
  const RULES = Object.freeze({ hz: 20, cell: 40, cols: 40, rows: 28, workerCost: 50, scoutCost: 75,
    workerTicks: 300, scoutTicks: 400, harvestTicks: 60, workerSpeed: 3 * 16,
    scoutSpeed: 4 * 16, cargo: 5, workerLimit: 5, supply: 10, nodeStock: 1000 });
  const WIDTH = RULES.cols * RULES.cell, HEIGHT = RULES.rows * RULES.cell;
  const TEAMS = [{ name: 'CYAN', color: '#71e6e6', x: 170, y: 170 },
    { name: 'VIOLET', color: '#c7a0ff', x: 1430, y: 170 },
    { name: 'AMBER', color: '#ecc477', x: 170, y: 950 },
    { name: 'CORAL', color: '#fa8e90', x: 1430, y: 950 }];
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
  const cellIndex = (x, y) => Math.floor(y / RULES.cell) * RULES.cols + Math.floor(x / RULES.cell);
  function makeMap() {
    const blocked = new Uint8Array(RULES.cols * RULES.rows);
    // Four mirrored forest islands per quadrant. Roads and camp clearings remain open.
    const islands = [[8, 6, 3, 2], [14, 6, 2, 2], [8, 10, 2, 2], [14, 10, 2, 2]];
    for (const [x, y, w, h] of islands) for (const flipX of [false, true]) for (const flipY of [false, true]) {
      const sx = flipX ? RULES.cols - x - w : x, sy = flipY ? RULES.rows - y - h : y;
      for (let yy = sy; yy < sy + h; yy++) for (let xx = sx; xx < sx + w; xx++) blocked[yy * RULES.cols + xx] = 1;
    }
    // Keep all planned camps and merchant clearings accessible and visible.
    for (const sx of [1, -1]) for (const sy of [1, -1]) {
      const x = sx === 1 ? 480 : 1120, y = sy === 1 ? 320 : 800;
      const clearings = [{ x: x - sx * 90, y: y - sy * 100 }, { x: x + sx * 115, y: y - sy * 80 },
        { x: x + sx * 110, y: y + sy * 140 }, { x: x - sx * 100, y: y + sy * 105 }];
      for (let i = 0; i < blocked.length; i++) if (blocked[i] && clearings.some(p => distance(cellPoint(i), p) < 78)) blocked[i] = 0;
    }
    return blocked;
  }
  function freeCell(blocked, x, y) {
    const cx = Math.floor(clamp(x, 0, WIDTH - 1) / RULES.cell), cy = Math.floor(clamp(y, 0, HEIGHT - 1) / RULES.cell);
    const seed = cy * RULES.cols + cx;
    if (!blocked[seed]) return seed;
    const queue = [seed], seen = new Set(queue);
    for (let q = 0; q < queue.length; q++) {
      const i = queue[q], ix = i % RULES.cols, iy = Math.floor(i / RULES.cols);
      for (const [dx, dy] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) {
        const nx = ix + dx, ny = iy + dy, n = ny * RULES.cols + nx;
        if (nx < 0 || nx >= RULES.cols || ny < 0 || ny >= RULES.rows || seen.has(n)) continue;
        if (!blocked[n]) return n;
        seen.add(n); queue.push(n);
      }
    }
    return -1;
  }
  function cellPoint(i) { return { x: (i % RULES.cols + .5) * RULES.cell, y: (Math.floor(i / RULES.cols) + .5) * RULES.cell }; }
  function pathfind(blocked, from, to) {
    const start = freeCell(blocked, from.x, from.y), end = freeCell(blocked, to.x, to.y);
    if (start < 0 || end < 0) return null;
    const open = [start], costs = new Map([[start, 0]]), previous = new Map(), closed = new Set();
    const heuristic = i => Math.hypot(i % RULES.cols - end % RULES.cols, Math.floor(i / RULES.cols) - Math.floor(end / RULES.cols));
    while (open.length) {
      let best = 0;
      for (let i = 1; i < open.length; i++) if (costs.get(open[i]) + heuristic(open[i]) < costs.get(open[best]) + heuristic(open[best])) best = i;
      const current = open.splice(best, 1)[0];
      if (current === end) {
        const result = []; let c = end;
        while (c !== start) { result.push(cellPoint(c)); c = previous.get(c); }
        result.reverse();
        // The center of a blocked target's nearest free cell is a safe destination.
        const tx = clamp(to.x, 1, WIDTH - 1), ty = clamp(to.y, 1, HEIGHT - 1);
        const final = !blocked[cellIndex(tx, ty)] ? { x: tx, y: ty } : cellPoint(end);
        result.push(final); return result;
      }
      closed.add(current);
      const x = current % RULES.cols, y = Math.floor(current / RULES.cols);
      for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
        const nx = x + dx, ny = y + dy, n = ny * RULES.cols + nx;
        if (nx < 0 || ny < 0 || nx >= RULES.cols || ny >= RULES.rows || blocked[n] || closed.has(n)) continue;
        if (dx && dy && (blocked[y * RULES.cols + nx] || blocked[ny * RULES.cols + x])) continue;
        const g = costs.get(current) + (dx && dy ? Math.SQRT2 : 1);
        if (g < (costs.get(n) ?? Infinity)) { previous.set(n, current); costs.set(n, g); if (!open.includes(n)) open.push(n); }
      }
    }
    return null;
  }
  function createGame(active = 0) {
    const game = { tick: 0, active, running: false, paused: false, blocked: makeMap(), players: [], units: [], nodes: [], bases: [], nextId: 1 };
    TEAMS.forEach((t, owner) => {
      game.players.push({ code: 100, deliveries: [], queue: [] });
      game.bases.push({ id: 'base' + owner, type: 'base', owner, x: t.x, y: t.y, hp: 1500 });
      for (let n = 0; n < 6; n++) {
        const dx = (n % 3 - 1) * 48, dy = 88 + Math.floor(n / 3) * 44;
        game.nodes.push({ id: 'node' + owner + '-' + n, type: 'node', owner, x: t.x + dx,
          y: t.y + (owner < 2 ? -dy : dy), remaining: RULES.nodeStock, miner: null });
      }
      for (let n = 0; n < 3; n++) spawn(game, owner, 'worker', n);
    });
    return game;
  }
  function spawn(game, owner, type, initial = -1) {
    const b = game.bases[owner];
    const u = { id: 'u' + game.nextId++, type, owner, x: b.x - 22 + (initial >= 0 ? initial : 1) * 22,
      y: b.y + (owner < 2 ? 48 : -48), hp: type === 'worker' ? 80 : 100,
      cargo: 0, mode: 'idle', path: [], nodeId: null, work: 0 };
    game.units.push(u);
    if (type === 'worker') assignGather(game, u, initial >= 0 ? game.nodes[owner * 6 + initial] : null);
    return u;
  }
  function releaseNode(game, u) {
    const node = game.nodes.find(n => n.id === u.nodeId);
    if (node && node.miner === u.id) node.miner = null;
    u.work = 0;
  }
  function moveTo(game, u, target, mode) {
    const path = pathfind(game.blocked, u, target);
    u.path = path || []; u.mode = path ? mode : 'idle';
    return path !== null;
  }
  function pickNode(game, u) {
    return game.nodes.filter(n => n.owner === u.owner && n.remaining > 0)
      .sort((a, b) => (distance(a, u) + (a.miner ? 45 : 0)) - (distance(b, u) + (b.miner ? 45 : 0)))[0];
  }
  function returnCargo(game, u) {
    const b = game.bases[u.owner];
    return moveTo(game, u, { x: b.x, y: b.y + (u.owner < 2 ? -42 : 42) }, 'return');
  }
  function assignGather(game, u, node = null) {
    if (u.type !== 'worker') return false;
    releaseNode(game, u);
    node = node && node.remaining > 0 ? node : pickNode(game, u);
    u.nodeId = node ? node.id : null;
    if (u.cargo) return returnCargo(game, u);
    if (!node) { u.mode = 'idle'; u.path = []; return false; }
    return moveTo(game, u, { x: node.x, y: node.y + (node.owner < 2 ? 20 : -20) }, 'toNode');
  }
  function command(game, owner, ids, action, target) {
    if (!game.running || game.paused || owner !== game.active) return false;
    let changed = false;
    for (const u of game.units.filter(u => u.owner === owner && ids.includes(u.id))) {
      if (action === 'gather' && u.type === 'worker') { assignGather(game, u, target); changed = true; }
      if (action === 'move') { releaseNode(game, u); u.nodeId = null; moveTo(game, u, target, 'move'); changed = true; }
      if (action === 'stop') { releaseNode(game, u); u.path = []; u.mode = 'idle'; u.nodeId = null; changed = true; }
    }
    return changed;
  }
  function purchase(game, owner, type) {
    if (!game.running || game.paused) return 'Pokreni ili nastavi poligon.';
    if (owner !== game.active) return 'Možeš proizvoditi samo u svojoj Centrali.';
    if (!['worker', 'scout'].includes(type)) return 'Nepoznata jedinica.';
    const p = game.players[owner], owned = game.units.filter(u => u.owner === owner), reserved = p.queue;
    const count = owned.filter(u => u.type === type).length + reserved.filter(j => j.type === type).length;
    if (count >= (type === 'worker' ? RULES.workerLimit : 1)) return type === 'worker' ? 'T1 limit: najviše 5 radnika, uključujući naručene.' : 'Scout je već prisutan ili naručen.';
    if (owned.length + reserved.length >= RULES.supply) return 'Nema slobodne populacije.';
    if (reserved.length >= 5) return 'Proizvodni red je pun.';
    const cost = type === 'worker' ? RULES.workerCost : RULES.scoutCost, duration = type === 'worker' ? RULES.workerTicks : RULES.scoutTicks;
    if (p.code < cost) return 'Nedovoljno CODE-a.';
    p.code -= cost; p.queue.push({ type, remaining: duration, duration });
    return null;
  }
  function travel(u, speed) {
    let remaining = speed / RULES.hz;
    while (u.path.length && remaining > 0) {
      const target = u.path[0], d = distance(u, target);
      if (d <= remaining) { u.x = target.x; u.y = target.y; u.path.shift(); remaining -= d; }
      else { u.x += (target.x - u.x) / d * remaining; u.y += (target.y - u.y) / d * remaining; remaining = 0; }
    }
  }
  function step(game) {
    if (!game.running || game.paused) return;
    game.tick++;
    for (const u of game.units) {
      if (u.path.length) { travel(u, u.type === 'worker' ? RULES.workerSpeed : RULES.scoutSpeed); continue; }
      if (u.mode === 'move') u.mode = 'idle';
      else if (u.mode === 'toNode' || u.mode === 'waiting') {
        const n = game.nodes.find(n => n.id === u.nodeId);
        if (!n || n.remaining <= 0) { assignGather(game, u); continue; }
        if (!n.miner) { n.miner = u.id; u.mode = 'harvest'; u.work = 0; }
        else u.mode = 'waiting';
      } else if (u.mode === 'harvest') {
        const n = game.nodes.find(n => n.id === u.nodeId);
        if (!n || n.miner !== u.id || n.remaining <= 0) { assignGather(game, u); continue; }
        if (++u.work >= RULES.harvestTicks) {
          u.cargo = Math.min(RULES.cargo, n.remaining); n.remaining -= u.cargo; n.miner = null; u.work = 0; returnCargo(game, u);
        }
      } else if (u.mode === 'return') {
        if (u.cargo) { const p = game.players[u.owner]; p.code += u.cargo; p.deliveries.push({ tick: game.tick, amount: u.cargo }); u.cargo = 0; }
        assignGather(game, u, game.nodes.find(n => n.id === u.nodeId));
      }
    }
    for (let owner = 0; owner < game.players.length; owner++) {
      const p = game.players[owner];
      p.deliveries = p.deliveries.filter(d => d.tick > game.tick - 60 * RULES.hz);
      if (p.queue.length && --p.queue[0].remaining <= 0) spawn(game, owner, p.queue.shift().type);
    }
  }
  const API = { RULES, WIDTH, HEIGHT, TEAMS, createGame, purchase, command, step, pathfind, assignGather };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof document === 'undefined') return;

  const $ = id => document.getElementById(id), canvas = $('battlefield'), ctx = canvas.getContext('2d'), mini = $('minimap'), mctx = mini.getContext('2d');
  let game = createGame(), selected = ['base0'], started = false, camera = { x: WIDTH / 2, y: HEIGHT / 2, scale: 1 }, view = { width: 1, height: 1 }, pointer = null, orderMarker = null, noticeTimer, lastTime = 0, accumulator = 0;
  const keys = new Set();
  const formations = [[-20, -20], [20, -20], [-20, 20], [20, 20], [0, 0]];
  const zones = [{ x: 480, y: 320, sx: 1, sy: 1 }, { x: 1120, y: 320, sx: -1, sy: 1 }, { x: 480, y: 800, sx: 1, sy: -1 }, { x: 1120, y: 800, sx: -1, sy: -1 }];
  const modes = { idle: 'Nezaposlen', move: 'Kretanje', toNode: 'Ide po CODE', waiting: 'Čeka nalazište', harvest: 'Skuplja CODE', return: 'Nosi CODE' };
  function notify(message) { $('notice').textContent = message; $('notice').classList.add('show'); clearTimeout(noticeTimer); noticeTimer = setTimeout(() => $('notice').classList.remove('show'), 3500); }
  function resize() { const r = canvas.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2); view.width = r.width; view.height = r.height; canvas.width = r.width * dpr; canvas.height = r.height * dpr; fit(); }
  function fit() { camera.scale = Math.min(view.width / (WIDTH + 100), view.height / (HEIGHT + 100)); camera.x = WIDTH / 2; camera.y = HEIGHT / 2; }
  function world(sx, sy) { return { x: (sx - view.width / 2) / camera.scale + camera.x, y: (sy - view.height / 2) / camera.scale + camera.y }; }
  function pos(e) { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
  function zoom(factor, screen = { x: view.width / 2, y: view.height / 2 }) {
    const before = world(screen.x, screen.y); camera.scale = clamp(camera.scale * factor, Math.min(view.width / (WIDTH + 100), view.height / (HEIGHT + 100)), 2);
    const after = world(screen.x, screen.y); camera.x += before.x - after.x; camera.y += before.y - after.y;
  }
  function hit(p) {
    return game.units.filter(u => distance(u, p) < 22).sort((a, b) => distance(a, p) - distance(b, p))[0]
      || game.bases.find(b => distance(b, p) < 62) || game.nodes.find(n => distance(n, p) < 25);
  }
  canvas.addEventListener('contextmenu', e => e.preventDefault());
  canvas.addEventListener('pointerdown', e => {
    canvas.focus(); const p = pos(e);
    if (e.button === 2) {
      e.preventDefault(); if (!started || game.paused) return;
      const target = world(p.x, p.y), object = hit(target), units = game.units.filter(u => selected.includes(u.id) && u.owner === game.active);
      units.forEach((u, i) => {
        if (object && object.type === 'node' && u.type === 'worker') command(game, game.active, [u.id], 'gather', object);
        else { const offset = units.length > 1 ? formations[i % formations.length] : [0, 0]; command(game, game.active, [u.id], 'move', { x: target.x + offset[0], y: target.y + offset[1] }); }
      });
      if (units.length) orderMarker = { ...target, until: performance.now() + 900 };
      else notify('Prvo izaberi svoje radnike ili Scouta.');
      return;
    }
    if (e.button === 0) { pointer = { start: p, end: p, shift: e.shiftKey }; canvas.setPointerCapture(e.pointerId); }
  });
  canvas.addEventListener('pointermove', e => { if (pointer) pointer.end = pos(e); });
  canvas.addEventListener('pointerup', e => {
    if (!pointer || e.button !== 0) return;
    const a = world(pointer.start.x, pointer.start.y), b = world(pointer.end.x, pointer.end.y);
    let ids;
    if (distance(pointer.start, pointer.end) > 5) ids = game.units.filter(u => u.owner === game.active && u.x >= Math.min(a.x, b.x) && u.x <= Math.max(a.x, b.x) && u.y >= Math.min(a.y, b.y) && u.y <= Math.max(a.y, b.y)).map(u => u.id);
    else { const object = hit(b); ids = object ? [object.id] : []; }
    selected = pointer.shift ? [...new Set([...selected, ...ids])] : ids; pointer = null; updateHUD();
  });
  canvas.addEventListener('pointercancel', () => { pointer = null; });
  canvas.addEventListener('wheel', e => { e.preventDefault(); zoom(e.deltaY < 0 ? 1.12 : 1 / 1.12, pos(e)); }, { passive: false });
  mini.addEventListener('pointerdown', e => { const r = mini.getBoundingClientRect(); camera.x = (e.clientX - r.left) / r.width * WIDTH; camera.y = (e.clientY - r.top) / r.height * HEIGHT; });
  $('zoom-in').onclick = () => zoom(1.3); $('zoom-out').onclick = () => zoom(1 / 1.3); $('fit').onclick = fit;
  function reset() { game = createGame(Number($('player').value)); selected = ['base' + game.active]; started = false; $('welcome').hidden = false; $('pause').disabled = true; $('pause').textContent = 'Pauza'; accumulator = 0; orderMarker = null; keys.clear(); fit(); updateHUD(); }
  $('restart').onclick = reset;
  $('player').onchange = reset;
  $('start').onclick = () => { game.running = true; started = true; $('welcome').hidden = true; $('pause').disabled = false; canvas.focus(); notify('Poligon pokrenut. Levi klik bira; desni klik šalje na CODE ili teren.'); updateHUD(); };
  function pause() { if (!started) return; game.paused = !game.paused; $('pause').textContent = game.paused ? 'Nastavi' : 'Pauza'; accumulator = 0; updateHUD(); }
  $('pause').onclick = pause;
  function train(type) {
    if (!selected.includes('base' + game.active)) return notify('Izaberi svoju Centralu za proizvodnju.');
    const error = purchase(game, game.active, type); if (error) notify(error); else notify((type === 'worker' ? 'Radnik' : 'Scout') + ' dodat u proizvodni red.'); updateHUD();
  }
  $('train-worker').onclick = () => train('worker'); $('train-scout').onclick = () => train('scout');
  $('gather').onclick = () => { command(game, game.active, selected, 'gather'); updateHUD(); };
  $('stop').onclick = () => { command(game, game.active, selected, 'stop'); updateHUD(); };
  window.addEventListener('keydown', e => {
    if (['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(document.activeElement.tagName)) return;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    keys.add(e.code); if (e.repeat) return;
    if (e.code === 'Space') pause();
    if (e.code === 'KeyW') train('worker'); if (e.code === 'KeyS') train('scout');
    if (e.code === 'KeyG') $('gather').click(); if (e.code === 'KeyH') $('stop').click();
    if (e.code === 'Escape') { selected = []; updateHUD(); }
  });
  window.addEventListener('keyup', e => keys.delete(e.code)); window.addEventListener('blur', () => keys.clear());
  function updateHUD() {
    const p = game.players[game.active], own = game.units.filter(u => u.owner === game.active), units = game.units.filter(u => selected.includes(u.id));
    $('code').textContent = p.code; $('workers').textContent = own.filter(u => u.type === 'worker').length + ' / 5';
    $('supply').textContent = own.length + ' / 10' + (p.queue.length ? ' (+' + p.queue.length + ')' : '');
    const seconds = Math.floor(game.tick / RULES.hz); $('clock').textContent = String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0');
    const income = p.deliveries.reduce((s, d) => s + d.amount, 0); $('income').textContent = '+' + income + (seconds < 60 ? ' / ' + seconds + ' s' : ' / min');
    $('player-label').textContent = 'P' + (game.active + 1) + ' / ' + TEAMS[game.active].name;
    $('selected-count').textContent = selected.length + (selected.length === 1 ? ' OBJEKAT' : ' OBJEKATA');
    let title = 'Ništa nije izabrano', desc = 'Klikni bazu ili prevuci okvir preko svojih jedinica.', meta = 'Desni klik zadaje cilj.', portrait = '◇', health = false;
    const b = game.bases.find(b => selected.includes(b.id)), n = game.nodes.find(n => selected.includes(n.id));
    if (b) { title = 'WHR Centrala · P' + (b.owner + 1); desc = b.owner === game.active ? 'Tier 1 · proizvodnja i isporuka CODE-a' : 'Druga baza · posmatranje ekonomije'; meta = '1.500 HP · radnici 5 max · bez napada'; portrait = '⌂'; health = true; }
    else if (units.length) { const u = units[0]; title = units.length > 1 ? units.length + ' jedinica' : u.type === 'worker' ? 'WHR Radnik' : 'Scout'; desc = units.length > 1 ? 'Desni klik za grupno kretanje.' : modes[u.mode]; meta = units.length === 1 ? u.hp + ' HP · ' + (u.type === 'worker' ? u.cargo + '/5 CODE · brzina 3' : 'Izviđač · brzina 4 · bez napada') + (u.owner !== game.active ? ' · druga baza' : '') : 'Selekcija: ' + units.filter(u => u.type === 'worker').length + ' radnika'; portrait = u.type === 'worker' ? '⚒' : '➤'; health = true; }
    else if (n) { title = 'CODE nalazište'; desc = 'Jedno aktivno mesto za skupljanje.'; meta = n.remaining + ' / 1.000 CODE · teret 5 · rad 3 s'; portrait = '◆'; }
    $('selection-name').textContent = title; $('selection-description').textContent = desc; $('selection-meta').textContent = meta; $('portrait').textContent = portrait; $('health').hidden = !health;
    const canAct = started && !game.paused, baseSelected = !!b && b.owner === game.active;
    $('train-worker').disabled = !canAct || !baseSelected; $('train-scout').disabled = !canAct || !baseSelected;
    $('gather').disabled = !canAct || !units.some(u => u.owner === game.active && u.type === 'worker'); $('stop').disabled = !canAct || !units.some(u => u.owner === game.active);
    $('queue').replaceChildren();
    if (baseSelected) p.queue.forEach((j, i) => { const el = document.createElement('span'); el.className = 'job'; el.textContent = (j.type === 'worker' ? 'Radnik' : 'Scout') + ' · ' + (i ? 'čeka' : Math.ceil(j.remaining / RULES.hz) + ' s'); el.style.setProperty('--progress', ((1 - j.remaining / j.duration) * 100) + '%'); $('queue').append(el); });
    $('action-hint').textContent = game.paused ? 'Pauza · simulacija i proizvodnja miruju.' : baseSelected ? 'Limiti uključuju naručene jedinice. CODE se plaća odmah.' : 'Izaberi Centralu za proizvodnju; jedinicu za kretanje.';
  }
  function line(points, color, width) { ctx.beginPath(); points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke(); }
  function circle(x, y, radius, fill, stroke = null, width = 1) { ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); } }
  function label(text, x, y, color = '#c2d0b9', size = 12) { ctx.fillStyle = color; ctx.font = '600 ' + size + 'px "Segoe UI",sans-serif'; ctx.textAlign = 'center'; ctx.fillText(text, x, y); }
  function bunny(x, y, size, color) {
    ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(x - size * .35, y - size * .8, size * .19, size * .7, -.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + size * .35, y - size * .8, size * .19, size * .7, .2, 0, Math.PI * 2); ctx.fill(); circle(x, y, size * .55, color);
    circle(x - size * .2, y - size * .05, size * .07, '#142327'); circle(x + size * .2, y - size * .05, size * .07, '#142327');
  }
  function crystal(x, y, size, depleted = false) {
    ctx.beginPath(); ctx.moveTo(x, y - size); ctx.lineTo(x + size * .6, y - size * .2); ctx.lineTo(x + size * .4, y + size * .5); ctx.lineTo(x - size * .45, y + size * .5); ctx.lineTo(x - size * .65, y - size * .2); ctx.closePath();
    ctx.fillStyle = depleted ? '#344d4a' : '#55cce1'; ctx.fill(); ctx.strokeStyle = depleted ? '#45625b' : '#b4f5ed'; ctx.lineWidth = 1.5; ctx.stroke();
    line([[x, y - size], [x - size * .1, y + size * .5]], depleted ? '#45625b' : '#d5fff5', 1);
  }
  function drawGround() {
    ctx.fillStyle = '#233e32'; ctx.fillRect(0, 0, WIDTH, HEIGHT);
    for (let i = 0; i < 1300; i++) { const x = (i * 173 + 41) % WIDTH, y = (i * 227 + 13) % HEIGHT; circle(x, y, 1 + i % 3, i % 2 ? '#2a4837' : '#1d382e'); }
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const ring = [[170, 170], [800, 120], [1430, 170], [1480, 560], [1430, 950], [800, 1000], [170, 950], [120, 560], [170, 170]];
    for (const points of [ring, [[120, 560], [1480, 560]], [[800, 120], [800, 1000]]]) {
      line(points, '#152f29', 65); line(points, '#666a50', 50); line(points, '#919078', 39); line(points, '#b0a488', 1.5);
    }
    zones.forEach((z, index) => {
      circle(z.x, z.y, 185, '#1e392d', '#33503a', 2);
      const camp = [{ x: z.x - z.sx * 90, y: z.y - z.sy * 100 }, { x: z.x + z.sx * 115, y: z.y - z.sy * 80 }, { x: z.x + z.sx * 110, y: z.y + z.sy * 140 }];
      line([[z.x - z.sx * 190, z.y], [z.x, z.y + z.sy * 50], [z.x + z.sx * 210, z.y + z.sy * 180]], '#756b49', 22);
      camp.forEach((c, tier) => { line([[z.x, z.y + z.sy * 50], [c.x, c.y]], '#756b49', 16); circle(c.x, c.y, 38, '#4e5438', '#697055', 2); circle(c.x, c.y + 3, 16 + tier * 3, '#737969', '#a6ac87', 2); label('T' + (tier + 1), c.x, c.y - 46, ['#a5d29c', '#e7c77e', '#ec9691'][tier], 16); });
      const shop = { x: z.x - z.sx * 100, y: z.y + z.sy * 105 };
      line([[z.x, z.y + z.sy * 50], [shop.x, shop.y]], '#756b49', 16);
      ctx.fillStyle = '#4f4632'; ctx.fillRect(shop.x - 25, shop.y - 10, 50, 34); ctx.fillStyle = '#ba8c50'; ctx.beginPath(); ctx.moveTo(shop.x - 33, shop.y - 10); ctx.lineTo(shop.x, shop.y - 33); ctx.lineTo(shop.x + 33, shop.y - 10); ctx.closePath(); ctx.fill(); label('SHOP', shop.x, shop.y + 40, '#dfc38c', 12);
      label('JUNGLA ' + (index + 1), z.x, z.y + 12, '#b2c3a3', 15);
    });
    // These forest cells are the actual navigation obstacles, not just a painted background.
    for (let i = 0; i < game.blocked.length; i++) if (game.blocked[i]) {
      const p = cellPoint(i); circle(p.x + 2, p.y + 6, 25, '#142d26');
      circle(p.x - 8, p.y - 5, 20, '#31583a'); circle(p.x + 9, p.y - 7, 18, '#3b6240'); circle(p.x, p.y - 13, 17, '#476e43');
    }
    circle(800, 560, 92, '#465653', '#afaa8a', 4); circle(800, 560, 70, '#303d48', '#8b9fa0', 2); circle(800, 560, 47, '#4c4066', '#a49bd3', 2);
    crystal(800, 554, 38); bunny(800, 555, 15, '#f0ddff'); label('CODE JEZGRO', 800, 632, '#c2b4e9', 12);
    game.bases.forEach(b => {
      const t = TEAMS[b.owner];
      ctx.fillStyle = '#283b37'; ctx.fillRect(b.x - 83, b.y - 67, 166, 134); ctx.strokeStyle = t.color; ctx.lineWidth = 2; ctx.strokeRect(b.x - 83, b.y - 67, 166, 134);
      if (selected.includes(b.id)) { ctx.strokeStyle = '#baffb9'; ctx.lineWidth = 3; ctx.strokeRect(b.x - 88, b.y - 72, 176, 144); }
      ctx.fillStyle = '#182d37'; ctx.fillRect(b.x - 43, b.y - 23, 86, 65); ctx.fillStyle = '#496069'; ctx.fillRect(b.x - 35, b.y - 33, 70, 44); ctx.strokeStyle = t.color; ctx.strokeRect(b.x - 35, b.y - 33, 70, 44);
      bunny(b.x, b.y - 31, 21, t.color); circle(b.x, b.y + 24, 10, t.color); label('P' + (b.owner + 1) + ' · TIER 1', b.x, b.y + 84, t.color, 14);
      if (b.owner === game.active) label('TVOJA CENTRALA', b.x, b.y + 101, '#bdc9b3', 9);
    });
    game.nodes.forEach(n => {
      if (selected.includes(n.id)) circle(n.x, n.y, 25, null, '#beffb9', 2);
      crystal(n.x, n.y, 13, !n.remaining); crystal(n.x + 10, n.y + 5, 8, !n.remaining);
    });
    ctx.strokeStyle = '#6f7957'; ctx.lineWidth = 4; ctx.strokeRect(0, 0, WIDTH, HEIGHT);
  }
  function render(now) {
    const dpr = canvas.width / view.width; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, view.width, view.height);
    ctx.save(); ctx.translate(view.width / 2, view.height / 2); ctx.scale(camera.scale, camera.scale); ctx.translate(-camera.x, -camera.y); drawGround();
    for (const u of game.units) {
      const color = TEAMS[u.owner].color;
      if (selected.includes(u.id)) { circle(u.x, u.y + 5, 17, null, '#b4ffa5', 2); if (u.path.length) line([[u.x, u.y], ...u.path.map(p => [p.x, p.y])], '#8bc8a155', 1); }
      circle(u.x, u.y + 7, 11, '#0c1e1f88');
      if (u.type === 'scout') { ctx.save(); ctx.translate(u.x, u.y); ctx.rotate(-.4); ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(12, 13); ctx.lineTo(0, 8); ctx.lineTo(-12, 13); ctx.closePath(); ctx.fill(); ctx.restore(); bunny(u.x, u.y - 3, 8, '#e5ebdb'); }
      else { circle(u.x, u.y + 3, 9, '#c79753', color, 2); bunny(u.x, u.y - 6, 8, '#ede8cf'); if (u.cargo) crystal(u.x + 9, u.y, 6); }
      if (u.mode === 'harvest') { ctx.fillStyle = '#142927'; ctx.fillRect(u.x - 12, u.y - 26, 24, 3); ctx.fillStyle = '#71e2d4'; ctx.fillRect(u.x - 12, u.y - 26, 24 * u.work / RULES.harvestTicks, 3); }
    }
    if (orderMarker && now < orderMarker.until) { const r = 12 + (orderMarker.until - now) / 55; circle(orderMarker.x, orderMarker.y, r, null, '#a7f5b7', 2); }
    ctx.restore();
    if (pointer && distance(pointer.start, pointer.end) > 5) { ctx.fillStyle = '#81e5b922'; ctx.strokeStyle = '#a6efc5'; ctx.lineWidth = 1; const w = pointer.end.x - pointer.start.x, h = pointer.end.y - pointer.start.y; ctx.fillRect(pointer.start.x, pointer.start.y, w, h); ctx.strokeRect(pointer.start.x, pointer.start.y, w, h); }
    mctx.fillStyle = '#243e32'; mctx.fillRect(0, 0, mini.width, mini.height); const sx = mini.width / WIDTH, sy = mini.height / HEIGHT;
    mctx.fillStyle = '#122b23'; game.blocked.forEach((v, i) => { if (v) mctx.fillRect((i % RULES.cols) * RULES.cell * sx, Math.floor(i / RULES.cols) * RULES.cell * sy, RULES.cell * sx, RULES.cell * sy); });
    mctx.strokeStyle = '#888e6a'; mctx.lineWidth = 3; mctx.beginPath(); mctx.moveTo(0, mini.height / 2); mctx.lineTo(mini.width, mini.height / 2); mctx.moveTo(mini.width / 2, 0); mctx.lineTo(mini.width / 2, mini.height); mctx.stroke();
    game.bases.forEach(b => { mctx.fillStyle = TEAMS[b.owner].color; mctx.fillRect(b.x * sx - 5, b.y * sy - 4, 10, 8); });
    game.units.forEach(u => { mctx.fillStyle = TEAMS[u.owner].color; mctx.fillRect(u.x * sx - 1, u.y * sy - 1, 2, 2); });
    mctx.strokeStyle = '#d6ecdd'; mctx.lineWidth = 1; mctx.strokeRect((camera.x - view.width / camera.scale / 2) * sx, (camera.y - view.height / camera.scale / 2) * sy, view.width / camera.scale * sx, view.height / camera.scale * sy);
  }
  function frame(time) {
    const elapsed = lastTime ? Math.max(0, time - lastTime) : 0; lastTime = time;
    // A hidden tab freezes this LOCAL sandbox; no elapsed wall-time income is fabricated.
    if (!document.hidden && started && !game.paused) {
      accumulator += Math.min(elapsed, 1000);
      let count = 0; while (accumulator >= 1000 / RULES.hz && count++ < 20) { step(game); accumulator -= 1000 / RULES.hz; }
    } else accumulator = 0;
    const movement = Math.min(elapsed, 100) * .6 / camera.scale;
    if (keys.has('ArrowLeft')) camera.x -= movement; if (keys.has('ArrowRight')) camera.x += movement; if (keys.has('ArrowUp')) camera.y -= movement; if (keys.has('ArrowDown')) camera.y += movement;
    camera.x = clamp(camera.x, 0, WIDTH); camera.y = clamp(camera.y, 0, HEIGHT);
    render(time); updateHUD(); requestAnimationFrame(frame);
  }
  document.addEventListener('visibilitychange', () => { lastTime = 0; accumulator = 0; keys.clear(); if (document.hidden && started && !game.paused) pause(); });
  window.addEventListener('resize', resize); resize(); updateHUD(); requestAnimationFrame(frame);
  // Small read-only diagnostics for reproducible browser tests.
  root.WHR = Object.freeze({ snapshot: () => JSON.parse(JSON.stringify({ tick: game.tick, active: game.active, running: game.running, paused: game.paused, players: game.players, units: game.units, nodes: game.nodes, selected })) });
})(typeof window !== 'undefined' ? window : globalThis);
