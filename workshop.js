(function() {
  'use strict';

  var CONFIG = {
    easy: { maxStartTier: 0, minRoute: 1, maxRoute: 2, minimumBranch: 12, minimumClosers: 3, maxSlack: 3, hintLimit: 2 },
    medium: { maxStartTier: 0, minRoute: 2, maxRoute: 3, minimumBranch: 8, minimumClosers: 2, maxSlack: 3, hintLimit: 1 },
    hard: { maxStartTier: 1, minRoute: 3, maxRoute: 6, minimumBranch: 4, minimumClosers: 2, maxSlack: 4, hintLimit: 0 }
  };
  var TEXT = {
    zh: {
      open: '关卡工坊', close: '关闭关卡工坊', kicker: 'COMMUNITY LEVEL LAB', title: '关卡工坊',
      intro: '从一个起始词出发，让系统验证路线，再把你的设计交给其他玩家。',
      create: '制作关卡', mine: '我的投稿', community: '社区关卡', review: '审核台', design: '定义关卡', verify: '验证词环',
      levelTitle: '关卡名称', levelTitlePlaceholder: '给这条词环起个名字', startWord: '起始词', startPlaceholder: '例如：remarkable',
      difficulty: '难度', easy: '简单', medium: '标准', hard: '困难', description: '设计说明（选填）',
      descriptionPlaceholder: '说说这关有趣在哪里，或给审核者留一句话。', showCreator: '发布后显示我的玩家昵称',
      idle: '输入起始词后，系统会验证单词并检查能否成环。', analyzing: '正在验证单词并构建词环…',
      invalidWord: '请输入 3–45 个英文字母，并选择正确的难度。', missingWord: '没有查到这个英文单词，请检查拼写。',
      lookupUnavailable: '暂时无法验证这个单词，请检查网络后重试。', noRoute: '这个词在当前难度下无法闭合成环。',
      valid: '验证通过。先亲自完成一次试玩，再提交审核。', shortest: '最少追加', routes: '最短解数', branches: '首步选择', closers: '优质收尾',
      wordsUnit: '{count} 词', routeLabel: '系统最短路径', testLabel: '亲自试玩后提交', testPending: '先通过系统验证，再完成一次试玩。',
      testReady: '系统验证已通过，可以开始试玩。', testDone: '试玩完成：你用 {moves} 步闭合了词环。', test: '试玩这一关', submit: '提交审核',
      loginRequired: '请先登录，再提交或查看你的投稿。', openLogin: '登录或注册', submitted: '投稿已送达审核台。',
      submitError: '投稿没有送达，请检查信息后重试。', duplicate: '你已经提交过同一难度的这个起始词。', limited: '提交过于频繁，请稍后再试。',
      invalidSubmittedWord: '词环中包含无法确认的英文单词，请检查试玩路线。',
      mineKicker: 'YOUR SUBMISSIONS', mineTitle: '我的投稿', communityKicker: 'CURATED BY PLAYERS', communityTitle: '社区关卡',
      reviewKicker: 'EDITORIAL DESK', reviewTitle: '待审核关卡', refresh: '刷新', loading: '正在读取关卡…', emptyMine: '还没有投稿。先去制作一条你愿意反复玩的词环。',
      emptyCommunity: '社区关卡还在装订中。第一批通过审核的设计会出现在这里。', emptyReview: '审核台已经清空。', loadError: '暂时无法读取关卡，请稍后重试。',
      pending: '待审核', published: '已发布', rejected: '已驳回', withdrawn: '已撤回', by: '作者 {name}', anonymous: '匿名玩家',
      play: '开始挑战', shortestMetric: '最少 {count} 步', routeMetric: '{count} 条最短解', maxMetric: '最多 {count} 步', submittedRoute: '试玩路线：{route}',
      reviewNote: '审核意见', publish: '通过并发布', reject: '驳回', reviewed: '审核结果已保存。', rejectNeedsNote: '驳回时请写明原因。',
      testHud: '自制关卡试玩', backWorkshop: '← 返回工坊', returnWorkshop: '返回工坊', target: '{tail} → {head}',
      needsTest: '起始词或难度已改变，需要重新试玩。', titleRequired: '请先填写关卡名称。'
    },
    en: {
      open: 'Level workshop', close: 'Close level workshop', kicker: 'COMMUNITY LEVEL LAB', title: 'Level workshop',
      intro: 'Choose a starting word, verify the loop, then share your design with other players.',
      create: 'Create', mine: 'My submissions', community: 'Community', review: 'Review desk', design: 'Define the level', verify: 'Verify the loop',
      levelTitle: 'Level title', levelTitlePlaceholder: 'Name this loop', startWord: 'Starting word', startPlaceholder: 'Example: remarkable',
      difficulty: 'Difficulty', easy: 'Easy', medium: 'Medium', hard: 'Hard', description: 'Design note (optional)',
      descriptionPlaceholder: 'Tell reviewers what makes this level interesting.', showCreator: 'Show my player name after publication',
      idle: 'Enter a starting word to verify it and check whether it can form a loop.', analyzing: 'Verifying the word and building the loop…',
      invalidWord: 'Use 3–45 English letters and select a valid difficulty.', missingWord: 'That English word could not be found. Check the spelling.',
      lookupUnavailable: 'The word could not be verified right now. Check your connection and try again.', noRoute: 'This word cannot close a loop at this difficulty.',
      valid: 'Verified. Complete one test run before sending it for review.', shortest: 'Min additions', routes: 'Shortest routes', branches: 'First moves', closers: 'Quality closers',
      wordsUnit: '{count} words', routeLabel: 'System shortest route', testLabel: 'Test, then submit', testPending: 'Verify the level, then complete one test run.',
      testReady: 'Verification passed. The level is ready to test.', testDone: 'Test complete: you closed the loop in {moves} moves.', test: 'Test this level', submit: 'Send for review',
      loginRequired: 'Log in to submit a level or view your submissions.', openLogin: 'Log in or register', submitted: 'Your level is now at the review desk.',
      submitError: 'The level was not submitted. Check the details and try again.', duplicate: 'You already submitted this starting word at this difficulty.', limited: 'Too many submissions. Try again later.',
      invalidSubmittedWord: 'The loop contains a word that could not be verified. Check the test route.',
      mineKicker: 'YOUR SUBMISSIONS', mineTitle: 'My submissions', communityKicker: 'CURATED BY PLAYERS', communityTitle: 'Community levels',
      reviewKicker: 'EDITORIAL DESK', reviewTitle: 'Levels awaiting review', refresh: 'Refresh', loading: 'Loading levels…', emptyMine: 'No submissions yet. Start with a loop you would gladly play twice.',
      emptyCommunity: 'The community collection is still being assembled. Approved levels will appear here.', emptyReview: 'The review desk is clear.', loadError: 'Levels are unavailable right now. Try again later.',
      pending: 'Pending', published: 'Published', rejected: 'Rejected', withdrawn: 'Withdrawn', by: 'By {name}', anonymous: 'Anonymous player',
      play: 'Play level', shortestMetric: 'Min {count} moves', routeMetric: '{count} shortest routes', maxMetric: 'Max {count} moves', submittedRoute: 'Test route: {route}',
      reviewNote: 'Review note', publish: 'Publish', reject: 'Reject', reviewed: 'Review saved.', rejectNeedsNote: 'Add a reason before rejecting this level.',
      testHud: 'Custom level test', backWorkshop: '← Back to workshop', returnWorkshop: 'Return to workshop', target: '{tail} → {head}',
      needsTest: 'The starting word or difficulty changed. Complete a new test run.', titleRequired: 'Add a level title first.'
    }
  };

  function language() { return typeof currentLanguage === 'string' && currentLanguage === 'en' ? 'en' : 'zh'; }
  function text(key, params) {
    var value = (TEXT[language()] || TEXT.zh)[key] || key;
    if (!params) return value;
    return value.replace(/\{(\w+)\}/g, function(match, name) { return params[name] === undefined ? match : params[name]; });
  }
  function canUseBackend() {
    return window.location.protocol === 'http:' || window.location.protocol === 'https:';
  }
  function api(path, options) {
    if (!canUseBackend()) return Promise.reject(new Error('Workshop service requires HTTP or HTTPS.'));
    var requestOptions = options || {};
    requestOptions.headers = Object.assign({ accept: 'application/json' }, requestOptions.headers || {});
    requestOptions.cache = 'no-store';
    requestOptions.credentials = 'same-origin';
    return fetch(path, requestOptions).then(function(response) {
      return response.json().catch(function() { return {}; }).then(function(body) {
        if (!response.ok) {
          var error = new Error(body.error || 'Request failed');
          error.status = response.status;
          error.code = body.code || '';
          throw error;
        }
        return body;
      });
    });
  }
  function element(tag, className, content) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (content !== undefined) node.textContent = content;
    return node;
  }
  function difficultyName(value) { return text(value); }

  function WorkshopController() {
    this.overlay = document.getElementById('workshopOverlay');
    this.activeTab = 'create';
    this.lastFocused = null;
    this.analysis = null;
    this.analysisKey = '';
    this.analysisRequest = 0;
    this.testContext = null;
    this.testRoute = null;
    this.mineLevels = [];
    this.communityLevels = [];
    this.reviewLevels = [];
    this.bindUI();
    this.refreshLanguage();
    this.syncAccount();
  }

  WorkshopController.prototype.bindUI = function() {
    var self = this;
    document.getElementById('workshopOpenBtn').addEventListener('click', function() { self.open('create'); });
    document.getElementById('workshopCloseBtn').addEventListener('click', function() { self.close(); });
    this.overlay.addEventListener('click', function(event) { if (event.target === self.overlay) self.close(); });
    document.querySelectorAll('[data-workshop-tab]').forEach(function(button) {
      button.addEventListener('click', function() { self.selectTab(button.getAttribute('data-workshop-tab')); });
    });
    document.getElementById('workshopStartWord').addEventListener('input', function() { self.queueAnalysis(); });
    document.querySelectorAll('input[name="workshopDifficulty"]').forEach(function(input) {
      input.addEventListener('change', function() { self.queueAnalysis(); });
    });
    document.getElementById('workshopForm').addEventListener('submit', function(event) { event.preventDefault(); self.submit(); });
    document.getElementById('workshopTestBtn').addEventListener('click', function() { self.startTest(); });
    document.getElementById('workshopTestBackBtn').addEventListener('click', function() { self.returnFromTest(); });
    document.getElementById('workshopReturnFromWinBtn').addEventListener('click', function() { self.returnFromTest(); });
    document.getElementById('workshopMineRefresh').addEventListener('click', function() { self.loadMine(); });
    document.getElementById('workshopCommunityRefresh').addEventListener('click', function() { self.loadCommunity(); });
    document.getElementById('workshopReviewRefresh').addEventListener('click', function() { self.loadReview(); });
    document.addEventListener('keydown', function(event) {
      if (event.key === 'Escape' && !self.overlay.hidden) self.close();
    });
    window.addEventListener('wordloop:auth-changed', function() { self.syncAccount(); });
    window.addEventListener('wordloop:completed', function(event) { self.handleCompletion(event.detail || {}); });
  };

  WorkshopController.prototype.user = function() {
    return window.userSystemController && window.userSystemController.user || { authenticated: false };
  };

  WorkshopController.prototype.syncAccount = function() {
    var user = this.user();
    document.getElementById('workshopReviewTab').hidden = !user.authenticated || !user.isAdmin;
    if (this.activeTab === 'review' && (!user.authenticated || !user.isAdmin)) this.selectTab('create');
  };

  WorkshopController.prototype.open = function(tab) {
    this.lastFocused = document.activeElement;
    this.overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    this.syncAccount();
    this.selectTab(tab || this.activeTab);
    var focus = (tab || this.activeTab) === 'create' ? document.getElementById('workshopLevelTitle') : document.querySelector('[data-workshop-tab="' + (tab || this.activeTab) + '"]');
    if (focus) focus.focus({ preventScroll: true });
  };

  WorkshopController.prototype.close = function() {
    this.overlay.hidden = true;
    document.body.style.overflow = '';
    if (this.lastFocused && this.lastFocused.focus) this.lastFocused.focus({ preventScroll: true });
  };

  WorkshopController.prototype.selectTab = function(tab) {
    if (tab === 'review' && !this.user().isAdmin) tab = 'create';
    this.activeTab = ['create', 'mine', 'community', 'review'].indexOf(tab) >= 0 ? tab : 'create';
    document.querySelectorAll('[data-workshop-tab]').forEach(function(button) {
      var active = button.getAttribute('data-workshop-tab') === tab;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    ['create', 'mine', 'community', 'review'].forEach(function(name) {
      var panel = document.getElementById('workshop' + name.charAt(0).toUpperCase() + name.slice(1) + 'Panel');
      panel.hidden = name !== tab;
      panel.classList.toggle('is-active', name === tab);
    });
    if (tab === 'mine') this.loadMine();
    if (tab === 'community') this.loadCommunity();
    if (tab === 'review') this.loadReview();
  };

  WorkshopController.prototype.currentDifficulty = function() {
    var checked = document.querySelector('input[name="workshopDifficulty"]:checked');
    return checked ? checked.value : 'medium';
  };

  WorkshopController.prototype.queueAnalysis = function() {
    var self = this;
    window.clearTimeout(this.analysisTimer);
    this.analysisTimer = window.setTimeout(function() { self.analyze(); }, 220);
  };

  WorkshopController.prototype.resetTest = function(message) {
    this.testRoute = null;
    document.getElementById('workshopSubmitBtn').disabled = true;
    document.getElementById('workshopTestStatus').textContent = message || text('testPending');
  };

  WorkshopController.prototype.resetDraft = function() {
    window.clearTimeout(this.analysisTimer);
    this.analysisRequest += 1;
    document.getElementById('workshopForm').reset();
    this.analysis = null;
    this.analysisKey = '';
    this.resetTest();
    document.getElementById('workshopLoopRail').dataset.state = 'idle';
    document.getElementById('workshopRailWord').textContent = 'start word';
    document.getElementById('workshopTailPair').textContent = '--';
    document.getElementById('workshopHeadPair').textContent = '--';
    document.getElementById('workshopAnalysisStatus').textContent = text('idle');
    document.getElementById('workshopAnalysisStatus').className = 'workshop-analysis-status';
    document.getElementById('workshopMetrics').hidden = true;
    ['Shortest', 'Routes', 'Branches', 'Closers'].forEach(function(metric) {
      document.getElementById('workshopMetric' + metric).textContent = '--';
    });
    document.getElementById('workshopRouteWords').textContent = '';
    document.getElementById('workshopRoute').hidden = true;
    document.getElementById('workshopTestBtn').disabled = true;
  };

  WorkshopController.prototype.analysisFailure = function(key) {
    this.analysis = null;
    this.analysisKey = '';
    this.resetTest();
    var rail = document.getElementById('workshopLoopRail');
    rail.dataset.state = key === 'idle' ? 'idle' : 'invalid';
    var status = document.getElementById('workshopAnalysisStatus');
    status.textContent = text(key);
    status.className = 'workshop-analysis-status' + (key === 'idle' ? '' : ' is-invalid');
    document.getElementById('workshopMetrics').hidden = true;
    document.getElementById('workshopRoute').hidden = true;
    document.getElementById('workshopTestBtn').disabled = true;
  };

  WorkshopController.prototype.analyze = function() {
    var self = this;
    var requestId = ++this.analysisRequest;
    var word = document.getElementById('workshopStartWord').value.trim().toLowerCase();
    var difficulty = this.currentDifficulty();
    document.getElementById('workshopRailWord').textContent = word || 'start word';
    document.getElementById('workshopTailPair').textContent = word.length >= 2 ? word.slice(-2) : '--';
    document.getElementById('workshopHeadPair').textContent = word.length >= 2 ? word.slice(0, 2) : '--';
    if (!word) { this.analysisFailure('idle'); return Promise.resolve(); }
    if (!/^[a-z]{3,45}$/.test(word) || !CONFIG[difficulty]) { this.analysisFailure('invalidWord'); return Promise.resolve(); }

    document.getElementById('workshopLoopRail').dataset.state = 'idle';
    document.getElementById('workshopAnalysisStatus').className = 'workshop-analysis-status';
    document.getElementById('workshopAnalysisStatus').textContent = text('analyzing');
    document.getElementById('workshopTestBtn').disabled = true;
    return game.ensureDifficultyAvailable(difficulty).then(function() {
      if (requestId !== self.analysisRequest) return;
      if (game.difficulty !== difficulty) {
        game.difficulty = difficulty;
        game.buildGraph();
      }
      if (game.allWordSet.has(word)) return true;
      var definitions = window.wordDefinitionController && window.wordDefinitionController.service;
      if (!definitions || typeof definitions.lookup !== 'function') throw new Error('lookup-unavailable');
      return definitions.lookup(word).then(function() { return true; }).catch(function(error) {
        if (error && error.message === 'definition-not-found') return false;
        throw new Error('lookup-unavailable');
      });
    }).then(function(validWord) {
      if (requestId !== self.analysisRequest || validWord === undefined) return;
      if (!validWord) return self.analysisFailure('missingWord');
      var config = CONFIG[difficulty];
      var head = word.slice(0, 2);
      var tail = word.slice(-2);
      if (head === tail) return self.analysisFailure('noRoute');
      var shortestMoves = game.distances[tail] && game.distances[tail][head];
      if (shortestMoves === undefined) return self.analysisFailure('noRoute');
      var branchWordCount = 0;
      (game.graph.get(tail) || new Map()).forEach(function(words) {
        branchWordCount += words.length;
      });
      var routeCount = game._countShortestRoutes(tail, head, shortestMoves, 201, {}, game.graph, game.distances);
      var startLemma = game.wordLemmaRoots.get(word) || word;
      var qualityCloserCount = game._countReachableQualityClosers(tail, head, shortestMoves, startLemma, game.distances);
      var route = game.findShortestPath(tail, head, new Set([word]), new Set([startLemma]));
      if (!route) return self.analysisFailure('noRoute');
      self.analysis = {
        startWord: word, difficulty: difficulty, target: head, tail: tail,
        shortestMoves: shortestMoves, challengeMoves: shortestMoves, routeCount: routeCount,
        branchWordCount: branchWordCount, qualityCloserCount: qualityCloserCount,
        maxMoves: shortestMoves + config.maxSlack, hintLimit: config.hintLimit,
        computedRoute: [word].concat(route)
      };
      var nextKey = difficulty + ':' + word;
      if (self.analysisKey !== nextKey) self.resetTest(self.analysisKey ? text('needsTest') : text('testReady'));
      self.analysisKey = nextKey;
      self.renderAnalysis();
    }).catch(function(error) {
      if (requestId === self.analysisRequest) self.analysisFailure(error && error.message === 'lookup-unavailable' ? 'lookupUnavailable' : 'missingWord');
    });
  };

  WorkshopController.prototype.renderAnalysis = function() {
    var analysis = this.analysis;
    if (!analysis) return;
    document.getElementById('workshopLoopRail').dataset.state = 'valid';
    var status = document.getElementById('workshopAnalysisStatus');
    status.textContent = text('valid');
    status.className = 'workshop-analysis-status is-valid';
    document.getElementById('workshopMetrics').hidden = false;
    document.getElementById('workshopMetricShortest').textContent = String(analysis.shortestMoves);
    document.getElementById('workshopMetricRoutes').textContent = String(analysis.routeCount);
    document.getElementById('workshopMetricBranches').textContent = String(analysis.branchWordCount);
    document.getElementById('workshopMetricClosers').textContent = String(analysis.qualityCloserCount);
    var routeContainer = document.getElementById('workshopRouteWords');
    routeContainer.textContent = '';
    analysis.computedRoute.forEach(function(word, index) {
      if (index) routeContainer.appendChild(element('span', 'workshop-route-arrow', '→'));
      routeContainer.appendChild(element('span', 'workshop-route-word', word));
    });
    document.getElementById('workshopRoute').hidden = false;
    document.getElementById('workshopTestBtn').disabled = false;
    document.getElementById('workshopSubmitBtn').disabled = !this.testRoute;
  };

  WorkshopController.prototype.startTest = function() {
    if (!this.analysis) return;
    this.launchLevel(this.analysis, 'create', true);
  };

  WorkshopController.prototype.launchLevel = function(level, sourceTab, isTest) {
    var self = this;
    this.testContext = { level: level, sourceTab: sourceTab, isTest: Boolean(isTest), completed: false };
    this.overlay.hidden = true;
    document.body.style.overflow = '';
    if (window.startScreenController) {
      window.startScreenController.screen.hidden = true;
      document.body.classList.remove('start-screen-open');
    }
    if (window.campaignController) window.campaignController.setMode('casual');
    document.getElementById('winOverlay').classList.remove('show');
    document.getElementById('workshopReturnFromWinBtn').hidden = true;
    game.ensureDifficultyAvailable(level.difficulty).then(function() {
      game.difficulty = level.difficulty;
      game.buildGraph();
      game.hintLimitOverride = Number(level.hintLimit);
      game.hintWordsOverride = 6;
      game.completionModeOverride = 'custom';
      game.customLevelId = level.id || null;
      game.customStartOverride = {
        word: level.startWord,
        head: level.startWord.slice(0, 2),
        tail: level.startWord.slice(-2),
        pathLength: Number(level.shortestMoves)
      };
      game.newGame();
      document.getElementById('workshopTestHud').hidden = false;
      document.getElementById('workshopTestHudTitle').textContent = isTest ? text('testHud') : level.title;
      document.getElementById('workshopTestHudWord').textContent = level.startWord + ' · ' + difficultyName(level.difficulty) + ' · ' + text('maxMetric', { count: level.maxMoves });
      document.getElementById('workshopTestHudTarget').textContent = text('target', { tail: level.startWord.slice(-2), head: level.startWord.slice(0, 2) });
      document.getElementById('wordInput').focus({ preventScroll: true });
    }).catch(function() {
      self.testContext = null;
      self.open(sourceTab);
      self.showMessage(text('loadError'), true);
    });
  };

  WorkshopController.prototype.handleCompletion = function(detail) {
    if (!this.testContext || detail.mode !== 'custom' || detail.startWord !== this.testContext.level.startWord) return;
    this.testContext.completed = true;
    if (this.testContext.isTest) {
      this.testRoute = game.chain.slice();
      document.getElementById('workshopTestStatus').textContent = text('testDone', { moves: Math.max(0, game.chain.length - 1) });
      document.getElementById('workshopSubmitBtn').disabled = false;
    }
    document.getElementById('workshopReturnFromWinBtn').hidden = false;
  };

  WorkshopController.prototype.returnFromTest = function() {
    if (!this.testContext) return;
    var tab = this.testContext.sourceTab || 'create';
    document.getElementById('winOverlay').classList.remove('show');
    document.getElementById('workshopReturnFromWinBtn').hidden = true;
    document.getElementById('workshopTestHud').hidden = true;
    game.hintLimitOverride = null;
    game.hintWordsOverride = null;
    game.completionModeOverride = null;
    game.customLevelId = null;
    game.customStartOverride = null;
    this.testContext = null;
    this.open(tab);
  };

  WorkshopController.prototype.submit = function() {
    var self = this;
    var titleInput = document.getElementById('workshopLevelTitle');
    if (!titleInput.value.trim()) { titleInput.reportValidity(); this.showMessage(text('titleRequired'), true); return; }
    if (!this.analysis || !this.testRoute) { this.showMessage(text('testPending'), true); return; }
    if (!this.user().authenticated) {
      this.showMessage(text('loginRequired'), true);
      if (window.userSystemController) window.userSystemController.open();
      return;
    }
    var button = document.getElementById('workshopSubmitBtn');
    button.disabled = true;
    api('/api/custom-levels', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
        title: titleInput.value.trim(), startWord: this.analysis.startWord, difficulty: this.analysis.difficulty,
        description: document.getElementById('workshopDescription').value.trim(),
        showCreator: document.getElementById('workshopShowCreator').checked,
        submittedRoute: this.testRoute
      })
    }).then(function() {
      self.resetDraft();
      self.showMessage(text('submitted'));
      self.selectTab('mine');
    }).catch(function(error) {
      var key = error.code === 'DUPLICATE_LEVEL' ? 'duplicate' :
        error.code === 'SUBMISSION_LIMIT' ? 'limited' :
        error.code === 'INVALID_WORD' ? 'invalidSubmittedWord' :
        error.code === 'WORD_CHECK_UNAVAILABLE' ? 'lookupUnavailable' : 'submitError';
      self.showMessage(text(key), true);
      button.disabled = false;
    });
  };

  WorkshopController.prototype.showMessage = function(message, error) {
    var node = document.getElementById('workshopMessage');
    node.textContent = message || '';
    node.classList.toggle('is-error', Boolean(error));
  };

  WorkshopController.prototype.renderLoginGate = function(container) {
    container.textContent = '';
    var box = element('div', 'workshop-empty');
    box.appendChild(element('p', '', text('loginRequired')));
    var button = element('button', '', text('openLogin'));
    button.type = 'button';
    button.addEventListener('click', function() { if (window.userSystemController) window.userSystemController.open(); });
    box.appendChild(button);
    container.appendChild(box);
  };

  WorkshopController.prototype.loadMine = function() {
    var self = this;
    var container = document.getElementById('workshopMineList');
    if (!this.user().authenticated) { this.renderLoginGate(container); return Promise.resolve(); }
    container.innerHTML = '<div class="workshop-empty">' + text('loading') + '</div>';
    return api('/api/custom-levels').then(function(result) {
      self.mineLevels = result.levels || [];
      self.renderLevels(container, self.mineLevels, 'mine');
    }).catch(function() { container.innerHTML = '<div class="workshop-empty">' + text('loadError') + '</div>'; });
  };

  WorkshopController.prototype.loadCommunity = function() {
    var self = this;
    var container = document.getElementById('workshopCommunityList');
    container.innerHTML = '<div class="workshop-empty">' + text('loading') + '</div>';
    return api('/api/community-levels').then(function(result) {
      self.communityLevels = result.levels || [];
      self.renderLevels(container, self.communityLevels, 'community');
    }).catch(function() { container.innerHTML = '<div class="workshop-empty">' + text('loadError') + '</div>'; });
  };

  WorkshopController.prototype.loadReview = function() {
    var self = this;
    var container = document.getElementById('workshopReviewList');
    if (!this.user().isAdmin) { this.renderLoginGate(container); return Promise.resolve(); }
    container.innerHTML = '<div class="workshop-empty">' + text('loading') + '</div>';
    return api('/api/admin/custom-levels?status=pending').then(function(result) {
      self.reviewLevels = result.levels || [];
      self.renderLevels(container, self.reviewLevels, 'review');
    }).catch(function() { container.innerHTML = '<div class="workshop-empty">' + text('loadError') + '</div>'; });
  };

  WorkshopController.prototype.renderLevels = function(container, levels, kind) {
    var self = this;
    container.textContent = '';
    if (!levels.length) {
      container.appendChild(element('div', 'workshop-empty', text(kind === 'mine' ? 'emptyMine' : kind === 'review' ? 'emptyReview' : 'emptyCommunity')));
      return;
    }
    levels.forEach(function(level) { container.appendChild(self.levelCard(level, kind)); });
  };

  WorkshopController.prototype.levelCard = function(level, kind) {
    var self = this;
    var card = element('article', 'workshop-card');
    var main = element('div', 'workshop-card-main');
    var top = element('div', 'workshop-card-topline');
    var status = level.status || 'published';
    var badge = element('span', 'workshop-status workshop-status-' + status, text(status));
    top.appendChild(badge);
    top.appendChild(element('span', '', difficultyName(level.difficulty)));
    top.appendChild(element('span', '', level.creator ? text('by', { name: level.creator }) : text('anonymous')));
    main.appendChild(top);
    main.appendChild(element('h4', '', level.title));
    main.appendChild(element('div', 'workshop-card-word', level.startWord + ' · ' + level.startWord.slice(-2) + ' → ' + level.startWord.slice(0, 2)));
    if (level.description) main.appendChild(element('p', 'workshop-card-copy', level.description));
    var metrics = element('div', 'workshop-card-metrics');
    metrics.appendChild(element('span', '', text('shortestMetric', { count: level.shortestMoves })));
    metrics.appendChild(element('span', '', text('routeMetric', { count: level.routeCount })));
    metrics.appendChild(element('span', '', text('maxMetric', { count: level.maxMoves })));
    main.appendChild(metrics);
    if (level.submittedRoute && level.submittedRoute.length) main.appendChild(element('div', 'workshop-card-route', text('submittedRoute', { route: level.submittedRoute.join(' → ') })));
    if (level.reviewNote) main.appendChild(element('p', 'workshop-card-copy', text('reviewNote') + '：' + level.reviewNote));
    if (kind === 'review') {
      var note = element('textarea', '');
      note.maxLength = 400;
      note.placeholder = text('reviewNote');
      main.appendChild(note);
    }
    card.appendChild(main);
    var actions = element('div', 'workshop-card-actions');
    var play = element('button', '', text('play'));
    play.type = 'button';
    play.addEventListener('click', function() { self.launchLevel(level, kind === 'review' ? 'review' : kind, false); });
    actions.appendChild(play);
    if (kind === 'review') {
      ['publish', 'reject'].forEach(function(action) {
        var button = element('button', '', text(action));
        button.type = 'button';
        button.dataset.action = action;
        button.addEventListener('click', function() { self.review(level, action, card.querySelector('textarea').value.trim(), button); });
        actions.appendChild(button);
      });
    }
    card.appendChild(actions);
    return card;
  };

  WorkshopController.prototype.review = function(level, action, note, button) {
    var self = this;
    if (action === 'reject' && !note) { window.alert(text('rejectNeedsNote')); return; }
    button.disabled = true;
    api('/api/admin/custom-levels', {
      method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id: level.id, action: action, reviewNote: note })
    }).then(function() { self.showMessage(text('reviewed')); self.loadReview(); })
      .catch(function() { window.alert(text('submitError')); button.disabled = false; });
  };

  WorkshopController.prototype.refreshLanguage = function() {
    var values = {
      workshopOpenBtn: 'open', workshopKicker: 'kicker', workshopTitle: 'title', workshopIntro: 'intro',
      workshopCreateTab: 'create', workshopMineTab: 'mine', workshopCommunityTab: 'community', workshopReviewTab: 'review',
      workshopDesignLabel: 'design', workshopVerifyLabel: 'verify', workshopTitleLabel: 'levelTitle', workshopStartLabel: 'startWord',
      workshopDifficultyLabel: 'difficulty', workshopEasyLabel: 'easy', workshopMediumLabel: 'medium', workshopHardLabel: 'hard',
      workshopDescriptionLabel: 'description', workshopCreatorLabel: 'showCreator', workshopMetricShortestLabel: 'shortest',
      workshopMetricRoutesLabel: 'routes', workshopMetricBranchesLabel: 'branches', workshopMetricClosersLabel: 'closers',
      workshopRouteLabel: 'routeLabel', workshopTestLabel: 'testLabel', workshopTestBtn: 'test', workshopSubmitBtn: 'submit',
      workshopMineKicker: 'mineKicker', workshopMineTitle: 'mineTitle', workshopCommunityKicker: 'communityKicker', workshopCommunityTitle: 'communityTitle',
      workshopReviewKicker: 'reviewKicker', workshopReviewTitle: 'reviewTitle', workshopMineRefresh: 'refresh', workshopCommunityRefresh: 'refresh', workshopReviewRefresh: 'refresh',
      workshopTestBackBtn: 'backWorkshop', workshopReturnFromWinBtn: 'returnWorkshop'
    };
    Object.keys(values).forEach(function(id) { document.getElementById(id).textContent = text(values[id]); });
    document.getElementById('workshopCloseBtn').setAttribute('aria-label', text('close'));
    document.getElementById('workshopLevelTitle').placeholder = text('levelTitlePlaceholder');
    document.getElementById('workshopStartWord').placeholder = text('startPlaceholder');
    document.getElementById('workshopDescription').placeholder = text('descriptionPlaceholder');
    if (this.analysis) this.renderAnalysis(); else this.analysisFailure('idle');
    if (this.testRoute) document.getElementById('workshopTestStatus').textContent = text('testDone', { moves: this.testRoute.length - 1 });
    if (this.mineLevels.length) this.renderLevels(document.getElementById('workshopMineList'), this.mineLevels, 'mine');
    if (this.communityLevels.length) this.renderLevels(document.getElementById('workshopCommunityList'), this.communityLevels, 'community');
    if (this.reviewLevels.length) this.renderLevels(document.getElementById('workshopReviewList'), this.reviewLevels, 'review');
  };

  window.WorkshopController = WorkshopController;
  window.workshopController = new WorkshopController();
})();
