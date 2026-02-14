/* ============================
   CAMINO A LA ALITA BBQ (PIXEL)
   Quiz + Mini-juego + Final Sorpresa
   + BOOST ARCADE (más vida/animación)
   HTML/CSS/JS sin librerías
   ============================ */

/* ========= PERSONALIZA AQUÍ ========= */
const CONFIG = {
  nombreYo: "Anadia",
  nombreTu: "Marvin",
  emojiYo: "👩‍🦰",
  emojiTu: "🧑",
  metaEmoji: "🍗",

  totalSteps: 8,
  miniEvery: 3,
  miniSeconds: 10,
  miniGoal: 3,

  puzzleImage: "foto.jpeg",   // o "foto.png"
  puzzleSize: 4,             // 3 = 3x3 (liviano y fácil)

  secretCode: "ALITAS2023",
  secretMessage: `Mi amor 💖

Gracias por existir en mi vida.
Esta alita es solo el pretexto…
la verdadera recompensa eres tú.

Te amo 🥹🍗✨`,
};

/* Edita preguntas (correct = índice 0..3) */
const QUESTIONS = [
  { q: "¿Dónde fue nuestra primera salida?", a: ["En el cine", "En empachaditos", "En las alitas", "En cheleros"], correct: 3 },
  { q: "¿Cuál es nuestra comida más de 'plan perfecto'?", a: ["Hamburguesas", "Alitas", "Papas", "Pizza"], correct: 1 },
  { q: "¿Qué canción nos pone en modo 'nosotros'?", a: ["Buscandote", "La travesia", "Tengo tu love", "Persona favorita"], correct: 0 },
  { q: "¿cuál es mi flor favorito?", a: ["Girasol", "Tulipan", "petunias", "Rosas"], correct: 3 },
  { q: "¿Cuál es mi color favorito?", a: ["Rojo", "Blanco", "Verde", "Azul"], correct: 3 },
  { q: "¿Cuál es mi detalle favorito de ti?", a: ["Tu risa", "Tu apoyo", "Tu forma de querer", "Todo"], correct: 3 },
];

/* ========= ELEMENTOS DOM ========= */
const elScore = document.getElementById("scoreLbl");
const elProgress = document.getElementById("progressLbl");
const elQCount = document.getElementById("qCount");
const elStreak = document.getElementById("streak");
const elQuestion = document.getElementById("question");
const elAnswers = document.getElementById("answers");
const elToast = document.getElementById("toast");
const elToastText = document.getElementById("toastText");
const btnNext = document.getElementById("btnNext");
const btnRestart = document.getElementById("btnRestart");

/* Overlay mini-juego */
const overlay = document.getElementById("overlay");
const btnCloseMini = document.getElementById("btnCloseMini");
const elTimer = document.getElementById("timer");

/* Overlay final */
const finalOverlay = document.getElementById("finalOverlay");
const finalTitle = document.getElementById("finalTitle");
const finalSubtitle = document.getElementById("finalSubtitle");
const finalStats = document.getElementById("finalStats");
const secretInput = document.getElementById("secretInput");
const btnUnlock = document.getElementById("btnUnlock");
const secretMsg = document.getElementById("secretMsg");
const secretText = document.getElementById("secretText");
const btnCloseFinal = document.getElementById("btnCloseFinal");
const btnPlayAgain = document.getElementById("btnPlayAgain");

/* Canvas principal */
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

/* Canvas mini */
const miniCanvas = document.getElementById("mini");
const mctx = miniCanvas.getContext("2d");
// Puzzle
const puzzleWrap = document.getElementById("puzzleWrap");
const puzzleCanvas = document.getElementById("puzzleCanvas");
const pctx = puzzleCanvas.getContext("2d");
const btnPuzzleShuffle = document.getElementById("btnPuzzleShuffle");
const btnPuzzleHint = document.getElementById("btnPuzzleHint");
const puzzleDone = document.getElementById("puzzleDone");


/* ========= ESTADO ========= */
let idx = 0;
let answered = false;
let score = 0;
let streak = 0;
let step = 0;

let lastChoice = -1;

/* mini-juego */
let miniActive = false;
let miniCaught = 0;
let miniTime = CONFIG.miniSeconds;
let miniTimer = null;
let spawnTimer = null;
let hearts = [];

/* final */
let finalShown = false;

/* BOOST ARCADE */
let tick = 0;   // animación
let wobble = 8; // temblor al acertar

/* ========= UTIL ========= */
function clamp(v, min, max){ return Math.max(min, Math.min(max, v)); }
function rand(min, max){ return Math.random() * (max - min) + min; }

/* Partículas pixel (cuadritos) */
function pixelBurst(x, y, color = "rgba(255,255,255,.8)"){
  const n = Math.floor(rand(10, 16));
  for(let i=0;i<n;i++){
    const p = document.createElement("div");
    p.style.position = "fixed";
    p.style.left = `${x}px`;
    p.style.top = `${y}px`;
    p.style.width = "6px";
    p.style.height = "6px";
    p.style.background = color;
    p.style.imageRendering = "pixelated";
    p.style.zIndex = "60";
    p.style.pointerEvents = "none";
    p.style.transform = "translate(-50%,-50%)";
    p.style.border = "2px solid rgba(0,0,0,.25)";
    p.style.borderRadius = "2px";
    p.style.boxShadow = "0 10px 18px rgba(0,0,0,.25)";

    const dx = rand(-70, 70);
    const dy = rand(-110, -40);
    const rot = rand(-30, 30);

    p.animate([
      { transform:`translate(-50%,-50%) translate(0,0) rotate(0deg)`, opacity: 1 },
      { transform:`translate(-50%,-50%) translate(${dx}px,${dy}px) rotate(${rot}deg)`, opacity: 0 }
    ], { duration: 850, easing: "cubic-bezier(.2,.8,.2,1)" });

    document.body.appendChild(p);
    setTimeout(()=>p.remove(), 900);
  }
}

function setToast(kind, text){
  elToast.style.borderColor = "rgba(255,255,255,.10)";
  elToastText.textContent = text;

  if(kind === "good"){
    elToast.style.borderColor = "rgba(64,247,183,.35)";
  }else if(kind === "bad"){
    elToast.style.borderColor = "rgba(255,95,109,.35)";
  }
}

/* Confetti pixel (usa .pxConf del CSS) */
function pixelConfetti(amount=100, isBad=false){
  const colorsGood = ["#ff4d8d", "#ffb703", "#40f7b7", "#f4f6ff"];
  const colorsBad  = ["#ff5f6d", "#c8cfffb3"];

  for(let i=0; i<amount; i++){
    const d = document.createElement("div");
    d.className = "pxConf";
    const c = isBad ? colorsBad[i % colorsBad.length] : colorsGood[i % colorsGood.length];
    d.style.background = c;

    const x = rand(10, window.innerWidth - 10);
    const y = rand(-20, 30);
    d.style.left = `${x}px`;
    d.style.top  = `${y}px`;

    const dx = rand(-160, 160);
    const dy = rand(260, 520);
    const rot = rand(-180, 180);
    const dur = rand(900, 1400);

    d.animate([
      { transform:`translate(0,0) rotate(0deg)`, opacity: 1 },
      { transform:`translate(${dx}px, ${dy}px) rotate(${rot}deg)`, opacity: 0 }
    ], { duration: dur, easing: "cubic-bezier(.2,.8,.2,1)" });

    document.body.appendChild(d);
    setTimeout(()=> d.remove(), dur + 60);
  }
}

/* ========= DIBUJO PIXEL EN CANVAS ========= */

function pxRect(x,y,w,h, fill, stroke){
  ctx.fillStyle = fill;
  ctx.fillRect(x,y,w,h);
  if(stroke){
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 4;
    ctx.strokeRect(x,y,w,h);
  }
}

function pxText(text, x, y, color="#f4f6ff", size=14, align="left"){
  ctx.fillStyle = color;
  ctx.font = `${size}px "Press Start 2P", ui-monospace, monospace`;
  ctx.textAlign = align;
  ctx.textBaseline = "top";
  ctx.fillText(text, x, y);
}

/* ===== drawScene MEJORADO (más vida + parpadeo + bob + wobble) ===== */
function drawScene(){
  const W = canvas.width;
  const H = canvas.height;

  tick++;
  const tw = Math.sin(tick * 0.08);

  ctx.save();

  if(wobble > 0){
    const s = wobble * 0.6;
    ctx.translate(rand(-s, s), rand(-s, s));
    wobble = Math.max(0, wobble - 1);
  }

  ctx.clearRect(0,0,W,H);

  // fondo más colorido (degradado)
  const g = ctx.createLinearGradient(0,0,W,H);
  g.addColorStop(0, "#0b0f1a");
  g.addColorStop(0.5, "#160b2a");
  g.addColorStop(1, "#0b1a2a");
  ctx.fillStyle = g;
  ctx.fillRect(0,0,W,H);

  // estrellitas con parpadeo + movimiento suave
  for(let i=0;i<60;i++){
    const x = (i*37 + tick*2) % W;
    const y = (i*61 + Math.sin((tick+i)*0.03)*6) % (H*0.55);
    const a = 0.06 + (i%7)*0.012 + (tw*0.01);
    ctx.fillStyle = `rgba(255,255,255,${0.06 + (i%7)*0.012 + (tw*0.01)})`;
    ctx.fillRect(x, y, 2, 2);
  }

  // suelo
  ctx.fillStyle = "#0f1627";
  ctx.fillRect(0, H*0.58, W, H*0.42);

  // luces neón en el suelo
  ctx.fillStyle = "rgba(34,211,238,.10)";
  ctx.fillRect(0, H*0.58, W, 6);

  // camino
  const pathY = Math.floor(H*0.70);
  ctx.fillStyle = "rgba(255,255,255,.10)";
  ctx.fillRect(Math.floor(W*0.08), pathY, Math.floor(W*0.84), 10);

  // pasos
  const startX = Math.floor(W*0.10);
  const endX = Math.floor(W*0.90);
  const span = endX - startX;

  for(let i=0;i<=CONFIG.totalSteps;i++){
    const x = startX + Math.floor((span * i) / CONFIG.totalSteps);
    const active = i <= step;

    ctx.fillStyle = active ? "#ff4d8d" : "rgba(255,255,255,.18)";
    ctx.fillRect(x-4, pathY-12, 8, 8);

    ctx.fillStyle = active ? "rgba(255,183,3,.65)" : "rgba(255,255,255,.12)";
    ctx.fillRect(x-2, pathY-10, 4, 4);

    if(active){
      ctx.fillStyle = "rgba(255,77,141,.18)";
      ctx.fillRect(x-8, pathY-16, 16, 16);
    }
  }

  // meta
  const goalX = endX - 18;
  const goalY = pathY - 72;

  pxRect(goalX-22, goalY-6, 72, 72, "rgba(255,183,3,.18)", "rgba(255,255,255,.14)");
  pxText(CONFIG.metaEmoji, goalX+6, goalY+12, "#fff", 28, "left");
  pxText("META", goalX+14, goalY+48, "rgba(255,255,255,.70)", 10, "left");

  // brillo meta
  ctx.fillStyle = "rgba(255,183,3,.10)";
  ctx.fillRect(goalX-30, goalY-14, 90, 90);

  // personajes
  const t = step / CONFIG.totalSteps;
  const bob = Math.sin(tick*0.12) * 2;
  const charX = startX + Math.floor(span * t);
  const charY = Math.floor(pathY - 86 + bob);

  // sombra
  ctx.fillStyle = "rgba(0,0,0,.38)";
  ctx.fillRect(charX-18, pathY-2, 40, 8);

  // cajas
  pxRect(charX-28, charY, 44, 44, "rgba(255,255,255,.12)", "rgba(255,255,255,.16)");
  pxRect(charX+18, charY, 44, 44, "rgba(255,255,255,.12)", "rgba(255,255,255,.16)");

  // emojis
  pxText(CONFIG.emojiYo, charX-16, charY+10, "#fff", 20, "left");
  pxText(CONFIG.emojiTu, charX+30, charY+10, "#fff", 20, "left");

  // nombres
  pxText(CONFIG.nombreYo.toUpperCase(), charX-30, charY+48, "rgba(255,255,255,.75)", 8, "left");
  pxText(CONFIG.nombreTu.toUpperCase(), charX+16, charY+48, "rgba(255,255,255,.75)", 8, "left");

  // mensaje si llegó
  if(step >= CONFIG.totalSteps){
    pxRect(Math.floor(W*0.14), Math.floor(H*0.16), Math.floor(W*0.72), Math.floor(H*0.26),
      "rgba(0,0,0,.38)", "rgba(255,255,255,.14)");
    pxText("¡LO LOGRAMOS!", Math.floor(W*0.50), Math.floor(H*0.20), "#ffb703", 16, "center");
    pxText("ALITAS BBQ + ABRAZOS", Math.floor(W*0.50), Math.floor(H*0.26), "#f4f6ff", 10, "center");
    pxText("❤️ Desbloquea la sorpresa arriba", Math.floor(W*0.50), Math.floor(H*0.32), "rgba(255,255,255,.75)", 8, "center");
  }

  ctx.restore();
}

/* ========= QUIZ ========= */

function renderQuestion(){
  const q = QUESTIONS[idx];

  elQCount.textContent = `Pregunta ${idx + 1} / ${QUESTIONS.length}`;
  elStreak.textContent = `Racha: ${streak}`;
  elScore.textContent = score;
  elProgress.textContent = `${Math.round((step / CONFIG.totalSteps) * 100)}%`;

  elQuestion.textContent = q.q;
  elAnswers.innerHTML = "";
  answered = false;
  lastChoice = -1;
  btnNext.disabled = true;

  setToast("neutral", "Elige una opción para avanzar.");
  drawScene();

  q.a.forEach((txt, i) => {
    const b = document.createElement("button");
    b.className = "btn";
    b.type = "button";
    b.textContent = txt;

    b.addEventListener("pointerup", (ev) => {
      ev.preventDefault();
      chooseAnswer(i, b);
    });

    elAnswers.appendChild(b);
  });
}

function lockAnswers(){
  [...elAnswers.querySelectorAll("button")].forEach(btn => btn.disabled = true);
}

function highlightAnswers(correctIndex){
  const buttons = [...elAnswers.querySelectorAll("button")];
  buttons.forEach((b, i) => {
    if(i === correctIndex){
      b.style.borderColor = "rgba(64,247,183,.35)";
      b.style.background = "rgba(64,247,183,.12)";
    }
    if(i === lastChoice && i !== correctIndex){
      b.style.borderColor = "rgba(255,95,109,.35)";
      b.style.background = "rgba(255,95,109,.10)";
    }
  });
}

function chooseAnswer(i, btn){
  if(answered || miniActive) return;

  answered = true;
  lastChoice = i;

  const q = QUESTIONS[idx];
  const ok = (i === q.correct);

  lockAnswers();
  highlightAnswers(q.correct);

  const r = btn.getBoundingClientRect();
  pixelBurst(r.left + r.width/2, r.top + r.height/2, ok ? "rgba(64,247,183,.9)" : "rgba(255,95,109,.9)");

  if(ok){
    score += 1;
    streak += 1;
    if(step < CONFIG.totalSteps) step += 1;

    wobble = 8; // BOOST: temblor al acertar

    setToast("good", "¡Correcto! Avanzan juntitos 💘");
    pixelBurst(window.innerWidth*0.5, window.innerHeight*0.35, "rgba(255,183,3,.9)");
  }else{
    streak = 0;
    setToast("bad", "Casi 😅 ¡Siguiente y seguimos!");
  }

  elScore.textContent = score;
  elStreak.textContent = `Racha: ${streak}`;
  elProgress.textContent = `${Math.round((step / CONFIG.totalSteps) * 100)}%`;
  drawScene();

  btnNext.disabled = false;

  if(step >= CONFIG.totalSteps && !finalShown){
    finalShown = true;
    setTimeout(() => showFinal("meta"), 450);
  }
}

/* ========= FLUJO SIGUIENTE ========= */
function next(){
  if(miniActive) return;

  const nextIndex = idx + 1;

  if(nextIndex < QUESTIONS.length){
    idx = nextIndex;

    if(idx % CONFIG.miniEvery === 0 && step < CONFIG.totalSteps){
      openMiniGame();
      return;
    }

    renderQuestion();
  }else{
    setToast("good", "Fin del quiz 💖 ¡Vamos por la sorpresa!");
    btnNext.disabled = true;
    drawScene();
    if(!finalShown){
      finalShown = true;
      setTimeout(() => showFinal("end"), 450);
    }
  }
}

function restart(){
  idx = 0;
  answered = false;
  score = 0;
  streak = 0;
  step = 0;
  finalShown = false;
  wobble = 0;

  closeMiniGame(true);
  hideFinal(true);

  btnNext.disabled = true;
  renderQuestion();
}

/* ========= MINI-JUEGO ========= */

function openMiniGame(){
  miniActive = true;
  miniCaught = 0;
  miniTime = CONFIG.miniSeconds;
  hearts = [];

  overlay.style.display = "grid";
  overlay.setAttribute("aria-hidden", "false");
  btnCloseMini.textContent = "Listo";

  updateMiniHud();
  drawMini();

  miniTimer = setInterval(() => {
    miniTime -= 1;
    updateMiniHud();
    if(miniTime <= 0){
      endMiniGame(false);
    }
  }, 1000);

  spawnTimer = setInterval(() => {
    spawnHeart();
  }, 550);

  miniCanvas.addEventListener("pointerup", onMiniPointer);
}

function closeMiniGame(silent=false){
  miniActive = false;

  if(miniTimer){ clearInterval(miniTimer); miniTimer = null; }
  if(spawnTimer){ clearInterval(spawnTimer); spawnTimer = null; }

  miniCanvas.removeEventListener("pointerup", onMiniPointer);

  overlay.style.display = "none";
  overlay.setAttribute("aria-hidden", "true");
}

function updateMiniHud(){
  elTimer.textContent = `Tiempo: ${miniTime}s • ${miniCaught}/${CONFIG.miniGoal}`;
}

function spawnHeart(){
  const W = miniCanvas.width;
  const H = miniCanvas.height;
  const x = rand(40, W - 40);
  const y = rand(50, H - 40);

  hearts.push({ x, y, alive: true, born: performance.now() });

  const now = performance.now();
  hearts = hearts.filter(h => h.alive && (now - h.born) < 1400);

  drawMini();
}

function drawMini(){
  const W = miniCanvas.width;
  const H = miniCanvas.height;

  mctx.clearRect(0,0,W,H);

  // fondo más vivo
  const g = mctx.createLinearGradient(0,0,W,H);
  g.addColorStop(0, "#0b0f1a");
  g.addColorStop(1, "#1a0b24");
  mctx.fillStyle = g;
  mctx.fillRect(0,0,W,H);

  // cuadricula
  mctx.fillStyle = "rgba(255,255,255,.05)";
  for(let x=0; x<W; x+=16) mctx.fillRect(x, 0, 1, H);
  for(let y=0; y<H; y+=16) mctx.fillRect(0, y, W, 1);

  // texto
  mctx.fillStyle = "rgba(255,255,255,.80)";
  mctx.font = `10px "Press Start 2P", ui-monospace, monospace`;
  mctx.fillText("ATRAPA LOS CORAZONES", 16, 14);

  // corazones
  hearts.forEach(h => {
    if(!h.alive) return;
    mctx.font = `22px "Press Start 2P", ui-monospace, monospace`;
    mctx.fillText("💖", h.x - 10, h.y - 12);
  });

  // marco
  mctx.strokeStyle = "rgba(255,255,255,.14)";
  mctx.lineWidth = 4;
  mctx.strokeRect(2,2,W-4,H-4);
}

function onMiniPointer(ev){
  if(!miniActive) return;

  const rect = miniCanvas.getBoundingClientRect();
  const px = (ev.clientX - rect.left) * (miniCanvas.width / rect.width);
  const py = (ev.clientY - rect.top) * (miniCanvas.height / rect.height);

  let hit = false;
  for(const h of hearts){
    if(!h.alive) continue;
    const dx = px - h.x;
    const dy = py - h.y;
    if(Math.hypot(dx,dy) < 26){
      h.alive = false;
      hit = true;
      miniCaught += 1;
      pixelBurst(ev.clientX, ev.clientY, "rgba(255,77,141,.95)");
      break;
    }
  }

  if(hit){
    updateMiniHud();
    drawMini();
    if(miniCaught >= CONFIG.miniGoal){
      endMiniGame(true);
    }
  }
}

function endMiniGame(success){
  if(miniTimer){ clearInterval(miniTimer); miniTimer = null; }
  if(spawnTimer){ clearInterval(spawnTimer); spawnTimer = null; }

  if(success){
    step = clamp(step + 2, 0, CONFIG.totalSteps);
    score += 2;

    wobble = 10; // pequeño festejo

    setToast("good", "¡Reto logrado! Bonus +2 pasos 😈💖");
    elScore.textContent = score;
    elProgress.textContent = `${Math.round((step / CONFIG.totalSteps) * 100)}%`;
    drawScene();

    if(step >= CONFIG.totalSteps && !finalShown){
      finalShown = true;
      setTimeout(() => showFinal("meta"), 450);
    }
  }else{
    setToast("neutral", "Reto terminado. ¡Seguimos con el quiz! ✨");
  }

  closeMiniGame();
  renderQuestion();
}

/* ========= FINAL (Sorpresa) ========= */
function showFinal(reason="meta"){
  finalOverlay.style.display = "grid";
  finalOverlay.setAttribute("aria-hidden", "false");

  const pct = `${Math.round((step / CONFIG.totalSteps) * 100)}%`;
  finalStats.textContent = `❤️ ${score} • 🧭 ${pct}`;

  if(reason === "meta"){
    finalTitle.textContent = "¡Nivel completado! 💘";
    finalSubtitle.textContent = "Llegaron juntitos a la meta… ahora viene la sorpresa 😈🍗";
  }else{
    finalTitle.textContent = "¡Fin del juego! 💖";
    finalSubtitle.textContent = "Gracias por jugar… ¿desbloqueamos la sorpresa? 🔐";
  }

  secretInput.value = "";
  secretMsg.style.display = "none";
  secretText.textContent = "";

  pixelConfetti(150);
}

function hideFinal(){
  finalOverlay.style.display = "none";
  finalOverlay.setAttribute("aria-hidden", "true");
}

function tryUnlock(){
  const typed = (secretInput.value || "").trim().toUpperCase();
  const code = (CONFIG.secretCode || "").trim().toUpperCase();

  if(!typed) return;

  if(typed === code){
    secretMsg.style.display = "block";
    secretText.textContent = CONFIG.secretMessage;

    pixelConfetti(200);
    setToast("good", "¡Sorpresa desbloqueada! 💖");
        // mostrar puzzle cuando desbloquea código
    initPuzzle();

  }else{
    setToast("bad", "Código incorrecto 😅 Pista: algo de ustedes + números...");
    pixelConfetti(35, true);
  }
}
/* ========= PUZZLE (rompecabezas) ========= */
let pImg = null;
let pN = 3;
let tiles = [];
let sel = -1;
let showHint = false;

function initPuzzle(){
  puzzleDone.style.display = "none";
  puzzleWrap.style.display = "block";

  pN = clamp(CONFIG.puzzleSize || 3, 2, 5);
  pImg = new Image();
  pImg.src = CONFIG.puzzleImage || "foto.jpg";
  pImg.onload = () => {
    buildTiles();
    shuffleTiles();
    drawPuzzle();
  };
  pImg.onerror = () => {
    // Si no carga la imagen
    pctx.clearRect(0,0,puzzleCanvas.width,puzzleCanvas.height);
    pctx.fillStyle = "rgba(255,255,255,.85)";
    pctx.font = `10px "Press Start 2P", ui-monospace, monospace`;
    pctx.fillText("No se pudo cargar foto.jpg", 18, 30);
  };
}

function buildTiles(){
  const total = pN * pN;
  tiles = Array.from({length: total}, (_,i)=> i); // estado resuelto
  sel = -1;
  showHint = false;
}

function shuffleTiles(){
  // mezcla asegurando que no quede resuelto
  for(let i=0;i<200;i++){
    const a = Math.floor(Math.random()*tiles.length);
    const b = Math.floor(Math.random()*tiles.length);
    [tiles[a], tiles[b]] = [tiles[b], tiles[a]];
  }
  if(isSolved()){
    // si por suerte quedó resuelto, mezcla un poco más
    for(let i=0;i<40;i++){
      const a = Math.floor(Math.random()*tiles.length);
      const b = Math.floor(Math.random()*tiles.length);
      [tiles[a], tiles[b]] = [tiles[b], tiles[a]];
    }
  }
  sel = -1;
  puzzleDone.style.display = "none";
}

function isSolved(){
  for(let i=0;i<tiles.length;i++){
    if(tiles[i] !== i) return false;
  }
  return true;
}

function drawPuzzle(){
  const W = puzzleCanvas.width;
  const H = puzzleCanvas.height;
  pctx.clearRect(0,0,W,H);

  // fondo
  pctx.fillStyle = "rgba(0,0,0,.25)";
  pctx.fillRect(0,0,W,H);

  if(!pImg) return;

  const tileW = Math.floor(W / pN);
  const tileH = Math.floor(H / pN);

  // “hint” (ver foto completa tenue)
  if(showHint){
    pctx.globalAlpha = 0.25;
    pctx.drawImage(pImg, 0,0,W,H);
    pctx.globalAlpha = 1;
  }

  for(let pos=0; pos<tiles.length; pos++){
    const id = tiles[pos];

    const sx = (id % pN) * (pImg.width / pN);
    const sy = Math.floor(id / pN) * (pImg.height / pN);
    const sw = (pImg.width / pN);
    const sh = (pImg.height / pN);

    const dx = (pos % pN) * tileW;
    const dy = Math.floor(pos / pN) * tileH;

    pctx.drawImage(pImg, sx, sy, sw, sh, dx, dy, tileW, tileH);

    // bordes tipo pixel
    pctx.strokeStyle = "rgba(255,255,255,.18)";
    pctx.lineWidth = 4;
    pctx.strokeRect(dx+2, dy+2, tileW-4, tileH-4);

    // selección
    if(pos === sel){
      pctx.strokeStyle = "rgba(34,211,238,.55)";
      pctx.lineWidth = 6;
      pctx.strokeRect(dx+4, dy+4, tileW-8, tileH-8);
    }
  }

  // texto arriba
  pctx.fillStyle = "rgba(255,255,255,.85)";
  pctx.font = `10px "Press Start 2P", ui-monospace, monospace`;
  pctx.fillText("TOCA 2 PIEZAS PARA CAMBIAR", 14, 14);
}

function puzzlePosFromEvent(ev){
  const rect = puzzleCanvas.getBoundingClientRect();
  const x = (ev.clientX - rect.left) * (puzzleCanvas.width / rect.width);
  const y = (ev.clientY - rect.top) * (puzzleCanvas.height / rect.height);

  const tileW = puzzleCanvas.width / pN;
  const tileH = puzzleCanvas.height / pN;

  const col = clamp(Math.floor(x / tileW), 0, pN-1);
  const row = clamp(Math.floor(y / tileH), 0, pN-1);
  return row * pN + col;
}

function onPuzzleTap(ev){
  if(!pImg) return;

  const pos = puzzlePosFromEvent(ev);

  if(sel === -1){
    sel = pos;
    sfxClick?.();
    drawPuzzle();
    return;
  }

  if(sel === pos){
    sel = -1;
    drawPuzzle();
    return;
  }

  // intercambiar
  [tiles[sel], tiles[pos]] = [tiles[pos], tiles[sel]];
  sel = -1;

  drawPuzzle();

  if(isSolved()){
    puzzleDone.style.display = "block";
    pixelConfetti(180);
    sfxWin?.();
  }
}


/* ========= EVENTOS ========= */
btnNext.addEventListener("pointerup", (e) => { e.preventDefault(); next(); });
btnRestart.addEventListener("pointerup", (e) => { e.preventDefault(); restart(); });
btnCloseMini.addEventListener("pointerup", (e) => { e.preventDefault(); endMiniGame(false); });

btnUnlock.addEventListener("pointerup", (e) => { e.preventDefault(); tryUnlock(); });
secretInput.addEventListener("keydown", (e) => { if(e.key === "Enter") tryUnlock(); });

btnCloseFinal.addEventListener("pointerup", (e) => { e.preventDefault(); hideFinal(); });
btnPlayAgain.addEventListener("pointerup", (e) => { e.preventDefault(); hideFinal(); restart(); });

puzzleCanvas.addEventListener("pointerup", (e)=>{ e.preventDefault(); onPuzzleTap(e); });
btnPuzzleShuffle.addEventListener("pointerup", (e)=>{ e.preventDefault(); shuffleTiles(); drawPuzzle(); });
btnPuzzleHint.addEventListener("pointerup", (e)=>{
  e.preventDefault();
  showHint = !showHint;
  btnPuzzleHint.textContent = showHint ? "Quitar ayudita" : "Ayudita";
  drawPuzzle();
});

/* ========= RESPONSIVO ========= */
window.addEventListener("resize", () => {
  drawScene();
  if(miniActive) drawMini();
});

/* ========= INIT ========= */
(function init(){
  setToast("neutral", "Elige una opción para avanzar.");
  renderQuestion();
})();
