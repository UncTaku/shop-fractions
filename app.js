// ---------------------------------------------------------------------------
// App logic. Mental model: a "deck" is just an array of card indexes.
//   - Start of round: shuffle all indexes into the deck.
//   - Right answer -> card leaves the deck (+ confetti).
//   - Wrong answer -> card goes back in a few spots later, so you see it again
//                     soon (a poor man's spaced repetition).
//   - Deck empty   -> round over.
//
// Each card is asked one of two ways:
//   "frac": show fraction, TYPE the decimal   (checked by checkDecimal)
//   "dec":  show decimal,  PICK the fraction  (4 choices, nearest neighbors)
// ---------------------------------------------------------------------------

const $ = (id) => document.getElementById(id);
const MODES = ["frac", "dec", "mixed"];
const REINSERT_GAP = 3; // how many cards later a missed one comes back

let deck = [];
let current = null;   // { i: card index, side: "frac" | "dec", answered: bool }
let firstTry = 0;     // cards gotten right on first sight
let seenMiss = new Set();

// ---------------------------------------------------------------------------
// The answer rule (shop rule: read to x.xxx or x.xxxx):
//   - optional leading 0, then a ".", then exactly 3 or 4 digits
//   - .625 / 0.625 / .6250 / 0.6250  -> accepted for 5/8
//   - .6 / .63 / 6 / abc             -> FORMAT error (not graded, try again)
//   - 3 digits only counts if it's exact: 1/16 = .0625, so ".062" is wrong.
//     Padding "625" -> "6250" and comparing to "6250" handles that for free.
// Returns "right" | "wrong" | "format".
// ---------------------------------------------------------------------------
const DECIMAL_RE = /^0?\.(\d{3,4})$/;

function checkDecimal(input, correctDec) {
  const m = input.trim().match(DECIMAL_RE);
  if (!m) return "format";
  const typed = m[1].padEnd(4, "0");     // "625" -> "6250"
  const want = correctDec.split(".")[1]; // "0.6250" -> "6250"
  return typed === want ? "right" : "wrong";
}

// Fisher–Yates shuffle: the standard unbiased way to shuffle an array.
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// localStorage can throw (private mode etc.), so wrap it.
// Also guard against an old saved value (like "spoken") from v1.
function loadMode() {
  try {
    const m = localStorage.getItem("mode");
    return MODES.includes(m) ? m : "frac";
  } catch { return "frac"; }
}
function saveMode(m) {
  try { localStorage.setItem("mode", m); } catch {}
}

function startRound() {
  deck = shuffle(CARDS.map((_, i) => i));
  firstTry = 0;
  seenMiss = new Set();
  $("done").hidden = true;
  $("card").hidden = false;
  next();
}

function next() {
  if (deck.length === 0) return finish();

  const mode = $("mode").value;
  const i = deck[0];
  const side = mode === "mixed" ? (Math.random() < 0.5 ? "frac" : "dec") : mode;
  current = { i, side, answered: false };

  const c = CARDS[i];
  if (side === "frac") {
    $("prompt-label").textContent = "What's the decimal?";
    $("prompt").textContent = c.frac;
    $("prompt-sub").textContent = "";
  } else {
    $("prompt-label").textContent = "What's the fraction?";
    $("prompt").textContent = c.dec;
    $("prompt-sub").textContent = c.spoken;
  }

  // Fill in the back now; it's hidden until answered.
  $("a-frac").textContent = c.frac;
  $("a-equiv").textContent = c.equiv.length ? "= " + c.equiv.join(" = ") : "";
  $("a-dec").textContent = c.dec;
  $("a-spoken").textContent = c.spoken;
  $("verdict").textContent = "";

  $("card").classList.remove("flipped", "right", "wrong");
  $("next").hidden = true;
  $("progress").textContent = `${CARDS.length - deck.length} / ${CARDS.length} cleared`;

  // Show the right answer control for this card.
  $("type-form").hidden = side !== "frac";
  $("choices").hidden = side !== "dec";
  if (side === "frac") {
    $("answer").value = "";
    $("form-msg").textContent = "";
    $("answer").focus();
  } else {
    buildChoices(i);
  }
}

// Distractors = the 3 fractions CLOSEST in value. 5/8 vs 9/16 vs 11/16 is
// the confusion that actually happens at the bench; 5/8 vs 1/16 isn't.
function buildChoices(i) {
  const target = parseFloat(CARDS[i].dec);
  const near = CARDS.map((c, j) => ({ j, d: Math.abs(parseFloat(c.dec) - target) }))
    .filter((x) => x.j !== i)
    .sort((a, b) => a.d - b.d)
    .slice(0, 3)
    .map((x) => x.j);
  const opts = shuffle([i, ...near]);

  const box = $("choices");
  box.replaceChildren();               // clear old buttons
  for (const j of opts) {
    const b = document.createElement("button");
    b.className = "choice";
    b.textContent = CARDS[j].frac;
    b.dataset.j = j;
    b.addEventListener("click", () => pickChoice(j, b));
    box.append(b);
  }
}

function pickChoice(j, btn) {
  if (current.answered) return;
  const right = j === current.i;
  // Lock all buttons, highlight the correct one (and the wrong pick, if any).
  for (const b of $("choices").children) {
    b.disabled = true;
    if (+b.dataset.j === current.i) b.classList.add("correct");
  }
  if (!right) btn.classList.add("picked-wrong");
  resolve(right, right ? "Correct" : `Not ${CARDS[j].frac}`);
}

function submitTyped(e) {
  e.preventDefault();                  // stop the form from reloading the page
  if (current.answered) return;
  const input = $("answer").value;
  const result = checkDecimal(input, CARDS[current.i].dec);

  if (result === "format") {
    // Not graded: you get to fix the format without losing the card.
    const a = $("answer");
    a.classList.remove("shake"); void a.offsetWidth; a.classList.add("shake"); // restart animation
    $("form-msg").textContent = "Read it to the thousandth: .xxx or .xxxx";
    return;
  }
  resolve(result === "right", result === "right" ? "Correct" : `You put ${input.trim()}`);
}

function skip() {
  if (current.answered) return;
  resolve(false, "Here it is — it'll come back around");
}

// Common ending for every answer type: flip, color, score, confetti, show Next.
function resolve(right, message) {
  current.answered = true;
  const card = $("card");
  card.classList.add("flipped", right ? "right" : "wrong");
  $("verdict").textContent = (right ? "✓ " : "✗ ") + message;
  $("type-form").hidden = true;
  $("next").hidden = false;
  $("next").focus();                    // Enter again = next card (keyboard flow)

  const i = deck.shift();
  if (right) {
    if (!seenMiss.has(i)) firstTry++;
    confetti(deck.length === 0 ? 220 : 70); // bigger burst for the last card
  } else {
    seenMiss.add(i);
    deck.splice(Math.min(REINSERT_GAP, deck.length), 0, i);
  }
}

function finish() {
  current = null;
  $("card").hidden = true;
  $("type-form").hidden = true;
  $("choices").hidden = true;
  $("next").hidden = true;
  $("progress").textContent = "";
  $("summary").textContent =
    `${firstTry} of ${CARDS.length} right on the first try.` +
    (seenMiss.size ? ` Missed ones kept coming back until you got them.` : ` Clean sweep.`);
  $("done").hidden = false;
}

// ---------------------------------------------------------------------------
// Confetti. No library: a <canvas> plus a tiny particle loop.
// Each particle has a position, velocity and spin. Every frame (~60/sec) we
// apply gravity + drag, draw it, and drop it once it falls off-screen.
// When no particles are left, the loop stops so it isn't burning battery.
// ---------------------------------------------------------------------------
const canvas = $("confetti");
const ctx = canvas.getContext("2d");
const COLORS = ["#f2b33d", "#4caf7d", "#e8e6e1", "#5aa9e6", "#d9574a"];
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let parts = [];
let running = false;

function sizeCanvas() {
  const dpr = window.devicePixelRatio || 1;       // sharp on high-DPI phones
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
addEventListener("resize", sizeCanvas);
sizeCanvas();

function confetti(count) {
  if (reduceMotion) return; // respect the phone's accessibility setting
  // Launch from the bottom-center of the card, spraying up and outward.
  const r = $("card").getBoundingClientRect();
  const ox = r.left + r.width / 2, oy = r.bottom - 20;
  for (let n = 0; n < count; n++) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.6; // mostly upward
    const speed = 7 + Math.random() * 9;
    parts.push({
      x: ox, y: oy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      w: 6 + Math.random() * 6, h: 4 + Math.random() * 4,
      rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.4,
      color: COLORS[(Math.random() * COLORS.length) | 0],
    });
  }
  if (!running) { running = true; requestAnimationFrame(tick); }
}

function tick() {
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  for (const p of parts) {
    p.vy += 0.35;          // gravity
    p.vx *= 0.99;          // air drag
    p.x += p.vx; p.y += p.vy; p.rot += p.vr;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;
    // squash width by cos(rot) so pieces look like they're tumbling
    ctx.fillRect(-p.w / 2, -p.h / 2, p.w * Math.cos(p.rot * 2), p.h);
    ctx.restore();
  }
  parts = parts.filter((p) => p.y < innerHeight + 20);
  if (parts.length) requestAnimationFrame(tick);
  else { running = false; ctx.clearRect(0, 0, innerWidth, innerHeight); }
}

// --- wire up events -------------------------------------------------------
$("type-form").addEventListener("submit", submitTyped);
$("skip").addEventListener("click", skip);
$("next").addEventListener("click", next);
$("restart").addEventListener("click", startRound);
$("answer").addEventListener("input", () => { $("form-msg").textContent = ""; });
$("mode").value = loadMode();
$("mode").addEventListener("change", (e) => {
  saveMode(e.target.value);
  if (current && !current.answered) next(); // re-ask the same card the new way
});

startRound();

// --- service worker registration (this is what makes it work offline) -----
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js");
}
