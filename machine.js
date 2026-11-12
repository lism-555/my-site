/* machine.js — two things live on this page.
 *
 * One: the machine itself. It has one lever and one slot. Pulling the lever
 * sets it off and a small card comes out saying something unhelpful.
 *
 * Two: the one thing the machine is actually good at, which is clearing snow.
 * There is a gate at one end of the yard and a tree at the other, and you
 * have a limited number of shovel strokes to open a path between them while
 * the snow keeps falling.
 */

(function () {
  'use strict';

  /* ------------------------------------------------------------
     One · the machine
     ------------------------------------------------------------ */

  var cabinet = document.getElementById('machine');
  var lever = document.getElementById('lever');
  var slip = document.getElementById('slip');

  var RITES = [
    'It stamps a small date on a blank card and hands the card back.',
    'It rings once. The room was already ringing.',
    'It folds the paper into a shape it will not explain.',
    'It counts to four and stops at three. On purpose.',
    'It blows one small puff of cold air into the room.',
    'It thanks you for your order. There was no order.',
    "It prints today's date in a typeface that does not exist.",
    'It asks if you are quite sure. You are not quite sure.',
    'It measures the room. The room is not impressed.'
  ];

  if (cabinet && lever && slip) {
    var lastRite = -1;

    lever.addEventListener('click', function () {
      if (cabinet.classList.contains('is-running')) return;

      var index;
      do {
        index = Math.floor(Math.random() * RITES.length);
      } while (index === lastRite && RITES.length > 1);
      lastRite = index;

      slip.textContent = RITES[index];
      cabinet.classList.add('is-running');

      window.setTimeout(function () {
        cabinet.classList.remove('is-running');
      }, 2100);
    });
  }

  /* ------------------------------------------------------------
     Two · clearing the path
     ------------------------------------------------------------ */

  var COLS = 9;
  var ROWS = 7;
  var STROKES = 16;
  var GATE_ROW = 3;
  var TREE_ROW = 3;

  var field = document.getElementById('field');
  if (!field) return;

  var strokesEl = document.getElementById('strokes');
  var statusEl = document.getElementById('status');
  var resultEl = document.getElementById('result');
  var resetBtn = document.getElementById('reset');
  var shovelEl = document.getElementById('shovel');

  var GATE = GATE_ROW * COLS;
  var TREE = TREE_ROW * COLS + (COLS - 1);

  var cells = [];
  var snowy = [];
  var strokes = STROKES;
  var finished = false;
  var painting = false;
  var lastCleared = -1;
  var cursor = GATE_ROW * COLS;

  function build() {
    var i;
    for (i = 0; i < cells.length; i++) {
      if (cells[i].parentNode) cells[i].parentNode.removeChild(cells[i]);
    }
    cells = [];
    snowy = [];

    for (var r = 0; r < ROWS; r++) {
      for (var c = 0; c < COLS; c++) {
        var cell = document.createElement('div');
        cell.className = 'cell is-snow';
        cell.setAttribute('data-i', String(r * COLS + c));
        if (shovelEl && shovelEl.parentNode === field) {
          field.insertBefore(cell, shovelEl);
        } else {
          field.appendChild(cell);
        }
        cells.push(cell);
        snowy.push(true);
      }
    }

    snowy[GATE] = false;
    cells[GATE].classList.remove('is-snow');
    cells[GATE].classList.add('is-gate');

    snowy[TREE] = false;
    cells[TREE].classList.remove('is-snow');
    cells[TREE].classList.add('is-tree');

    paintCursor();
  }

  function updateStrokes() {
    if (strokesEl) strokesEl.textContent = String(strokes);
  }

  function status(text) {
    if (statusEl) statusEl.textContent = text;
  }

  function result(text, lost) {
    if (!resultEl) return;
    resultEl.textContent = text;
    resultEl.classList.toggle('result--lost', !!lost);
  }

  function paintCursor() {
    for (var i = 0; i < cells.length; i++) {
      cells[i].classList.remove('is-cursor');
    }
    if (cells[cursor]) cells[cursor].classList.add('is-cursor');
  }

  /* the ring only shows for people using the keyboard */
  function keyboardMode(on) {
    field.classList.toggle('is-keyboard', on);
  }

  /* is there an open path from the gate to the tree? */
  function connected() {
    var seen = [];
    var queue = [GATE];
    seen[GATE] = true;

    while (queue.length) {
      var i = queue.shift();
      if (i === TREE) return true;

      var r = Math.floor(i / COLS);
      var c = i % COLS;
      var neighbours = [];

      if (r > 0) neighbours.push(i - COLS);
      if (r < ROWS - 1) neighbours.push(i + COLS);
      if (c > 0) neighbours.push(i - 1);
      if (c < COLS - 1) neighbours.push(i + 1);

      for (var n = 0; n < neighbours.length; n++) {
        var j = neighbours[n];
        if (!seen[j] && !snowy[j]) {
          seen[j] = true;
          queue.push(j);
        }
      }
    }
    return false;
  }

  /* one tile of snow comes down again */
  function fallSnow() {
    var pool = [];
    for (var i = 0; i < snowy.length; i++) {
      if (i === GATE || i === TREE || i === lastCleared) continue;
      pool.push(i);
    }
    if (!pool.length) return;

    var target = pool[Math.floor(Math.random() * pool.length)];
    snowy[target] = true;

    var cell = cells[target];
    cell.classList.add('is-snow');
    cell.classList.add('is-fresh');
    window.setTimeout(function () {
      cell.classList.remove('is-fresh');
    }, 500);
  }

  function win() {
    finished = true;
    field.classList.add('is-won');
    result('The path is open.');
    status('The tree can be reached.');
  }

  function lose() {
    finished = true;
    result('The path is closed.', true);
    status('The snow won this one.');
  }

  /* returns false once the game is over */
  function shovelAt(i) {
    if (finished) return false;
    if (i < 0 || i >= snowy.length) return true;
    if (!snowy[i]) return true;
    if (strokes <= 0) {
      lose();
      return false;
    }

    snowy[i] = false;
    lastCleared = i;
    cells[i].classList.remove('is-snow');
    cells[i].classList.remove('is-fresh');
    strokes--;
    updateStrokes();

    if (connected()) {
      win();
      return false;
    }
    if (strokes <= 0) {
      lose();
      return false;
    }

    fallSnow();
    return true;
  }

  function cellFromPoint(x, y) {
    var found = document.elementFromPoint(x, y);
    if (!found || !found.classList || !found.classList.contains('cell')) return null;
    return found;
  }

  /* every tile between two cells, so a fast swipe never skips one */
  function pathBetween(from, to) {
    var fromRow = Math.floor(from / COLS);
    var fromCol = from % COLS;
    var toRow = Math.floor(to / COLS);
    var toCol = to % COLS;
    var steps = Math.max(Math.abs(toRow - fromRow), Math.abs(toCol - fromCol));
    var trail = [];

    for (var s = 1; s <= steps; s++) {
      var t = s / steps;
      var row = Math.round(fromRow + (toRow - fromRow) * t);
      var col = Math.round(fromCol + (toCol - fromCol) * t);
      var index = row * COLS + col;
      if (trail[trail.length - 1] !== index) trail.push(index);
    }
    return trail;
  }

  /* pointer: drag a path in one sweep */
  field.addEventListener('pointerdown', function (event) {
    if (finished) return;
    var cell = event.target && event.target.closest ? event.target.closest('.cell') : null;
    if (!cell) return;

    painting = true;
    keyboardMode(false);
    if (field.setPointerCapture) {
      try { field.setPointerCapture(event.pointerId); } catch (err) { /* not fatal */ }
    }
    cursor = Number(cell.getAttribute('data-i'));
    paintCursor();
    shovelAt(cursor);
    event.preventDefault();
  });

  field.addEventListener('pointermove', function (event) {
    if (shovelEl) {
      var box = field.getBoundingClientRect();
      shovelEl.style.left = (event.clientX - box.left) + 'px';
      shovelEl.style.top = (event.clientY - box.top) + 'px';
    }
    if (!painting || finished) return;

    var cell = cellFromPoint(event.clientX, event.clientY);
    if (!cell) return;

    var index = Number(cell.getAttribute('data-i'));
    if (index === cursor) return;

    var trail = pathBetween(cursor, index);
    for (var t = 0; t < trail.length; t++) {
      if (finished) break;
      cursor = trail[t];
      paintCursor();
      if (!shovelAt(cursor)) break;
    }
  });

  function endStroke() {
    painting = false;
  }

  field.addEventListener('pointerup', endStroke);
  field.addEventListener('pointercancel', endStroke);
  window.addEventListener('pointerup', endStroke);

  /* keyboard: move with the arrows, shovel with space or enter */
  field.addEventListener('keydown', function (event) {
    keyboardMode(true);

    var r = Math.floor(cursor / COLS);
    var c = cursor % COLS;
    var handled = true;

    switch (event.key) {
      case 'ArrowUp':    if (r > 0) cursor -= COLS; break;
      case 'ArrowDown':  if (r < ROWS - 1) cursor += COLS; break;
      case 'ArrowLeft':  if (c > 0) cursor -= 1; break;
      case 'ArrowRight': if (c < COLS - 1) cursor += 1; break;
      case ' ':
      case 'Enter':
        shovelAt(cursor);
        break;
      default:
        handled = false;
    }

    if (handled) {
      paintCursor();
      event.preventDefault();
    }
  });

  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      strokes = STROKES;
      finished = false;
      painting = false;
      lastCleared = -1;
      cursor = GATE_ROW * COLS;
      field.classList.remove('is-won');
      result('');
      status('Clear a path from the gate to the tree.');
      build();
      updateStrokes();
    });
  }

  build();
  updateStrokes();
})();
