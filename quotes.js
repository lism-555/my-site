/* quotes.js — the hero card draws a quote at random from the notebook.
 *
 * The notebook itself lives in the page as ordinary markup, so every quote
 * is readable even with JavaScript switched off. This script simply reads
 * those entries and offers one of them at random.
 */

(function () {
  'use strict';

  var entries = Array.prototype.slice.call(document.querySelectorAll('.entry'));
  if (!entries.length) return;

  var textEl = document.getElementById('hero-quote-text');
  var sourceEl = document.getElementById('hero-source');
  var countEl = document.getElementById('hero-count');
  var quoteEl = document.querySelector('.quote-card__text');
  var button = document.getElementById('another');

  if (!textEl || !sourceEl || !countEl || !quoteEl || !button) return;

  var cards = entries.map(function (entry) {
    var quote = entry.querySelector('.entry__quote');
    var source = entry.querySelector('.entry__source');
    var number = entry.querySelector('.entry__no');
    return {
      text: quote ? quote.textContent.trim() : '',
      source: source ? source.textContent.trim() : '',
      number: number ? number.textContent.trim() : ''
    };
  }).filter(function (card) {
    return card.text !== '';
  });

  if (!cards.length) return;

  var current = -1;

  function draw() {
    var next = current;
    while (next === current && cards.length > 1) {
      next = Math.floor(Math.random() * cards.length);
    }
    current = next;

    var card = cards[current];

    quoteEl.classList.add('is-turning');
    sourceEl.style.opacity = '0';

    window.setTimeout(function () {
      textEl.textContent = card.text;
      sourceEl.textContent = card.source;
      countEl.textContent = 'Card ' + card.number + ' of ' + cards.length;
      quoteEl.classList.remove('is-turning');
      sourceEl.style.opacity = '';
    }, 240);
  }

  button.addEventListener('click', draw);

  /* one drawn straight away, so the hero is never a fixed quote */
  draw();
})();
