(function() {
  'use strict';

  var STORAGE_KEY = 'word-chain-loop:daily:v1';
  var API_PATH = '/api/daily-challenge';
  var PLAYER_KEY_STORAGE = 'word-chain-loop:daily-player:v1';
  var DAY_MS = 24 * 60 * 60 * 1000;
  var BEIJING_OFFSET_MS = 8 * 60 * 60 * 1000;

  var TEXT = {
    zh: {
      daily: '每日一环', loading: '正在准备今日词环…', unavailable: '今日词环暂时无法载入。',
      offlineReady: '网络不可用，已使用本地题库。', start: '开始今日挑战', back: '退出每日挑战', restart: '重新挑战',
      dateLabel: '北京时间 {date}', issue: '今日第 {number} 环', moves: '{count} 步', assisted: '辅助完成', unassisted: '无辅助',
      movesLimit: '步数 {count} / {max}', moveLimitReached: '已达到本题的 {max} 步上限。可以撤销一步或重新挑战。',
      resetsIn: '距换题 {time}', dayChanged: '新的每日词环已经到来，请返回刷新题目。',
      completeKicker: 'DAILY LOOP COMPLETE', completeTitle: '今日词环已闭合', firstClear: '今日首通', newBest: '刷新个人最佳', finished: '挑战完成',
      resultMeta: '{moves} 步 · {time} · {assist}', won: '你击败了发起人', tied: '你与发起人打平', lost: '还差一点，再试一次',
      rival: '发起人：{moves} 步 · {time}', share: '分享成绩', copy: '复制挑战链接', download: '保存成绩卡', close: '关闭',
      copied: '挑战链接已复制。', shareFailed: '分享失败，请稍后再试。', noResult: '完成今日词环后才能分享。',
      shareTitle: '每日一环 · {date}', shareText: '今日词环 #{number}\n{moves} 步闭环 · {time} · {assist}\n你能比我更快吗？',
      cardPrompt: '你能比我少一步吗？', apiSaved: '成绩已同步', apiPending: '成绩已保存在本机，联网后可再次分享。',
      expired: '这是 {date} 的往期挑战。', invalidWord: '今日起始词在当前词库中不可用。'
    },
    en: {
      daily: 'Daily Loop', loading: 'Preparing today\'s loop…', unavailable: 'Today\'s loop is temporarily unavailable.',
      offlineReady: 'You are offline. A local daily puzzle is ready.', start: 'Start today\'s challenge', back: 'Leave Daily Loop', restart: 'Try again',
      dateLabel: 'Beijing time · {date}', issue: 'Daily Loop #{number}', moves: '{count} moves', assisted: 'Assisted', unassisted: 'No assists',
      movesLimit: 'Moves {count} / {max}', moveLimitReached: 'You reached the {max}-move limit. Undo one move or restart the challenge.',
      resetsIn: 'New puzzle in {time}', dayChanged: 'A new Daily Loop is ready. Return to load the new puzzle.',
      completeKicker: 'DAILY LOOP COMPLETE', completeTitle: 'Today\'s loop is closed', firstClear: 'First clear today', newBest: 'New personal best', finished: 'Challenge complete',
      resultMeta: '{moves} moves · {time} · {assist}', won: 'You beat the challenger', tied: 'You tied the challenger', lost: 'Close — try once more',
      rival: 'Challenger: {moves} moves · {time}', share: 'Share result', copy: 'Copy challenge link', download: 'Save result card', close: 'Close',
      copied: 'Challenge link copied.', shareFailed: 'Sharing failed. Please try again.', noResult: 'Complete today\'s loop before sharing.',
      shareTitle: 'Daily Loop · {date}', shareText: 'Daily Loop #{number}\nClosed in {moves} moves · {time} · {assist}\nCan you beat me?',
      cardPrompt: 'Can you close it in one fewer move?', apiSaved: 'Result synced', apiPending: 'Saved on this device. Reconnect to create a head-to-head link.',
      expired: 'This is an archive challenge from {date}.', invalidWord: 'The daily start word is unavailable in the current dictionary.'
    }
  };

  function el(id) { return document.getElementById(id); }
  function canUseBackend() {
    return window.location.protocol === 'http:' || window.location.protocol === 'https:';
  }

  function language() {
    return typeof window.currentLanguage === 'string' && window.currentLanguage === 'en' ? 'en' : 'zh';
  }

  function text(key, params) {
    var table = TEXT[language()] || TEXT.zh;
    var value = table[key] === undefined ? (TEXT.en[key] || key) : table[key];
    if (!params) return value;
    return value.replace(/\{(\w+)\}/g, function(match, name) {
      return params[name] === undefined ? match : String(params[name]);
    });
  }

  function safeDispatch(name, detail) {
    try { window.dispatchEvent(new CustomEvent(name, { detail: detail || {} })); } catch (err) { /* old browser */ }
  }

  function beijingDate(timestamp) {
    return new Date((timestamp === undefined ? Date.now() : timestamp) + BEIJING_OFFSET_MS).toISOString().slice(0, 10);
  }

  function nextBeijingMidnight(timestamp) {
    var now = timestamp === undefined ? Date.now() : timestamp;
    var shifted = new Date(now + BEIJING_OFFSET_MS);
    var nextUtc = Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate() + 1);
    return nextUtc - BEIJING_OFFSET_MS;
  }

  function formatDuration(milliseconds) {
    var seconds = Math.max(0, Math.floor((Number(milliseconds) || 0) / 1000));
    var minutes = Math.floor(seconds / 60);
    seconds %= 60;
    return minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
  }

  function formatCountdown(milliseconds) {
    var seconds = Math.max(0, Math.ceil(milliseconds / 1000));
    var hours = Math.floor(seconds / 3600);
    var minutes = Math.floor((seconds % 3600) / 60);
    var remainder = seconds % 60;
    return (hours < 10 ? '0' : '') + hours + ':' +
      (minutes < 10 ? '0' : '') + minutes + ':' + (remainder < 10 ? '0' : '') + remainder;
  }

  function hashString(value) {
    var hash = 2166136261;
    for (var i = 0; i < value.length; i++) {
      hash ^= value.charCodeAt(i);
      hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    }
    return hash >>> 0;
  }

  function cloneArray(value) { return Array.isArray(value) ? value.slice() : []; }

  function playerKey() {
    try {
      var saved = localStorage.getItem(PLAYER_KEY_STORAGE);
      if (saved && /^[A-Za-z0-9_-]{16,128}$/.test(saved)) return saved;
      var created;
      if (window.crypto && typeof window.crypto.randomUUID === 'function') created = window.crypto.randomUUID();
      else if (window.crypto && window.crypto.getRandomValues) {
        var bytes = new Uint8Array(24);
        window.crypto.getRandomValues(bytes);
        created = Array.prototype.map.call(bytes, function(value) { return ('0' + value.toString(16)).slice(-2); }).join('');
      } else {
        created = 'daily-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
      }
      localStorage.setItem(PLAYER_KEY_STORAGE, created);
      return created;
    } catch (err) {
      return 'daily-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    }
  }

  function DailyChallengeController(gameInstance, options) {
    options = options || {};
    if (!gameInstance) throw new Error('DailyChallengeController requires a game instance.');
    this.game = gameInstance;
    this.apiPath = options.apiPath || API_PATH;
    this.storageKey = options.storageKey || STORAGE_KEY;
    this.playerKey = playerKey();
    this.active = false;
    this.loading = false;
    this.challenge = null;
    this.challenger = null;
    this.lastResult = null;
    this.shareCode = null;
    this.startedAt = 0;
    this.elapsedBeforeStart = 0;
    this.undoCount = 0;
    this.pendingSubmitAt = 0;
    this.restoring = false;
    this.stale = false;
    this.onlineSource = false;
    this.undoCount = 0;
    this.state = this.loadState();
    this.original = {
      newGame: gameInstance.newGame.bind(gameInstance),
      onWin: gameInstance.onWin.bind(gameInstance),
      submitWord: gameInstance.submitWord.bind(gameInstance)
    };
    this.installGameHooks();
    this.bindUI();
    this.ensureResultOverlay();
    this.refreshLanguage();
    this.timer = window.setInterval(this.tick.bind(this), 1000);
    this.parseIncomingLink();
  }

  DailyChallengeController.prototype.emptyState = function() {
    return { version: 1, days: {}, streak: { count: 0, lastDate: null } };
  };

  DailyChallengeController.prototype.loadState = function() {
    try {
      var parsed = JSON.parse(localStorage.getItem(this.storageKey) || 'null');
      if (!parsed || parsed.version !== 1 || !parsed.days) return this.emptyState();
      if (!parsed.streak) parsed.streak = { count: 0, lastDate: null };
      return parsed;
    } catch (err) {
      return this.emptyState();
    }
  };

  DailyChallengeController.prototype.saveState = function() {
    try { localStorage.setItem(this.storageKey, JSON.stringify(this.state)); } catch (err) { /* private mode */ }
    safeDispatch('wordloop:progress-changed');
  };

  DailyChallengeController.prototype.dayState = function(date) {
    date = date || (this.challenge && this.challenge.date) || beijingDate();
    if (!this.state.days[date]) this.state.days[date] = { first: null, best: null, bestUnassisted: null, inProgress: null };
    return this.state.days[date];
  };

  DailyChallengeController.prototype.installGameHooks = function() {
    var self = this;
    this.game.newGame = function() {
      if (self.active && self.challenge) return self.restartDaily();
      return self.original.newGame();
    };
    this.game.onWin = function() {
      if (self.active && self.challenge) return self.handleWin();
      return self.original.onWin();
    };
    this.game.submitWord = function(word) {
      if (!self.active) return self.original.submitWord(word);
      var before = self.game.chain ? self.game.chain.length : 0;
      self.pendingSubmitAt = Date.now();
      var accepted = self.original.submitWord(word);
      if (accepted && before === 1 && !self.startedAt) self.startedAt = self.pendingSubmitAt;
      self.pendingSubmitAt = 0;
      if (accepted && !self.restoring) {
        self.renderHud();
        var completed = self.game.currentRequired === self.game.targetGoal;
        if (!completed && self.challenge.maxMoves > 0 && self.currentMoves() >= self.challenge.maxMoves) {
          self.handleMoveLimit();
        } else if (!completed) {
          self.persistProgress();
        }
      }
      return accepted;
    };
  };

  DailyChallengeController.prototype.bindUI = function() {
    var self = this;
    function bind(id, eventName, callback) {
      var node = el(id);
      if (node) node.addEventListener(eventName, callback);
    }
    bind('dailyStartBtn', 'click', function() { self.startDaily(); });
    bind('dailyChallengeEntry', 'click', function(event) {
      if (event.target && event.target.closest && event.target.closest('button, a')) return;
      self.startDaily();
    });
    bind('dailyBackBtn', 'click', function() { self.showHome(); });
    bind('dailyUndoBtn', 'click', function() { self.undo(); });
    bind('hintBtn', 'click', function() {
      window.setTimeout(function() { if (self.active) { self.renderHud(); self.persistProgress(); } }, 0);
    });
    bind('solveBtn', 'click', function() {
      window.setTimeout(function() { if (self.active) { self.renderHud(); self.persistProgress(); } }, 0);
    });
    bind('dailyShareBtn', 'click', function() { self.shareResult(); });
    bind('dailyCopyBtn', 'click', function() { self.copyChallengeLink(); });
    bind('dailyDownloadBtn', 'click', function() { self.downloadResultCard(); });
    bind('dailyReplayBtn', 'click', function() { self.closeResultOverlay(); self.restartDaily(); });
    bind('dailyResultCloseBtn', 'click', function() { self.closeResultOverlay(); self.showHome(); });
    bind('dailyCloseBtn', 'click', function() { self.closeResultOverlay(); self.showHome(); });
    var overlay = el('dailyOverlay') || el('dailyResultOverlay');
    if (overlay) overlay.addEventListener('click', function(event) {
      if (event.target === overlay) self.closeResultOverlay();
    });
    document.addEventListener('keydown', function(event) {
      var resultOverlay = el('dailyOverlay') || el('dailyResultOverlay');
      if (event.key === 'Escape' && resultOverlay && resultOverlay.classList.contains('show')) self.closeResultOverlay();
    });
  };

  DailyChallengeController.prototype.ensureResultOverlay = function() {
    if (el('dailyOverlay') || el('dailyResultOverlay') || !document.body) return;
    var overlay = document.createElement('div');
    overlay.id = 'dailyResultOverlay';
    overlay.className = 'overlay daily-result-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'dailyResultTitle');
    overlay.innerHTML = '<article class="overlay-card daily-result-card">' +
      '<button class="daily-result-close" id="dailyResultCloseBtn" type="button" aria-label="Close">×</button>' +
      '<p class="daily-result-kicker" id="dailyResultKicker"></p><h2 id="dailyResultTitle"></h2>' +
      '<p class="daily-result-meta" id="dailyResultMeta"></p><p class="daily-result-comparison" id="dailyResultComparison"></p>' +
      '<div class="daily-result-route" id="dailyResultRoute"></div><p class="daily-sync-status" id="dailySyncStatus" role="status"></p>' +
      '<div class="daily-result-actions"><button class="btn btn-primary" id="dailyShareBtn" type="button"></button>' +
      '<button class="btn btn-secondary" id="dailyCopyBtn" type="button"></button><button class="btn btn-secondary" id="dailyDownloadBtn" type="button"></button>' +
      '<button class="btn btn-secondary" id="dailyReplayBtn" type="button"></button></div></article>';
    document.body.appendChild(overlay);
    this.bindOverlayUI();
  };

  DailyChallengeController.prototype.bindOverlayUI = function() {
    var self = this;
    var actions = {
      dailyResultCloseBtn: function() { self.closeResultOverlay(); self.showHome(); },
      dailyCloseBtn: function() { self.closeResultOverlay(); self.showHome(); },
      dailyShareBtn: function() { self.shareResult(); },
      dailyCopyBtn: function() { self.copyChallengeLink(); },
      dailyDownloadBtn: function() { self.downloadResultCard(); },
      dailyReplayBtn: function() { self.closeResultOverlay(); self.restartDaily(); }
    };
    Object.keys(actions).forEach(function(id) {
      var node = el(id);
      if (node && !node.getAttribute('data-daily-bound')) {
        node.setAttribute('data-daily-bound', 'true');
        node.addEventListener('click', actions[id]);
      }
    });
    var overlay = el('dailyOverlay') || el('dailyResultOverlay');
    if (overlay && !overlay.getAttribute('data-daily-bound')) {
      overlay.setAttribute('data-daily-bound', 'true');
      overlay.addEventListener('click', function(event) { if (event.target === overlay) self.closeResultOverlay(); });
    }
  };

  DailyChallengeController.prototype.parseIncomingLink = function() {
    if (!window.URLSearchParams) return;
    var self = this;
    var params = new URLSearchParams(window.location.search || '');
    var code = params.get('challenge');
    var requestedDate = params.get('daily');
    if (code) this.loadChallengeLink(code).then(function() { self.enter(); });
    else if (requestedDate) this.loadToday(requestedDate).then(function() { self.enter(); });
  };

  DailyChallengeController.prototype.fetchJson = function(url, options) {
    if (!canUseBackend()) return Promise.reject(new Error('backend unavailable for this URL protocol'));
    if (!window.fetch) return Promise.reject(new Error('fetch unavailable'));
    var request = options || {};
    request.headers = request.headers || {};
    request.headers.Accept = 'application/json';
    if (request.body && !request.headers['Content-Type']) request.headers['Content-Type'] = 'application/json';
    return fetch(url, request).then(function(response) {
      return response.text().then(function(body) {
        var data = body ? JSON.parse(body) : {};
        if (!response.ok) throw new Error((data && data.error) || ('HTTP ' + response.status));
        return data;
      });
    });
  };

  DailyChallengeController.prototype.normalizeChallenge = function(raw, fallbackDate) {
    raw = raw && raw.challenge ? raw.challenge : (raw || {});
    var startWord = String(raw.startWord || raw.start_word || raw.word || '').toLowerCase().trim();
    if (!/^[a-z]{3,45}$/.test(startWord)) return null;
    var date = String(raw.date || raw.dateKey || raw.challengeDate || raw.challenge_date || fallbackDate || beijingDate()).slice(0, 10);
    return {
      id: raw.id || raw.challengeId || raw.challenge_id || date,
      title: String(raw.title || ''),
      date: date,
      number: Number(raw.number || raw.issue || raw.dayNumber || this.issueNumber(date)),
      startWord: startWord,
      difficulty: /^(easy|medium|hard)$/.test(raw.difficulty) ? raw.difficulty : 'medium',
      minimumMoves: Number(raw.minimumMoves || raw.minimum_moves || raw.shortest || 0),
      targetMoves: Number(raw.targetMoves || raw.parMoves || raw.par_moves || 0),
      maxMoves: Number(raw.maxMoves || raw.max_moves || 0),
      hintLimit: raw.hintLimit === undefined ? (raw.hint_limit === undefined ? 1 : Number(raw.hint_limit)) : Number(raw.hintLimit),
      resetAt: Number(raw.resetAt || raw.reset_at || 0) || nextBeijingMidnight()
    };
  };

  DailyChallengeController.prototype.issueNumber = function(date) {
    var parts = String(date).split('-');
    var stamp = Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    var epoch = Date.UTC(2026, 0, 1);
    return Math.max(1, Math.floor((stamp - epoch) / DAY_MS) + 1);
  };

  DailyChallengeController.prototype.localChallenge = function(date) {
    if (typeof window.getDailyChallenge === 'function') {
      try {
        var daily = window.getDailyChallenge(date);
        var fromHelper = {};
        var helperChallenge = daily && daily.challenge ? daily.challenge : {};
        for (var helperKey in helperChallenge) {
          if (Object.prototype.hasOwnProperty.call(helperChallenge, helperKey)) fromHelper[helperKey] = helperChallenge[helperKey];
        }
        fromHelper.date = daily.dateKey || date;
        fromHelper.number = Number(daily.dayNumber) + 1;
        return this.normalizeChallenge(fromHelper, date);
      } catch (helperError) { /* use the tolerant formats below */ }
    }
    var source = window.DAILY_CHALLENGES;
    var selected = null;
    if (Array.isArray(source) && source.length) {
      for (var i = 0; i < source.length; i++) {
        if (source[i] && (source[i].date === date || source[i].challengeDate === date)) { selected = source[i]; break; }
      }
      if (!selected) selected = source[hashString(date) % source.length];
    } else if (source && typeof source === 'object') {
      selected = source[date] || (source.challenges && source.challenges[date]);
      if (!selected && Array.isArray(source.challenges) && source.challenges.length) {
        selected = source.challenges[hashString(date) % source.challenges.length];
      }
    }
    if (!selected && this.game._startCandidates && this.game._startCandidates.length) {
      selected = this.game._startCandidates[hashString(date) % this.game._startCandidates.length];
      selected = {
        startWord: selected.word, difficulty: this.game.difficulty || 'medium',
        minimumMoves: selected.pathLength, hintLimit: 1
      };
    }
    return this.normalizeChallenge(selected, date);
  };

  DailyChallengeController.prototype.loadToday = function(date) {
    var self = this;
    if (this.loading) return this.loading;
    date = date || beijingDate();
    this.setEntryStatus(text('loading'));
    if (date !== beijingDate()) {
      var archived = this.localChallenge(date);
      if (!archived) return Promise.reject(new Error(text('unavailable')));
      this.challenge = archived;
      this.onlineSource = false;
      this.renderEntry(text('expired', { date: date }));
      return Promise.resolve(archived);
    }
    var suffix = date && date !== beijingDate() ? '?date=' + encodeURIComponent(date) : '';
    this.loading = this.fetchJson(this.apiPath + suffix).then(function(payload) {
      var challenge = self.normalizeChallenge(payload, date);
      if (!challenge) {
        challenge = self.localChallenge(payload.challengeDate || date);
        if (challenge) {
          challenge.number = Number(payload.challengeNumber || challenge.number);
          challenge.resetAt = new Date(payload.resetAt || challenge.resetAt).getTime() || challenge.resetAt;
          challenge.statistics = payload.statistics || null;
        }
      }
      if (!challenge) throw new Error('invalid daily challenge');
      self.onlineSource = true;
      self.challenge = challenge;
      self.renderEntry('');
      safeDispatch('wordloop:daily-loaded', { challenge: challenge, online: true });
      return challenge;
    }).catch(function(error) {
      if (console && console.warn) console.warn('Daily challenge API fallback:', error.message);
      var challenge = self.localChallenge(date);
      if (!challenge) {
        self.setEntryStatus(text('unavailable'));
        throw error;
      }
      self.onlineSource = false;
      self.challenge = challenge;
      self.renderEntry(text('offlineReady'));
      safeDispatch('wordloop:daily-loaded', { challenge: challenge, online: false });
      return challenge;
    }).finally(function() { self.loading = false; });
    return this.loading;
  };

  DailyChallengeController.prototype.loadChallengeLink = function(code) {
    var self = this;
    this.shareCode = String(code || '').slice(0, 80);
    this.setEntryStatus(text('loading'));
    return this.fetchJson(this.apiPath + '/share/' + encodeURIComponent(this.shareCode)).then(function(payload) {
      self.challenger = payload.score || payload.share || payload.challenger || payload.result || null;
      if (self.challenger && self.challenger.steps !== undefined && self.challenger.moves === undefined) self.challenger.moves = Number(self.challenger.steps);
      var challengeDate = payload.challengeDate || (self.challenger && (self.challenger.date || self.challenger.challengeDate));
      var challenge = self.normalizeChallenge(payload.challenge || payload, challengeDate);
      if (!challenge) challenge = self.localChallenge(challengeDate || beijingDate());
      if (!challenge) throw new Error('invalid shared challenge');
      self.challenge = challenge;
      self.onlineSource = true;
      self.renderEntry(challenge.date !== beijingDate() ? text('expired', { date: challenge.date }) : '');
      self.recordReferral('open');
      safeDispatch('wordloop:daily-loaded', { challenge: challenge, challenger: self.challenger, online: true });
      return challenge;
    }).catch(function(error) {
      self.challenger = null;
      return self.loadToday();
    });
  };

  DailyChallengeController.prototype.enter = function() {
    var self = this;
    if (window.campaignController && window.campaignController.mode !== 'casual') {
      window.campaignController.setMode('casual', true);
    }
    document.body.classList.add('daily-challenge-mode');
    document.body.classList.remove('daily-challenge-playing');
    var home = el('dailyHome');
    var layout = document.querySelector('.layout');
    if (home) home.hidden = false;
    if (layout) layout.style.display = 'none';
    if (el('campaignHome')) el('campaignHome').hidden = true;
    if (el('campaignHud')) el('campaignHud').hidden = true;
    if (el('dailyHud')) el('dailyHud').hidden = true;
    var buttons = document.querySelectorAll('.game-mode-btn');
    for (var i = 0; i < buttons.length; i++) {
      var selected = buttons[i].getAttribute('data-game-mode') === 'daily';
      buttons[i].classList.toggle('active', selected);
      buttons[i].setAttribute('aria-pressed', selected ? 'true' : 'false');
    }
    var ready = this.challenge ? Promise.resolve(this.challenge) : this.loadToday();
    return ready.then(function(challenge) {
      self.challenge = challenge;
      self.renderEntry();
      return challenge;
    }).catch(function() { return null; });
  };

  DailyChallengeController.prototype.showHome = function() {
    if (this.active) this.persistProgress();
    this.active = false;
    this.startedAt = 0;
    this.elapsedBeforeStart = 0;
    this.closeResultOverlay();
    document.body.classList.add('daily-challenge-mode');
    document.body.classList.remove('daily-challenge-playing');
    if (el('dailyHome')) el('dailyHome').hidden = false;
    if (el('dailyHud')) el('dailyHud').hidden = true;
    var layout = document.querySelector('.layout');
    if (layout) layout.style.display = 'none';
    this.renderEntry();
  };

  DailyChallengeController.prototype.leave = function() {
    if (this.active) this.persistProgress();
    this.active = false;
    this.startedAt = 0;
    this.elapsedBeforeStart = 0;
    this.closeResultOverlay();
    document.body.classList.remove('daily-challenge-mode', 'daily-challenge-playing');
    if (el('dailyHome')) el('dailyHome').hidden = true;
    if (el('dailyHud')) el('dailyHud').hidden = true;
    this.game.completionModeOverride = null;
    this.game.hintLimitOverride = null;
    this.game.hintWordsOverride = null;
  };

  DailyChallengeController.prototype.startDaily = function(challenge) {
    var self = this;
    var ready = challenge ? Promise.resolve(this.normalizeChallenge(challenge)) :
      (this.challenge ? Promise.resolve(this.challenge) : this.loadToday());
    return ready.then(function(normalized) {
      if (!normalized) throw new Error('invalid daily challenge');
      self.challenge = normalized;
      if (window.campaignController && window.campaignController.mode !== 'casual') window.campaignController.setMode('casual', true);
      self.active = true;
      self.stale = false;
      self.closeResultOverlay();
      document.body.classList.add('daily-challenge-mode', 'daily-challenge-playing');
      if (el('dailyHome')) el('dailyHome').hidden = true;
      var layout = document.querySelector('.layout');
      if (layout) layout.style.display = '';
      var hud = el('dailyHud');
      if (hud) hud.hidden = false;
      var solve = el('solveSection');
      if (solve) solve.style.display = 'none';
      self.game.completionModeOverride = 'daily';
      return self.game.ensureDifficultyAvailable(normalized.difficulty).then(function() {
        if (self.game.difficulty !== normalized.difficulty) {
          self.game.difficulty = normalized.difficulty;
          self.game.buildGraph();
        }
        self.game.hintLimitOverride = isNaN(normalized.hintLimit) ? 1 : Math.max(0, normalized.hintLimit);
        self.game.hintWordsOverride = 1;
        self.game._replayWord = normalized.startWord;
        self.original.newGame();
        if (el('solveSection')) el('solveSection').style.display = 'none';
        if (self.game.startWord !== normalized.startWord) throw new Error(text('invalidWord'));
        var progress = self.dayState(normalized.date).inProgress;
        self.restoreProgress(progress);
        self.renderHud();
        if (normalized.maxMoves > 0 && self.currentMoves() >= normalized.maxMoves && self.game.currentRequired !== self.game.targetGoal) {
          self.handleMoveLimit();
        }
        self.recordReferral('start');
        safeDispatch('wordloop:daily-started', { challenge: normalized, restored: !!progress });
        return normalized;
      });
    }).catch(function(error) {
      self.active = false;
      document.body.classList.remove('daily-challenge-mode', 'daily-challenge-playing');
      if (self.game && self.game.showMessage) self.game.showMessage(error.message || text('unavailable'), 'error');
      throw error;
    });
  };

  DailyChallengeController.prototype.restoreProgress = function(progress) {
    if (!progress || !Array.isArray(progress.chain) || progress.chain[0] !== this.challenge.startWord || progress.chain.length < 1) return;
    this.restoring = true;
    this.elapsedBeforeStart = Math.max(0, Number(progress.elapsedMs) || 0);
    this.startedAt = progress.started ? Date.now() : 0;
    for (var i = 1; i < progress.chain.length; i++) {
      if (!this.original.submitWord(progress.chain[i])) break;
    }
    this.game.assisted = !!progress.assisted;
    this.game.hintUses = Math.max(0, Number(progress.hintUses) || 0);
    this.undoCount = Math.max(0, Number(progress.undoCount) || 0);
    if (this.game._updateHintButton) this.game._updateHintButton();
    this.restoring = false;
  };

  DailyChallengeController.prototype.restartDaily = function() {
    if (!this.challenge) return this.startDaily();
    var day = this.dayState(this.challenge.date);
    day.inProgress = null;
    this.saveState();
    this.startedAt = 0;
    this.elapsedBeforeStart = 0;
    this.undoCount = 0;
    this.game._replayWord = this.challenge.startWord;
    this.original.newGame();
    if (el('solveSection')) el('solveSection').style.display = 'none';
    this.renderHud();
  };

  DailyChallengeController.prototype.exitDaily = function() {
    this.leave();
    if (window.campaignController) window.campaignController.setMode('casual');
    else this.original.newGame();
  };

  DailyChallengeController.prototype.currentElapsed = function() {
    return this.elapsedBeforeStart + (this.startedAt ? Math.max(0, Date.now() - this.startedAt) : 0);
  };

  DailyChallengeController.prototype.currentMoves = function() {
    return Math.max(0, this.game.chain ? this.game.chain.length - 1 : 0);
  };

  DailyChallengeController.prototype.persistProgress = function() {
    if (!this.active || !this.challenge || !this.game.chain) return;
    this.dayState(this.challenge.date).inProgress = {
      chain: cloneArray(this.game.chain), elapsedMs: this.currentElapsed(), started: !!this.startedAt,
      assisted: !!this.game.assisted, hintUses: Number(this.game.hintUses) || 0,
      undoCount: this.undoCount, updatedAt: Date.now()
    };
    this.saveState();
  };

  DailyChallengeController.prototype.compareResults = function(a, b) {
    if (!b) return 0;
    var aAssisted = !!a.assisted;
    var bAssisted = !!b.assisted;
    if (aAssisted !== bAssisted) return aAssisted ? -1 : 1;
    var aMoves = Number(a.moves) || 0;
    var bMoves = Number(b.moves || b.moveCount || b.move_count) || 0;
    if (aMoves !== bMoves) return aMoves < bMoves ? 1 : -1;
    var aTime = Number(a.elapsedMs) || 0;
    var bTime = Number(b.elapsedMs || b.elapsed_ms || b.durationMs || b.duration_ms) || 0;
    if (!bTime || aTime === bTime) return 0;
    return aTime < bTime ? 1 : -1;
  };

  DailyChallengeController.prototype.isBetter = function(result, previous) {
    if (previous && !!result.assisted !== !!previous.assisted) return !result.assisted;
    return !previous || this.compareResults(result, previous) > 0;
  };

  DailyChallengeController.prototype.handleWin = function() {
    if (!this.startedAt) this.startedAt = this.pendingSubmitAt || Date.now();
    var elapsed = this.currentElapsed();
    this.original.onWin();
    var result = {
      date: this.challenge.date, challengeId: this.challenge.id, issue: this.challenge.number,
      startWord: this.challenge.startWord, moves: this.currentMoves(), elapsedMs: elapsed,
      assisted: !!this.game.assisted, hintUses: Number(this.game.hintUses) || 0,
      undoCount: this.undoCount,
      chain: cloneArray(this.game.chain), completedAt: Date.now()
    };
    var day = this.dayState(this.challenge.date);
    var firstClear = !day.first;
    var newBest = this.isBetter(result, day.best);
    if (firstClear) day.first = result;
    if (newBest) day.best = result;
    if (!result.assisted && this.isBetter(result, day.bestUnassisted)) day.bestUnassisted = result;
    day.inProgress = null;
    this.updateStreak(this.challenge.date, firstClear);
    this.saveState();
    this.lastResult = result;
    this.startedAt = 0;
    this.elapsedBeforeStart = elapsed;
    var overlay = el('winOverlay');
    if (overlay) overlay.classList.remove('show');
    this.renderHud();
    this.showResultOverlay(result, firstClear, newBest);
    this.submitCompletion(result);
    this.recordReferral('complete');
    safeDispatch('wordloop:daily-completed', { result: result, firstClear: firstClear, newBest: newBest });
  };

  DailyChallengeController.prototype.updateStreak = function(date, firstClear) {
    if (!firstClear) return;
    var streak = this.state.streak || { count: 0, lastDate: null };
    if (streak.lastDate === date) return;
    var yesterday = beijingDate(Date.UTC(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, Number(date.slice(8, 10))) - DAY_MS - BEIJING_OFFSET_MS);
    streak.count = streak.lastDate === yesterday ? streak.count + 1 : 1;
    streak.lastDate = date;
    this.state.streak = streak;
  };

  DailyChallengeController.prototype.handleMoveLimit = function() {
    this.elapsedBeforeStart = this.currentElapsed();
    this.startedAt = 0;
    if (el('wordInput')) el('wordInput').disabled = true;
    if (el('submitBtn')) el('submitBtn').disabled = true;
    if (el('hintBtn')) el('hintBtn').disabled = true;
    if (this.game.showMessage) {
      this.game.showMessage(text('moveLimitReached', { max: this.challenge.maxMoves }), 'error');
    }
    this.renderHud();
    this.persistProgress();
  };

  DailyChallengeController.prototype.undo = function() {
    if (!this.active || !this.game.chain || this.game.chain.length <= 1) return false;
    this.markAssisted('undo');
    this.undoCount++;
    this.game.chain.pop();
    this.game.usedWords = new Set(this.game.chain);
    this.game.usedLemmas = new Set();
    for (var i = 0; i < this.game.chain.length; i++) {
      this.game.usedLemmas.add(this.game.wordLemmaRoots.get(this.game.chain[i]) || this.game.chain[i]);
    }
    var lastWord = this.game.chain[this.game.chain.length - 1];
    this.game.currentRequired = lastWord.slice(-2);
    this.game.render();
    this.game.updateStats();
    this.game.hideHints();
    this.game.hideMessage();
    var input = el('wordInput');
    if (input) {
      input.disabled = false;
      input.value = this.game.currentRequired;
      input.focus();
      input.setSelectionRange(2, 2);
    }
    if (el('submitBtn')) el('submitBtn').disabled = false;
    if (this.game._updateHintButton) this.game._updateHintButton();
    if (!this.startedAt && this.elapsedBeforeStart > 0) this.startedAt = Date.now();
    this.renderHud();
    this.persistProgress();
    return true;
  };

  DailyChallengeController.prototype.markAssisted = function() {
    this.game.assisted = true;
    this.renderHud();
    this.persistProgress();
  };

  DailyChallengeController.prototype.submitCompletion = function(result) {
    var self = this;
    var status = el('dailySyncStatus') || el('dailyStatus');
    return this.fetchJson(this.apiPath + '/complete', {
      method: 'POST', body: JSON.stringify({
        challengeDate: result.date, steps: result.moves, durationMs: Math.max(250, Math.round(result.elapsedMs)),
        assisted: result.assisted, hintCount: result.hintUses, undoCount: result.undoCount || 0,
        route: result.chain, playerKey: this.playerKey
      })
    }).then(function(payload) {
      self.onlineSource = true;
      if (status) status.textContent = text('apiSaved');
      if (payload && payload.stats) self.lastResult.stats = payload.stats;
      return payload;
    }).catch(function() {
      if (status) status.textContent = text('apiPending');
      return null;
    });
  };

  DailyChallengeController.prototype.recordReferral = function(eventName) {
    if (!this.shareCode) return Promise.resolve(null);
    return this.fetchJson(this.apiPath + '/referral', {
      method: 'POST', body: JSON.stringify({ code: this.shareCode, eventType: eventName, playerKey: this.playerKey })
    }).catch(function() { return null; });
  };

  DailyChallengeController.prototype.renderEntry = function(message) {
    if (!this.challenge) return;
    if (message !== undefined) this.entryMessage = message;
    message = this.entryMessage || '';
    var day = this.dayState(this.challenge.date);
    var best = day.bestUnassisted || day.best;
    var streakCount = Number((this.state.streak && this.state.streak.count) || 0);
    var values = {
      dailyEntryDate: text('dateLabel', { date: this.challenge.date }),
      dailyEntryNumber: text('issue', { number: this.challenge.number }),
      dailyEntryWord: this.challenge.startWord,
      dailyEntryStatus: message || '',
      dailyDateLabel: this.challenge.date,
      dailyStampNumber: '#' + String(this.challenge.number).padStart(3, '0'),
      dailyKicker: language() === 'en' ? 'DAILY LOOP · SAME PUZZLE' : '每日一环 · 同日同题',
      dailyHomeTitle: language() === 'en' ? text('daily') : (this.challenge.title || text('daily')),
      dailyHomeCopy: language() === 'en' ? 'Everyone gets the same opening word. Close the loop in fewer moves, then challenge a friend.' : '所有人挑战同一个起始词。用更少的词闭环，再把成绩发给好友。',
      dailyStartWord: this.challenge.startWord,
      dailyTarget: this.challenge.startWord.slice(-2).toUpperCase() + ' → ' + this.challenge.startWord.slice(0, 2).toUpperCase(),
      dailyBest: best ? text('resultMeta', { moves: best.moves, time: formatDuration(best.elapsedMs), assist: text(best.assisted ? 'assisted' : 'unassisted') }) : '--',
      dailyStreak: language() === 'en' ? streakCount + (streakCount === 1 ? ' day' : ' days') : streakCount + ' 天',
      dailyCountdown: formatCountdown(this.challenge.resetAt - Date.now()),
      dailyBestLabel: language() === 'en' ? 'Today\'s best' : '今日最佳',
      dailyStreakLabel: language() === 'en' ? 'Current streak' : '连续完成',
      dailyCountdownLabel: language() === 'en' ? 'New puzzle in' : '距离换题',
      dailyStatus: message || '',
      dailyStartBtn: text('start')
    };
    Object.keys(values).forEach(function(id) { if (el(id)) el(id).textContent = values[id]; });
    var entry = el('dailyChallengeEntry');
    if (entry) entry.classList.add('is-ready');
  };

  DailyChallengeController.prototype.setEntryStatus = function(message) {
    this.entryMessage = message || '';
    if (el('dailyEntryStatus')) el('dailyEntryStatus').textContent = message;
    if (el('dailyStatus')) el('dailyStatus').textContent = message;
  };

  DailyChallengeController.prototype.renderHud = function() {
    if (!this.challenge) return;
    var values = {
      dailyChallengeLabel: text('issue', { number: this.challenge.number }),
      dailyMoveCount: this.challenge.maxMoves > 0 ?
        text('movesLimit', { count: this.currentMoves(), max: this.challenge.maxMoves }) :
        text('moves', { count: this.currentMoves() }),
      dailyTimer: formatDuration(this.currentElapsed()),
      dailyResetCountdown: text('resetsIn', { time: formatCountdown(this.challenge.resetAt - Date.now()) }),
      dailyBackBtn: text('back'), dailyUndoBtn: language() === 'en' ? 'Undo' : '撤销'
    };
    Object.keys(values).forEach(function(id) { if (el(id)) el(id).textContent = values[id]; });
    var assisted = el('dailyAssistedBadge');
    if (assisted) {
      assisted.textContent = this.game.assisted ? text('assisted') : text('unassisted');
      assisted.classList.toggle('is-assisted', !!this.game.assisted);
    }
    if (el('dailyUndoBtn')) el('dailyUndoBtn').disabled = !this.game.chain || this.game.chain.length <= 1;
    var best = this.dayState(this.challenge.date).bestUnassisted || this.dayState(this.challenge.date).best;
    if (el('statRecord')) el('statRecord').textContent = best ? best.moves : '--';
  };

  DailyChallengeController.prototype.tick = function() {
    if (this.active) this.renderHud();
    if (this.challenge && this.challenge.date === beijingDate()) {
      var remaining = formatCountdown(this.challenge.resetAt - Date.now());
      var countdown = el('dailyResetCountdown');
      if (countdown) countdown.textContent = text('resetsIn', { time: remaining });
      if (el('dailyCountdown')) el('dailyCountdown').textContent = remaining;
    }
    if (this.active && this.challenge && !this.stale && this.challenge.date !== beijingDate()) {
      this.stale = true;
      this.persistProgress();
      if (this.game.showMessage) this.game.showMessage(text('dayChanged'), 'info');
    }
  };

  DailyChallengeController.prototype.pairTrail = function(chain) {
    if (!chain || !chain.length) return '';
    var pairs = [chain[0].slice(0, 2).toUpperCase()];
    for (var i = 0; i < chain.length; i++) pairs.push(chain[i].slice(-2).toUpperCase());
    return pairs.join(' → ');
  };

  DailyChallengeController.prototype.showResultOverlay = function(result, firstClear, newBest) {
    this.ensureResultOverlay();
    var overlay = el('dailyOverlay') || el('dailyResultOverlay');
    if (!overlay) return;
    if (el('dailyResultKicker')) el('dailyResultKicker').textContent = text('completeKicker');
    if (el('dailyResultTitle')) el('dailyResultTitle').textContent = text('completeTitle');
    if (el('dailyOverlayKicker')) el('dailyOverlayKicker').textContent = text('completeKicker');
    if (el('dailyOverlayTitle')) el('dailyOverlayTitle').textContent = text('completeTitle');
    if (el('dailyResultMeta')) el('dailyResultMeta').textContent = text('resultMeta', {
      moves: result.moves, time: formatDuration(result.elapsedMs), assist: text(result.assisted ? 'assisted' : 'unassisted')
    });
    if (el('dailyResultStamp')) el('dailyResultStamp').textContent = text('resultMeta', {
      moves: result.moves, time: formatDuration(result.elapsedMs), assist: text(result.assisted ? 'assisted' : 'unassisted')
    });
    var comparison = firstClear ? text('firstClear') : (newBest ? text('newBest') : text('finished'));
    if (this.challenger) {
      var outcome = this.compareResults(result, this.challenger);
      comparison = text(outcome > 0 ? 'won' : (outcome < 0 ? 'lost' : 'tied')) + ' · ' + text('rival', {
        moves: Number(this.challenger.moves || this.challenger.moveCount || 0),
        time: formatDuration(Number(this.challenger.elapsedMs || this.challenger.elapsed_ms || 0))
      });
    }
    if (el('dailyResultComparison')) el('dailyResultComparison').textContent = comparison;
    if (el('dailyResultCopy')) el('dailyResultCopy').textContent = comparison + ' · ' + this.pairTrail(result.chain);
    var opponent = el('dailyOpponentResult');
    if (opponent) {
      opponent.hidden = !this.challenger;
      opponent.textContent = this.challenger ? text('rival', {
        moves: Number(this.challenger.moves || this.challenger.steps || this.challenger.moveCount || 0),
        time: formatDuration(Number(this.challenger.elapsedMs || this.challenger.elapsed_ms || 0))
      }) : '';
    }
    if (el('dailyResultRoute')) el('dailyResultRoute').textContent = this.pairTrail(result.chain);
    if (el('dailyShareBtn')) el('dailyShareBtn').textContent = text('share');
    if (el('dailyCopyBtn')) el('dailyCopyBtn').textContent = text('copy');
    if (el('dailyDownloadBtn')) el('dailyDownloadBtn').textContent = text('download');
    if (el('dailyReplayBtn')) el('dailyReplayBtn').textContent = text('restart');
    if (el('dailyResultCloseBtn')) el('dailyResultCloseBtn').setAttribute('aria-label', text('close'));
    if (el('dailyCloseBtn')) el('dailyCloseBtn').textContent = language() === 'en' ? 'Back to today\'s puzzle' : '返回今日题目';
    overlay.classList.add('show');
    var focusTarget = el('dailyShareBtn') || el('dailyResultCloseBtn');
    if (focusTarget) focusTarget.focus();
  };

  DailyChallengeController.prototype.closeResultOverlay = function() {
    var overlay = el('dailyOverlay') || el('dailyResultOverlay');
    if (overlay) overlay.classList.remove('show');
  };

  DailyChallengeController.prototype.refreshLanguage = function() {
    this.renderEntry();
    if (this.active) this.renderHud();
    var overlay = el('dailyOverlay') || el('dailyResultOverlay');
    if (this.lastResult && overlay && overlay.classList.contains('show')) {
      this.showResultOverlay(this.lastResult, false, false);
    }
  };

  DailyChallengeController.prototype.sharePayload = function(url) {
    var result = this.lastResult || (this.challenge && this.dayState(this.challenge.date).best);
    if (!result) return null;
    return {
      title: text('shareTitle', { date: result.date }),
      text: text('shareText', {
        number: result.issue || (this.challenge && this.challenge.number), moves: result.moves,
        time: formatDuration(result.elapsedMs), assist: text(result.assisted ? 'assisted' : 'unassisted')
      }),
      url: url || window.location.href.split('?')[0] + '?daily=' + encodeURIComponent(result.date)
    };
  };

  DailyChallengeController.prototype.createShareLink = function() {
    var self = this;
    var result = this.lastResult || (this.challenge && this.dayState(this.challenge.date).best);
    if (!result) return Promise.reject(new Error(text('noResult')));
    if (this.createdShareUrl) return Promise.resolve(this.createdShareUrl);
    return this.fetchJson(this.apiPath + '/share', {
      method: 'POST', body: JSON.stringify({
        challengeDate: result.date, playerKey: this.playerKey
      })
    }).then(function(payload) {
      var code = payload.code || payload.shareCode || (payload.share && payload.share.code);
      if (!code) throw new Error('missing share code');
      self.createdShareUrl = window.location.href.split('?')[0] + '?challenge=' + encodeURIComponent(code);
      return self.createdShareUrl;
    }).catch(function() {
      return window.location.href.split('?')[0] + '?daily=' + encodeURIComponent(result.date);
    });
  };

  DailyChallengeController.prototype.shareResult = function() {
    var self = this;
    return this.createShareLink().then(function(url) {
      var payload = self.sharePayload(url);
      if (navigator.share) return navigator.share(payload).catch(function(error) {
        if (error && error.name === 'AbortError') return false;
        return self.copyText(payload.text + '\n' + payload.url);
      });
      return self.copyText(payload.text + '\n' + payload.url);
    }).catch(function(error) {
      if (self.game.showMessage) self.game.showMessage(error.message || text('shareFailed'), 'error');
      return false;
    });
  };

  DailyChallengeController.prototype.copyChallengeLink = function() {
    var self = this;
    return this.createShareLink().then(function(url) { return self.copyText(url); }).catch(function(error) {
      if (self.game.showMessage) self.game.showMessage(error.message || text('shareFailed'), 'error');
      return false;
    });
  };

  DailyChallengeController.prototype.copyText = function(value) {
    var self = this;
    var promise;
    if (navigator.clipboard && navigator.clipboard.writeText) promise = navigator.clipboard.writeText(value);
    else {
      promise = new Promise(function(resolve, reject) {
        var area = document.createElement('textarea');
        area.value = value;
        area.setAttribute('readonly', '');
        area.style.position = 'fixed'; area.style.opacity = '0';
        document.body.appendChild(area); area.select();
        try { document.execCommand('copy') ? resolve() : reject(new Error('copy failed')); }
        catch (error) { reject(error); }
        document.body.removeChild(area);
      });
    }
    return promise.then(function() {
      var status = el('dailySyncStatus') || el('dailyStatus');
      if (status) status.textContent = text('copied');
      else if (self.game.showMessage) self.game.showMessage(text('copied'), 'success');
      return true;
    });
  };

  DailyChallengeController.prototype.renderResultCard = function() {
    var result = this.lastResult || (this.challenge && this.dayState(this.challenge.date).best);
    if (!result) return null;
    var canvas = document.createElement('canvas');
    canvas.width = 1200; canvas.height = 1500;
    var context = canvas.getContext('2d');
    if (!context) return null;
    context.fillStyle = '#f2eee5'; context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#181816'; context.fillRect(72, 72, 1056, 10);
    context.font = '600 34px ui-monospace, monospace'; context.fillText('WORD LOOP / DAILY', 88, 155);
    context.font = '700 92px Georgia, serif'; context.fillText(text('daily'), 88, 295);
    context.fillStyle = '#68635a'; context.font = '32px system-ui, sans-serif';
    context.fillText(result.date + '  ·  #' + (result.issue || this.challenge.number), 88, 370);
    context.fillStyle = '#181816'; context.font = '700 160px Georgia, serif'; context.fillText(String(result.moves), 88, 615);
    context.font = '32px system-ui, sans-serif'; context.fillText(language() === 'en' ? 'MOVES' : '步闭环', 330, 600);
    context.fillStyle = '#68635a'; context.fillText(formatDuration(result.elapsedMs) + '  ·  ' + text(result.assisted ? 'assisted' : 'unassisted'), 88, 690);
    context.strokeStyle = '#bbb3a5'; context.lineWidth = 2; context.strokeRect(88, 780, 1024, 230);
    context.fillStyle = '#8f321f'; context.font = '600 36px ui-monospace, monospace'; context.fillText(this.pairTrail(result.chain), 125, 895, 950);
    context.fillStyle = '#181816'; context.font = '600 42px Georgia, serif'; context.fillText(text('cardPrompt'), 88, 1135);
    context.fillStyle = '#68635a'; context.font = '28px system-ui, sans-serif'; context.fillText(window.location.host || 'word-chain-loop.pages.dev', 88, 1250);
    context.fillStyle = '#181816'; context.fillRect(88, 1325, 1024, 4);
    return canvas;
  };

  DailyChallengeController.prototype.downloadResultCard = function() {
    var canvas = this.renderResultCard();
    if (!canvas) return false;
    var link = document.createElement('a');
    link.download = 'word-loop-daily-' + (this.challenge ? this.challenge.date : beijingDate()) + '.png';
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    return true;
  };

  DailyChallengeController.prototype.destroy = function() {
    window.clearInterval(this.timer);
    this.game.newGame = this.original.newGame;
    this.game.onWin = this.original.onWin;
    this.game.submitWord = this.original.submitWord;
    document.body.classList.remove('daily-challenge-mode', 'daily-challenge-playing');
  };

  DailyChallengeController.beijingDate = beijingDate;
  DailyChallengeController.nextBeijingMidnight = nextBeijingMidnight;
  DailyChallengeController.bootstrap = function(options) {
    var instance = window.game || window.wordChainGame;
    if (!instance) return null;
    if (!window.dailyChallengeController) window.dailyChallengeController = new DailyChallengeController(instance, options);
    return window.dailyChallengeController;
  };

  window.DailyChallengeController = DailyChallengeController;
  if (window.game || window.wordChainGame) DailyChallengeController.bootstrap();
})();
