(function() {
  'use strict';

  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cleanupTimers = new WeakMap();

  function replay(element, className, duration) {
    if (!element || reducedMotion) return;
    element.classList.remove(className);
    void element.offsetWidth;
    element.classList.add(className);
    if (cleanupTimers.has(element)) clearTimeout(cleanupTimers.get(element));
    cleanupTimers.set(element, setTimeout(function() {
      element.classList.remove(className);
      cleanupTimers.delete(element);
    }, duration || 700));
  }

  function observeText(element, className, duration) {
    if (!element) return;
    var previous = element.textContent;
    new MutationObserver(function() {
      var next = element.textContent;
      if (next === previous) return;
      previous = next;
      replay(element, className, duration);
    }).observe(element, { childList: true, characterData: true, subtree: true });
  }

  var targetLetters = document.querySelector('.target-letters');
  if (targetLetters) {
    var targetSignature = targetLetters.textContent;
    new MutationObserver(function() {
      var nextSignature = targetLetters.textContent;
      if (nextSignature === targetSignature) return;
      targetSignature = nextSignature;
      replay(targetLetters, 'motion-target-refresh', 720);
    }).observe(targetLetters, { childList: true, characterData: true, subtree: true });
    // The same single container animation handles both first display and
    // later target changes. Child elements have no competing base animation.
    replay(targetLetters, 'motion-target-refresh', 720);
  }

  var chainWords = document.getElementById('chainWords');
  if (chainWords) {
    var previousChainLength = chainWords.querySelectorAll('.chain-word').length;
    new MutationObserver(function() {
      var words = chainWords.querySelectorAll('.chain-word');
      var nextChainLength = words.length;
      if (!nextChainLength) {
        previousChainLength = 0;
        return;
      }
      if (nextChainLength <= previousChainLength) {
        previousChainLength = nextChainLength;
        return;
      }
      previousChainLength = nextChainLength;
      var lastWord = words[words.length - 1];
      var previous = lastWord.previousElementSibling;
      // These are freshly inserted nodes. Add both animation classes in the
      // same observer turn so the browser never paints an unanimated word
      // before starting its single entrance motion.
      if (previous && previous.classList.contains('chain-arrow')) {
        previous.classList.add('motion-chain-enter');
      }
      lastWord.classList.add('motion-chain-enter');
    }).observe(chainWords, { childList: true });
  }

  var statValues = document.querySelectorAll('.stat .value');
  for (var i = 0; i < statValues.length; i++) observeText(statValues[i], 'motion-stat-change', 460);

  observeText(document.querySelector('.campaign-move-count strong'), 'motion-stat-change', 460);
  observeText(document.getElementById('campaignProgressValue'), 'motion-stat-change', 460);

  var message = document.getElementById('message');
  if (message) {
    function messageSignature() {
      return message.textContent + '|' + message.className.replace(/\bmotion-message-enter\b/g, '').replace(/\s+/g, ' ').trim();
    }
    var messageState = messageSignature();
    var messageQueued = false;
    new MutationObserver(function() {
      var nextState = messageSignature();
      if (nextState === messageState || messageQueued) return;
      messageState = nextState;
      messageQueued = true;
      requestAnimationFrame(function() {
        messageQueued = false;
        if (message.classList.contains('show')) replay(message, 'motion-message-enter', 480);
      });
    }).observe(message, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  }

  var solvePanel = document.getElementById('solvePanel');
  if (solvePanel) {
    new MutationObserver(function() {
      if (solvePanel.style.display === 'block') replay(solvePanel, 'motion-panel-enter', 520);
    }).observe(solvePanel, { childList: true, attributes: true, attributeFilter: ['style'] });
  }
})();
