import { init } from '@masabando/easy-three';
import { splitBlock } from './logic.js';
import './style.css';

const $ = (id) => document.getElementById(id);
let best = 0;
try { best = Math.max(0, Number(localStorage.getItem('nabari-neon-best')) || 0); } catch {}
$('best').textContent = String(best).padStart(2, '0');
let sound = false, audio;
const bgm = $('bgm');
bgm.volume = .3;
const tracks = [
  { title: 'Midnight Groove', file: 'midnight-groove.mp3' },
  { title: 'Softly Offbeat', file: 'softly-offbeat.mp3' },
  { title: 'Velvet Steps', file: 'velvet-steps.mp3' },
  { title: 'Gently Syncopated', file: 'gently-syncopated.mp3' },
];
let currentTrack;
function selectTrack() {
  // Avoid repeating the same track on consecutive plays.
  const choices = tracks.filter(track => track !== currentTrack);
  currentTrack = choices[Math.floor(Math.random() * choices.length)];
  bgm.pause();
  bgm.src = `${import.meta.env.BASE_URL}audio/${currentTrack.file}`;
  $('track-title').textContent = currentTrack.title;
  $('track-credit').hidden = false;
  syncMusic();
}
function syncMusic() {
  $('track-credit').classList.toggle('muted', !sound);
  if (sound && currentTrack && !document.hidden) {
    // Playback can be interrupted by a retry or blocked by the browser.
    bgm.play().catch(() => {});
  } else bgm.pause();
}
document.addEventListener('visibilitychange', syncMusic);
function tone(frequency, duration = .13) {
  if (!sound) return;
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    audio.resume();
    const osc = audio.createOscillator(), gain = audio.createGain();
    osc.type = 'sine'; osc.frequency.setValueAtTime(frequency, audio.currentTime);
    gain.gain.setValueAtTime(.09, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + duration);
    osc.connect(gain).connect(audio.destination); osc.start(); osc.stop(audio.currentTime + duration);
  } catch {}
}
$('sound').onclick = () => {
  sound = !sound;
  $('sound').textContent = sound ? 'SOUND ON' : 'SOUND OFF';
  $('sound').setAttribute('aria-pressed', String(sound));
  if (sound && !currentTrack) selectTrack(); else syncMusic();
  tone(660);
};
$('fullscreen').onclick = async () => { try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); } catch {} };

try { boot(); } catch (error) { console.error(error); $('load-error').hidden = false; $('intro').hidden = true; }
function boot() {
  const { THREE, scene, camera, renderer, create } = init('#stage', { pixelRatio: Math.min(devicePixelRatio, 1.5) });
  renderer.shadowMap.enabled = false;
  renderer.toneMapping = THREE.NoToneMapping;
  camera.fov = 36; camera.updateProjectionMatrix();
  scene.add(new THREE.AmbientLight(0xb6cbff, 2));
  const light = new THREE.DirectionalLight(0xe4f5ff, 2.6); light.position.set(4, 9, 5); scene.add(light);
  const rim = new THREE.DirectionalLight(0x9060ff, 1.8); rim.position.set(-5, 4, -3); scene.add(rim);
  const grid = new THREE.GridHelper(100, 60, 0x164651, 0x18243e); grid.position.y = -.62;
  grid.material.transparent = true; grid.material.opacity = .4; scene.add(grid);
  scene.fog = new THREE.FogExp2(0x0b1022, .023);
  const blocks = [], debris = [], rings = [];
  const height = .48;
  let state = 'ready', score = 0, combo = 0, active, top, axis = 'x', phase = 0;
  let started = 0, lastAction = 0, finishedAt = 0, feedbackUntil = 0, cameraY = 3;
  const palette = ['#51eee3','#4cd5ef','#619afa','#9278f4','#c672ed','#f378c4','#ff92a0'];
  function colorFor(n) { return palette[Math.floor(n / 3) % palette.length]; }
  function box(x, y, z, w, d, color, h = height) {
    const mesh = create.box({ size: [w, h, d], position: [x, y, z], material: 'Lambert',
      option: { color, emissive: color, emissiveIntensity: .16 }, castShadow: false, receiveShadow: false });
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), new THREE.LineBasicMaterial({ color, transparent: true, opacity: .8 }));
    mesh.add(edges); mesh.userData = { w, d }; return mesh;
  }
  function dispose(mesh) { scene.remove(mesh); mesh.traverse(o => { o.geometry?.dispose(); if (o.material) o.material.dispose(); }); }
  const plinth = box(0, -.37, 0, 4.4, 4.4, '#173044', .35);
  function clear() { [...blocks, ...debris.map(d => d.mesh), ...rings.map(r => r.mesh)].forEach(dispose); blocks.length = debris.length = rings.length = 0; active = null; }
  function base() { top = box(0, 0, 0, 3.5, 3.5, '#39bfbf'); blocks.push(top); }
  function demo() {
    base();
    for (let i = 1; i <= 8; i++) { top = box(Math.sin(i * .8) * .14, i * height, 0, 3.5-i*.17, 3.5-i*.12, colorFor(i*2)); blocks.push(top); }
    active = box(-3, 9*height, 0, 2.14, 2.54, '#73fff0'); blocks.push(active);
  }
  demo();
  function spawn() {
    axis = score % 2 === 0 ? 'x' : 'z'; phase = -Math.PI / 2;
    active = box(top.position.x, (score + 1) * height, top.position.z, top.userData.w, top.userData.d, colorFor(score));
    active.position[axis] -= 5; blocks.push(active);
  }
  function start() {
    selectTrack();
    clear(); score = combo = 0; state = 'playing'; started = performance.now(); lastAction = started;
    base(); spawn(); document.body.classList.add('playing'); $('intro').hidden = true; $('result').hidden = true;
    $('score').textContent = '00'; $('stack').hidden = false; $('feedback').textContent = '';
    tone(440);
  }
  function fall(mesh, direction = 1) { debris.push({ mesh, v: 0, spin: direction, age: 0 }); const i = blocks.indexOf(mesh); if (i >= 0) blocks.splice(i, 1); }
  function finish(timeout = false) {
    state = 'over'; finishedAt = performance.now();
    if (active) { fall(active); active = null; }
    const record = score > best;
    best = Math.max(best, score); try { localStorage.setItem('nabari-neon-best', best); } catch {}
    $('best').textContent = String(best).padStart(2, '0'); $('final-score').textContent = score;
    $('result-label').textContent = record ? '最高記録更新' : timeout ? 'TIME UP' : 'NICE TRY';
    $('result-message').textContent = record ? '最高記録更新！ 次は、もう一段上へ。' : score === 0 ? '真ん中に重なった瞬間に、タップまたはスペース！' : `最高記録更新まで、${Math.max(1, best - score + 1)}段。もう一度、挑戦しよう。`;
    $('result').hidden = false; $('stack').hidden = true; $('feedback').textContent = ''; tone(150, .4);
  }
  function pulse() {
    const mesh = new THREE.Mesh(new THREE.RingGeometry(.6, .65, 48), new THREE.MeshBasicMaterial({ color: 0x96fff1, transparent: true, opacity: .8, side: THREE.DoubleSide, depthWrite: false }));
    mesh.rotation.x = -Math.PI / 2; mesh.position.set(top.position.x, top.position.y+.26, top.position.z); scene.add(mesh); rings.push({mesh, age:0});
  }
  function action() {
    const now = performance.now();
    if (state === 'ready') return start();
    if (state === 'over') { if (now-finishedAt > 650) start(); return; }
    if (now-lastAction < 180) return;
    lastAction = now;
    if (now-started >= 60000) return finish(true);
    const sizeKey = axis === 'x' ? 'w' : 'd';
    const cut = splitBlock(active.position[axis], top.position[axis], top.userData[sizeKey]);
    if (cut.miss) return finish();
    const pos = active.position.clone(), dims = {...active.userData};
    const old = active; blocks.splice(blocks.indexOf(old), 1); dispose(old);
    pos[axis] = cut.center; dims[sizeKey] = cut.size;
    top = box(pos.x, pos.y, pos.z, dims.w, dims.d, colorFor(score)); blocks.push(top);
    if (cut.cut > 0) { const p = pos.clone(); p[axis] = cut.cutCenter; const d = {...dims}; d[sizeKey] = cut.cut;
      fall(box(p.x, p.y, p.z, d.w, d.d, colorFor(score)), Math.sign(cut.cutCenter-cut.center)); }
    score++; combo = cut.perfect ? combo+1 : 0;
    $('score').textContent = String(score).padStart(2,'0');
    $('feedback').textContent = cut.perfect ? `PERFECT${combo > 1 ? ' ×'+combo : ''}` : '';
    feedbackUntil = now + 850;
    if (cut.perfect) pulse(); tone(cut.perfect ? 660 + Math.min(combo,8)*70 : 330 + score*8);
    spawn();
  }
  $('start').onclick = action; $('retry').onclick = action; $('stack').onclick = action;
  $('stage').addEventListener('pointerdown', e => { if (e.isPrimary && e.button === 0) action(); });
  window.addEventListener('keydown', e => { if (e.code === 'Space' && !e.target.closest('#sound, #fullscreen')) { e.preventDefault(); if (!e.repeat) action(); } });
  const resize = () => { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth/innerHeight; camera.updateProjectionMatrix(); };
  window.addEventListener('resize', resize); resize();
  renderer.domElement.addEventListener('webglcontextlost', e => { e.preventDefault(); $('load-error').hidden = false; $('intro').hidden = true; $('result').hidden = true; renderer.setAnimationLoop(null); });
  let previous = performance.now();
  renderer.setAnimationLoop(now => {
    const dt = Math.min((now-previous)/1000, .05); previous = now;
    if (state === 'playing') {
      const remaining = Math.max(0, 60 - (now-started)/1000);
      $('time').innerHTML = `${Math.ceil(remaining)}<span>s</span>`; $('time-bar').value = remaining;
      if (!remaining) finish(true);
      else { phase += dt * Math.min(1.05 + score*.045, 2.8); active.position[axis] = top.position[axis] + Math.sin(phase)*5; }
    } else if (state === 'ready') active.position.x = Math.sin(now*.00065)*3.5;
    if (now > feedbackUntil) $('feedback').textContent = '';
    for (let i=debris.length-1;i>=0;i--) { const d=debris[i]; d.age+=dt; d.v-=16*dt; d.mesh.position.y+=d.v*dt; d.mesh.rotation.z+=dt*d.spin*1.8; d.mesh.rotation.x+=dt*.4; if(d.age>2){dispose(d.mesh);debris.splice(i,1);} }
    for(let i=rings.length-1;i>=0;i--){ const r=rings[i];r.age+=dt;r.mesh.scale.setScalar(1+r.age*5);r.mesh.material.opacity=Math.max(0,.8-r.age);if(r.age> .8){dispose(r.mesh);rings.splice(i,1);} }
    const portrait = innerWidth <= 760;
    // Leave room above the active layer for the mobile score panel.
    const targetY = state === 'ready' ? 2.1 : state === 'over' ? score*height*.5 : Math.max(1.1, score*height + (portrait ? 1.4 : -1.2));
    cameraY += (targetY-cameraY)*Math.min(1,dt*(portrait && state === 'playing' ? 6 : 3));
    const distance = state === 'over' ? Math.max(17,score*height*1.6) : 18;
    camera.position.set(distance*.65,cameraY+distance*.66,distance*.85);
    camera.lookAt(state === 'ready' ? (portrait ? -.3 : -1.5) : 0,cameraY,0);
    renderer.render(scene,camera);
  });
}
