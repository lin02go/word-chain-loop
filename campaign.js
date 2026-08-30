(function() {
  'use strict';

  var CAMPAIGN_PROGRESS_KEY = 'word-chain-loop:campaign-progress:v3';
  var GAME_MODE_KEY = 'word-chain-loop:last-mode:v3';

  var CAMPAIGN_TEXT = {
    zh: {
      homeKicker: '闯关模式 · {levels} 关', homeTitle: '{levels} 关词环挑战',
      homeCopy: '逐关闭合词环，在最大步数内完成，并尝试拿到三星。',
      completed: '已完成关卡', reset: '重置闯关进度', resetConfirm: '确定清除全部闯关进度吗？此操作无法撤销。',
      continueLevel: '继续第 {id} 关',
      totalStars: '总星数 {stars} / {maxStars}', level: '第 {id} 关', locked: '尚未解锁',
      difficultyEasy: '简单', difficultyMedium: '标准', difficultyHard: '困难',
      best: '最佳 {moves} 步', bestOne: '最佳 1 步', notCompleted: '尚未完成',
      homeModeDescription: '固定关卡 · 三星评价 · 最大步数限制',
      levelModeDescription: '第 {id} 关 · {difficulty} · 起始词 {word}',
      back: '← 选关', moves: '步数', par: '三星目标 {moves} 步', undo: '撤销', restart: '重新挑战',
      hudLabel: '闯关状态', levelCompleteKicker: '关卡完成', levelComplete: '闯关成功',
      resultCopy: '你用 {moves} 步闭合了词环；三星目标为 {par} 步。',
      assisted: '本关使用了提示或撤销，最高评价受到限制。', newBest: '刷新了本关最佳步数。',
      next: '下一关', replay: '再玩一次', levelList: '返回选关', allComplete: '全部 {levels} 关完成',
      allCompleteCopy: '你已经完成全部 {levels} 关，可以返回选关继续挑战更高星级。',
      failedKicker: '超过步数', failedTitle: '本次挑战未完成',
      failedCopy: '本关最多允许 {max} 步。你可以撤销最后一步，或重新挑战。',
      levelUnavailable: '该关卡当前无法加载，请重新验证关卡数据。',
      campaignReady: '闯关模式已准备：{levels} 个关卡'
    },
    en: {
      homeKicker: 'CAMPAIGN · {levels} LEVELS', homeTitle: '{levels} Word Loops',
      homeCopy: 'Close each loop within the move limit and try to earn three stars.',
      completed: 'Levels completed', reset: 'Reset campaign progress', resetConfirm: 'Clear all campaign progress? This cannot be undone.',
      continueLevel: 'Continue Level {id}',
      totalStars: 'Total stars {stars} / {maxStars}', level: 'Level {id}', locked: 'Locked',
      difficultyEasy: 'Easy', difficultyMedium: 'Medium', difficultyHard: 'Hard',
      best: 'Best: {moves} moves', bestOne: 'Best: 1 move', notCompleted: 'Not completed',
      homeModeDescription: 'Fixed levels · three-star ratings · move limits',
      levelModeDescription: 'Level {id} · {difficulty} · starts with {word}',
      back: '← Levels', moves: 'Moves', par: 'Three-star target: {moves}', undo: 'Undo', restart: 'Restart',
      hudLabel: 'Campaign status', levelCompleteKicker: 'LEVEL COMPLETE', levelComplete: 'Loop closed',
      resultCopy: 'You closed the loop in {moves} moves; the three-star target was {par}.',
      assisted: 'A hint or undo was used, so the highest rating was limited.', newBest: 'New best move count for this level.',
      next: 'Next level', replay: 'Play again', levelList: 'Level list', allComplete: 'All {levels} complete',
      allCompleteCopy: 'You completed all {levels} levels. Return to the list to improve your star ratings.',
      failedKicker: 'MOVE LIMIT', failedTitle: 'Challenge not completed',
      failedCopy: 'This level allows {max} moves. Undo the last move or restart the level.',
      levelUnavailable: 'This level cannot be loaded. Please validate the campaign data again.',
      campaignReady: 'Campaign ready: {levels} levels'
    }
  };

  function campaignText(key, params) {
    var language = typeof currentLanguage === 'string' ? currentLanguage : 'zh';
    var table = CAMPAIGN_TEXT[language] || CAMPAIGN_TEXT.zh;
    var value = table[key] || key;
    if (!params) return value;
    return value.replace(/\{(\w+)\}/g, function(match, name) {
      return params[name] === undefined ? match : String(params[name]);
    });
  }

  function CampaignController(gameInstance, levels) {
    this.game = gameInstance;
    this.levels = levels || [];
    this.mode = 'casual';
    this.activeLevel = null;
    this.minimumMoves = 0;
    this.parMoves = 0;
    this.maxMoves = 0;
    this.undoUsed = false;
    this.roundEnded = false;
    this.overlayState = null;
    this.lastResult = null;
    this.progress = this.loadProgress();

    this.originalNewGame = gameInstance.newGame.bind(gameInstance);
    this.originalOnWin = gameInstance.onWin.bind(gameInstance);
    this.originalSubmitWord = gameInstance.submitWord.bind(gameInstance);
    this.installGameHooks();
    this.bindUI();

    var savedMode = 'casual';
    try { savedMode = localStorage.getItem(GAME_MODE_KEY) || 'casual'; } catch (err) { savedMode = 'casual'; }
    this.setMode(savedMode === 'campaign' ? 'campaign' : 'casual', true);
    console.log(campaignText('campaignReady', { levels: this.levels.length }));
  }

  CampaignController.prototype.emptyProgress = function() {
    return { version: 1, unlockedLevel: 1, lastPlayedLevel: 1, levels: {} };
  };

  CampaignController.prototype.loadProgress = function() {
    try {
      var parsed = JSON.parse(localStorage.getItem(CAMPAIGN_PROGRESS_KEY) || 'null');
      if (!parsed || parsed.version !== 1 || !parsed.levels) return this.emptyProgress();
      var unlockedFromResults = 1;
      for (var levelId in parsed.levels) {
        if (!Object.prototype.hasOwnProperty.call(parsed.levels, levelId) || !parsed.levels[levelId].completed) continue;
        unlockedFromResults = Math.max(unlockedFromResults, (parseInt(levelId, 10) || 0) + 1);
      }
      parsed.unlockedLevel = Math.max(1, Math.min(this.levels.length,
        Math.max(parsed.unlockedLevel || 1, unlockedFromResults)));
      parsed.lastPlayedLevel = Math.max(1, Math.min(this.levels.length, parsed.lastPlayedLevel || 1));
      return parsed;
    } catch (err) {
      return this.emptyProgress();
    }
  };

  CampaignController.prototype.saveProgress = function() {
    try { localStorage.setItem(CAMPAIGN_PROGRESS_KEY, JSON.stringify(this.progress)); } catch (err) { /* storage may be unavailable */ }
    window.dispatchEvent(new CustomEvent('wordloop:progress-changed'));
  };

  CampaignController.prototype.installGameHooks = function() {
    var self = this;
    this.game.newGame = function() {
      if (self.mode === 'campaign' && self.activeLevel) return self.restartLevel();
      return self.originalNewGame();
    };
    this.game.onWin = function() {
      if (self.mode === 'campaign' && self.activeLevel) return self.handleWin();
      return self.originalOnWin();
    };
    this.game.submitWord = function(word) {
      var before = self.game.chain.length;
      var accepted = self.originalSubmitWord(word);
      if (self.mode === 'campaign' && self.activeLevel && accepted &&
          self.game.chain.length > before && !self.roundEnded) {
        self.afterAcceptedMove();
      }
      return accepted;
    };
  };

  CampaignController.prototype.bindUI = function() {
    var self = this;
    var modeButtons = document.querySelectorAll('.game-mode-btn');
    for (var i = 0; i < modeButtons.length; i++) {
      modeButtons[i].addEventListener('click', function() {
        self.setMode(this.getAttribute('data-game-mode'));
      });
    }
    document.getElementById('campaignBackBtn').addEventListener('click', function() { self.showHome(); });
    document.getElementById('campaignUndoBtn').addEventListener('click', function() { self.undo(); });
    document.getElementById('campaignContinueBtn').addEventListener('click', function() { self.startLevel(self.continueLevelId()); });
    document.getElementById('campaignResetBtn').addEventListener('click', function() { self.resetProgress(); });
    document.getElementById('campaignOverlayPrimary').addEventListener('click', function() {
      if (self.overlayState === 'failed') self.undo();
      else if (self.activeLevel && self.activeLevel.id < self.levels.length) self.startLevel(self.activeLevel.id + 1);
      else self.showHome();
    });
    document.getElementById('campaignOverlaySecondary').addEventListener('click', function() { self.restartLevel(); });
    document.getElementById('campaignOverlayTertiary').addEventListener('click', function() { self.showHome(); });
  };

  CampaignController.prototype.setMode = function(mode, initial) {
    this.mode = mode === 'campaign' ? 'campaign' : 'casual';
    this.closeOverlays();
    var buttons = document.querySelectorAll('.game-mode-btn');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].classList.toggle('active', buttons[i].getAttribute('data-game-mode') === this.mode);
      buttons[i].setAttribute('aria-pressed', buttons[i].getAttribute('data-game-mode') === this.mode ? 'true' : 'false');
    }
    try { localStorage.setItem(GAME_MODE_KEY, this.mode); } catch (err) { /* storage may be unavailable */ }

    if (this.mode === 'campaign') {
      document.body.classList.add('campaign-mode');
      this.showHome();
      return;
    }

    this.activeLevel = null;
    this.roundEnded = false;
    this.game.hintLimitOverride = null;
    this.game.hintWordsOverride = null;
    document.body.classList.remove('campaign-mode', 'campaign-playing');
    document.getElementById('campaignHome').hidden = true;
    document.getElementById('campaignHud').hidden = true;
    document.querySelector('.layout').style.display = '';
    document.getElementById('newGameBtn').textContent = t('newGame');
    document.getElementById('solveSection').style.display = 'block';
    document.getElementById('modeDescription').textContent = t(this.casualDescriptionKey());
    if (!initial) this.originalNewGame();
  };

  CampaignController.prototype.casualDescriptionKey = function() {
    return this.game.difficulty === 'easy' ? 'easyDescription' :
      (this.game.difficulty === 'hard' ? 'hardDescription' : 'mediumDescription');
  };

  CampaignController.prototype.showHome = function() {
    if (this.mode !== 'campaign') return;
    this.activeLevel = null;
    this.roundEnded = false;
    this.closeOverlays();
    document.body.classList.add('campaign-mode');
    document.body.classList.remove('campaign-playing');
    document.getElementById('campaignHome').hidden = false;
    document.getElementById('campaignHud').hidden = true;
    document.querySelector('.layout').style.display = 'none';
    document.getElementById('modeDescription').textContent = campaignText('homeModeDescription');
    this.renderHome();
  };

  CampaignController.prototype.renderHome = function() {
    var completed = 0;
    var totalStars = 0;
    for (var key in this.progress.levels) {
      if (!Object.prototype.hasOwnProperty.call(this.progress.levels, key)) continue;
      if (this.progress.levels[key].completed) completed++;
      totalStars += this.progress.levels[key].stars || 0;
    }
    document.getElementById('campaignKicker').textContent = campaignText('homeKicker', { levels: this.levels.length });
    document.getElementById('campaignHomeTitle').textContent = campaignText('homeTitle', { levels: this.levels.length });
    document.getElementById('campaignHomeCopy').textContent = campaignText('homeCopy');
    document.getElementById('campaignProgressValue').textContent = completed + ' / ' + this.levels.length;
    document.getElementById('campaignProgressLabel').textContent = campaignText('completed');
    document.getElementById('campaignTotalStars').textContent = campaignText('totalStars', {
      stars: totalStars, maxStars: this.levels.length * 3
    });
    document.getElementById('campaignResetBtn').textContent = campaignText('reset');
    document.getElementById('campaignContinueBtn').textContent = campaignText('continueLevel', {
      id: String(this.continueLevelId()).padStart(2, '0')
    });

    var grid = document.getElementById('campaignLevelGrid');
    grid.innerHTML = '';
    var self = this;
    for (var i = 0; i < this.levels.length; i++) {
      var level = this.levels[i];
      var result = this.progress.levels[String(level.id)] || null;
      var locked = level.id > this.progress.unlockedLevel;
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'level-card' + (result && result.completed ? ' completed' : '') +
        (level.id === this.progress.lastPlayedLevel && !locked ? ' current' : '');
      button.disabled = locked;
      button.setAttribute('data-level-id', String(level.id));
      var meta = locked ? campaignText('locked') :
        (result && result.completed ? campaignText(result.bestMoves === 1 ? 'bestOne' : 'best', { moves: result.bestMoves }) : campaignText('notCompleted'));
      var stars = result && result.stars ? '★'.repeat(result.stars) + '☆'.repeat(3 - result.stars) : '☆☆☆';
      button.innerHTML = '<span class="level-number">' + campaignText('level', { id: String(level.id).padStart(2, '0') }) + '</span>' +
        '<span class="level-word">' + level.startWord + '</span>' +
        '<span class="level-meta">' + this.difficultyName(level.difficulty) + ' · ' + meta + '</span>' +
        '<span class="level-stars">' + stars + '</span>';
      button.addEventListener('click', function() { self.startLevel(Number(this.getAttribute('data-level-id'))); });
      grid.appendChild(button);
    }
  };

  CampaignController.prototype.difficultyName = function(difficulty) {
    return campaignText('difficulty' + difficulty.charAt(0).toUpperCase() + difficulty.slice(1));
  };

  CampaignController.prototype.continueLevelId = function() {
    for (var i = 1; i <= this.progress.unlockedLevel; i++) {
      var result = this.progress.levels[String(i)];
      if (!result || !result.completed) return i;
    }
    return Math.max(1, Math.min(this.levels.length, this.progress.lastPlayedLevel || this.progress.unlockedLevel));
  };

  CampaignController.prototype.startLevel = function(levelId) {
    var level = this.levels[levelId - 1];
    if (!level || level.id > this.progress.unlockedLevel) return;
    this.activeLevel = level;
    this.roundEnded = false;
    this.undoUsed = false;
    this.lastResult = null;
    this.overlayState = null;
    this.closeOverlays();

    if (this.game.difficulty !== level.difficulty) {
      this.game.difficulty = level.difficulty;
      this.game.buildGraph();
    }
    this.game.hintLimitOverride = level.hintLimit;
    this.game.hintWordsOverride = 6;
    this.game._replayWord = level.startWord;
    this.originalNewGame();

    var edge = this.game.wordToEdge.get(level.startWord);
    var distance = edge && this.game.distances[edge.to] ? this.game.distances[edge.to][edge.from] : undefined;
    if (!edge || distance === undefined || this.game.startWord !== level.startWord) {
      this.game.showMessage(campaignText('levelUnavailable'), 'error');
      this.showHome();
      return;
    }

    this.minimumMoves = distance;
    this.parMoves = distance + level.parSlack;
    this.maxMoves = Math.max(this.parMoves + 1, distance + level.maxSlack);
    this.progress.lastPlayedLevel = level.id;
    var record = this.progress.levels[String(level.id)] || {};
    record.attempts = (record.attempts || 0) + 1;
    this.progress.levels[String(level.id)] = record;
    this.saveProgress();

    document.body.classList.add('campaign-mode', 'campaign-playing');
    document.getElementById('campaignHome').hidden = true;
    document.getElementById('campaignHud').hidden = false;
    document.querySelector('.layout').style.display = '';
    document.getElementById('solveSection').style.display = 'none';
    document.getElementById('newGameBtn').textContent = campaignText('restart');
    document.getElementById('modeDescription').textContent = campaignText('levelModeDescription', {
      id: String(level.id).padStart(2, '0'), difficulty: this.difficultyName(level.difficulty), word: level.startWord
    });
    this.syncDifficultyButtons();
    this.renderHud();
  };

  CampaignController.prototype.syncDifficultyButtons = function() {
    var buttons = document.querySelectorAll('.diff-btn');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].classList.toggle('active', buttons[i].getAttribute('data-diff') === this.game.difficulty);
    }
  };

  CampaignController.prototype.restartLevel = function() {
    if (!this.activeLevel) return this.showHome();
    this.startLevel(this.activeLevel.id);
  };

  CampaignController.prototype.currentMoves = function() {
    return Math.max(0, this.game.chain.length - 1);
  };

  CampaignController.prototype.renderHud = function() {
    if (!this.activeLevel) return;
    var moves = this.currentMoves();
    var result = this.progress.levels[String(this.activeLevel.id)] || {};
    document.getElementById('campaignHud').setAttribute('aria-label', campaignText('hudLabel'));
    document.getElementById('campaignBackBtn').textContent = campaignText('back');
    document.getElementById('campaignLevelLabel').textContent = campaignText('level', { id: String(this.activeLevel.id).padStart(2, '0') });
    document.getElementById('campaignMoveCount').innerHTML = campaignText('moves') + ' <strong>' + moves + ' / ' + this.maxMoves + '</strong>';
    document.getElementById('campaignParCount').textContent = campaignText('par', { moves: this.parMoves });
    document.getElementById('campaignUndoBtn').textContent = campaignText('undo');
    document.getElementById('campaignUndoBtn').disabled = this.game.chain.length <= 1;
    document.getElementById('statRecord').textContent = result.bestMoves || '--';
  };

  CampaignController.prototype.afterAcceptedMove = function() {
    this.renderHud();
    if (this.currentMoves() >= this.maxMoves && this.game.currentRequired !== this.game.targetGoal) {
      this.handleFailure();
    }
  };

  CampaignController.prototype.undo = function() {
    if (!this.activeLevel || this.game.chain.length <= 1) return;
    this.closeOverlays();
    this.roundEnded = false;
    this.undoUsed = true;
    this.game.assisted = true;
    this.game.chain.pop();
    this.game.usedWords = new Set(this.game.chain);
    this.game.usedLemmas = new Set();
    for (var i = 0; i < this.game.chain.length; i++) {
      this.game.usedLemmas.add(this.game.wordLemmaRoots.get(this.game.chain[i]));
    }
    var lastWord = this.game.chain[this.game.chain.length - 1];
    this.game.currentRequired = lastWord.substring(lastWord.length - 2);
    this.game.render();
    this.game._updateStatsQuick();
    this.game.hideHints();
    this.game.hideMessage();
    document.getElementById('wordInput').disabled = false;
    document.getElementById('submitBtn').disabled = false;
    this.game._updateHintButton();
    document.getElementById('wordInput').value = this.game.currentRequired;
    document.getElementById('wordInput').focus();
    document.getElementById('wordInput').setSelectionRange(2, 2);
    this.renderHud();
  };

  CampaignController.prototype.handleWin = function() {
    this.roundEnded = true;
    this.game.render();
    this.game._updateStatsQuick();
    document.getElementById('wordInput').disabled = true;
    document.getElementById('submitBtn').disabled = true;
    document.getElementById('hintBtn').disabled = true;

    var moves = this.currentMoves();
    var assisted = this.game.hintUses > 0 || this.undoUsed;
    var stars = moves <= this.parMoves ? (assisted ? 2 : 3) : 1;
    var key = String(this.activeLevel.id);
    var old = this.progress.levels[key] || {};
    var oldBest = old.bestMoves || 0;
    var newBest = oldBest === 0 || moves < oldBest;
    old.completed = true;
    old.stars = Math.max(old.stars || 0, stars);
    old.bestMoves = newBest ? moves : oldBest;
    old.bestHintUses = old.bestHintUses === undefined ? this.game.hintUses : Math.min(old.bestHintUses, this.game.hintUses);
    this.progress.levels[key] = old;
    this.progress.unlockedLevel = Math.min(this.levels.length, Math.max(this.progress.unlockedLevel, this.activeLevel.id + 1));
    this.saveProgress();

    this.lastResult = {
      stars: stars,
      moves: moves,
      par: this.parMoves,
      assisted: assisted,
      newBest: newBest,
      isLast: this.activeLevel.id === this.levels.length
    };
    this.game.emitCompletion({
      mode: 'campaign',
      moves: moves,
      minimumMoves: this.minimumMoves,
      assisted: assisted,
      campaignLevelId: this.activeLevel.id
    });
    this.renderCompleteOverlay();
    this.renderHud();
  };

  CampaignController.prototype.renderCompleteOverlay = function() {
    if (!this.activeLevel || !this.lastResult) return;
    var result = this.lastResult;
    this.overlayState = 'complete';
    document.getElementById('campaignOverlayKicker').textContent = campaignText('levelCompleteKicker');
    document.getElementById('campaignOverlayTitle').textContent =
      result.isLast ? campaignText('allComplete', { levels: this.levels.length }) : campaignText('levelComplete');
    var starBox = document.getElementById('campaignResultStars');
    starBox.hidden = false;
    starBox.textContent = '★'.repeat(result.stars) + '☆'.repeat(3 - result.stars);
    var copy = result.isLast ? campaignText('allCompleteCopy', { levels: this.levels.length }) :
      campaignText('resultCopy', { moves: result.moves, par: result.par });
    if (result.assisted) copy += ' ' + campaignText('assisted');
    if (result.newBest) copy += ' ' + campaignText('newBest');
    document.getElementById('campaignOverlayCopy').textContent = copy;
    document.getElementById('campaignOverlayPrimary').textContent =
      this.activeLevel.id < this.levels.length ? campaignText('next') : campaignText('levelList');
    document.getElementById('campaignOverlaySecondary').textContent = campaignText('replay');
    document.getElementById('campaignOverlayTertiary').textContent = campaignText('levelList');
    document.getElementById('campaignOverlay').classList.add('show');
  };

  CampaignController.prototype.handleFailure = function() {
    this.roundEnded = true;
    this.renderFailureOverlay();
  };

  CampaignController.prototype.renderFailureOverlay = function() {
    this.overlayState = 'failed';
    document.getElementById('wordInput').disabled = true;
    document.getElementById('submitBtn').disabled = true;
    document.getElementById('hintBtn').disabled = true;
    document.getElementById('campaignOverlayKicker').textContent = campaignText('failedKicker');
    document.getElementById('campaignOverlayTitle').textContent = campaignText('failedTitle');
    document.getElementById('campaignResultStars').hidden = true;
    document.getElementById('campaignOverlayCopy').textContent = campaignText('failedCopy', { max: this.maxMoves });
    document.getElementById('campaignOverlayPrimary').textContent = campaignText('undo');
    document.getElementById('campaignOverlaySecondary').textContent = campaignText('restart');
    document.getElementById('campaignOverlayTertiary').textContent = campaignText('levelList');
    document.getElementById('campaignOverlay').classList.add('show');
  };

  CampaignController.prototype.closeOverlays = function() {
    document.getElementById('campaignOverlay').classList.remove('show');
    document.getElementById('winOverlay').classList.remove('show');
    this.overlayState = null;
  };

  CampaignController.prototype.resetProgress = function() {
    if (!window.confirm(campaignText('resetConfirm'))) return;
    this.progress = this.emptyProgress();
    this.saveProgress();
    this.renderHome();
  };

  CampaignController.prototype.refreshLanguage = function() {
    if (this.mode !== 'campaign') return;
    if (this.activeLevel) {
      document.getElementById('modeDescription').textContent = campaignText('levelModeDescription', {
        id: String(this.activeLevel.id).padStart(2, '0'),
        difficulty: this.difficultyName(this.activeLevel.difficulty), word: this.activeLevel.startWord
      });
      document.getElementById('newGameBtn').textContent = campaignText('restart');
      this.renderHud();
      if (this.overlayState === 'failed') this.renderFailureOverlay();
      else if (this.overlayState === 'complete') this.renderCompleteOverlay();
    } else {
      document.getElementById('modeDescription').textContent = campaignText('homeModeDescription');
      this.renderHome();
    }
  };

  window.CampaignController = CampaignController;
  if (typeof game !== 'undefined' && typeof CAMPAIGN_LEVELS !== 'undefined') {
    window.campaignController = new CampaignController(game, CAMPAIGN_LEVELS);
  }
})();
