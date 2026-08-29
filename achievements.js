(function() {
  'use strict';

  var STORAGE_KEY = 'word-chain-loop:achievements:v1';

  var TEXT = {
    zh: {
      summaryTitle: '成就档案', uniqueStarts: '成功词首', optimalWins: '最短通关', open: '查看全部成就', openShort: '成就档案',
      kicker: '玩家档案 · 长期记录', title: '成就档案', close: '关闭成就',
      intro: '每次闭环都会留下一条长期记录；练习局也计入闭环，最短路线和无辅助完成分别统计。',
      totalLoops: '闭环总数', unassistedWins: '无辅助完成', campaignLevels: '闯关完成',
      unlocked: '已解锁', locked: '进行中', progress: '进度', toast: '新成就',
      firstLoopTitle: '环成一笔', firstLoopDesc: '成功闭合第一个词环。',
      tenLoopsTitle: '十环成章', tenLoopsDesc: '累计成功闭合 10 个词环。',
      fiveStartsTitle: '五词开卷', fiveStartsDesc: '用 5 个不同的初始词成功闭环。',
      twentyStartsTitle: '二十词成册', twentyStartsDesc: '用 20 个不同的初始词成功闭环。',
      firstOptimalTitle: '一步不差', firstOptimalDesc: '第一次按理论最短路线闭环。',
      fiveOptimalTitle: '路线校对员', fiveOptimalDesc: '累计 5 次按最短路线闭环。',
      threeCleanTitle: '独立成环', threeCleanDesc: '累计 3 次不使用提示、答案或撤销完成。',
      campaignAllTitle: '十二关全刊', campaignAllDesc: '完成全部 12 个闯关关卡。'
    },
    en: {
      summaryTitle: 'Achievement archive', uniqueStarts: 'Opening words', optimalWins: 'Shortest wins', open: 'View all achievements', openShort: 'Achievements',
      kicker: 'PLAYER ARCHIVE · LIFETIME', title: 'Achievements', close: 'Close achievements',
      intro: 'Every closed loop leaves a lifetime record. Practice rounds count as loops; shortest routes and unassisted wins are tracked separately.',
      totalLoops: 'Loops closed', unassistedWins: 'Unassisted wins', campaignLevels: 'Levels cleared',
      unlocked: 'Unlocked', locked: 'In progress', progress: 'Progress', toast: 'Achievement unlocked',
      firstLoopTitle: 'First Impression', firstLoopDesc: 'Close your first word loop.',
      tenLoopsTitle: 'Ten in Print', tenLoopsDesc: 'Close 10 word loops in total.',
      fiveStartsTitle: 'Opening Collection', fiveStartsDesc: 'Close loops from 5 different opening words.',
      twentyStartsTitle: 'Opening Archive', twentyStartsDesc: 'Close loops from 20 different opening words.',
      firstOptimalTitle: 'Exact Route', firstOptimalDesc: 'Close a loop on a theoretical shortest route.',
      fiveOptimalTitle: 'Route Editor', fiveOptimalDesc: 'Close 5 loops on shortest routes.',
      threeCleanTitle: 'Independent Loop', threeCleanDesc: 'Complete 3 loops without hints, solutions, or undo.',
      campaignAllTitle: 'Complete Edition', campaignAllDesc: 'Clear all 12 campaign levels.'
    }
  };

  var DEFINITIONS = [
    { id: 'first-loop', metric: 'totalLoops', goal: 1, title: 'firstLoopTitle', description: 'firstLoopDesc' },
    { id: 'ten-loops', metric: 'totalLoops', goal: 10, title: 'tenLoopsTitle', description: 'tenLoopsDesc' },
    { id: 'five-starts', metric: 'uniqueStartWords', goal: 5, title: 'fiveStartsTitle', description: 'fiveStartsDesc' },
    { id: 'twenty-starts', metric: 'uniqueStartWords', goal: 20, title: 'twentyStartsTitle', description: 'twentyStartsDesc' },
    { id: 'first-optimal', metric: 'optimalWins', goal: 1, title: 'firstOptimalTitle', description: 'firstOptimalDesc' },
    { id: 'five-optimal', metric: 'optimalWins', goal: 5, title: 'fiveOptimalTitle', description: 'fiveOptimalDesc' },
    { id: 'three-clean', metric: 'unassistedWins', goal: 3, title: 'threeCleanTitle', description: 'threeCleanDesc' },
    { id: 'campaign-all', metric: 'campaignLevelIds', goal: 12, title: 'campaignAllTitle', description: 'campaignAllDesc' }
  ];

  function language() {
    return typeof currentLanguage === 'string' && currentLanguage === 'en' ? 'en' : 'zh';
  }

  function text(key) {
    var table = TEXT[language()] || TEXT.zh;
    return table[key] || key;
  }

  function uniqueStrings(values) {
    var seen = Object.create(null);
    var result = [];
    if (!Array.isArray(values)) return result;
    for (var i = 0; i < values.length; i++) {
      var value = String(values[i] || '').toLowerCase();
      if (!value || seen[value]) continue;
      seen[value] = true;
      result.push(value);
    }
    return result;
  }

  function uniqueNumbers(values) {
    var seen = Object.create(null);
    var result = [];
    if (!Array.isArray(values)) return result;
    for (var i = 0; i < values.length; i++) {
      var value = parseInt(values[i], 10);
      if (!isFinite(value) || value < 1 || seen[value]) continue;
      seen[value] = true;
      result.push(value);
    }
    return result.sort(function(a, b) { return a - b; });
  }

  function AchievementController() {
    this.data = this.load();
    this.seenRoundIds = Object.create(null);
    this.toastQueue = [];
    this.toastTimer = null;
    this.lastFocusedElement = null;
    this.currentToastDefinition = null;
    this.backfillExistingProgress();
    this.syncUnlocked(false);
    this.save();
    this.bindUI();
    this.render();
  }

  AchievementController.prototype.emptyData = function() {
    return {
      version: 1,
      totalLoops: 0,
      uniqueStartWords: [],
      optimalWins: 0,
      unassistedWins: 0,
      campaignLevelIds: [],
      unlocked: [],
      updatedAt: null
    };
  };

  AchievementController.prototype.load = function() {
    var data = this.emptyData();
    try {
      var parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (!parsed || parsed.version !== 1) return data;
      data.totalLoops = Math.max(0, parseInt(parsed.totalLoops, 10) || 0);
      data.uniqueStartWords = uniqueStrings(parsed.uniqueStartWords);
      data.optimalWins = Math.max(0, parseInt(parsed.optimalWins, 10) || 0);
      data.unassistedWins = Math.max(0, parseInt(parsed.unassistedWins, 10) || 0);
      data.campaignLevelIds = uniqueNumbers(parsed.campaignLevelIds);
      data.unlocked = uniqueStrings(parsed.unlocked);
      data.updatedAt = parsed.updatedAt || null;
    } catch (err) { /* start with an empty archive */ }
    return data;
  };

  AchievementController.prototype.save = function() {
    this.data.updatedAt = new Date().toISOString();
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data)); } catch (err) { /* storage may be unavailable */ }
    window.dispatchEvent(new CustomEvent('wordloop:progress-changed'));
  };

  AchievementController.prototype.backfillExistingProgress = function() {
    var starts = this.data.uniqueStartWords.slice();
    var knownUnassistedStarts = Object.create(null);
    var changed = false;
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i) || '';
        if (key.indexOf('word-chain-loop:record:v3:') !== 0) continue;
        var parts = key.split(':');
        var word = parts[parts.length - 1].toLowerCase();
        if (!/^[a-z]{3,}$/.test(word)) continue;
        starts.push(word);
        knownUnassistedStarts[word] = true;
      }

      var campaign = JSON.parse(localStorage.getItem('word-chain-loop:campaign-progress:v3') || 'null');
      if (campaign && campaign.levels) {
        for (var levelId in campaign.levels) {
          if (!Object.prototype.hasOwnProperty.call(campaign.levels, levelId) || !campaign.levels[levelId].completed) continue;
          var numericId = parseInt(levelId, 10);
          this.data.campaignLevelIds.push(numericId);
          if (typeof CAMPAIGN_LEVELS !== 'undefined' && CAMPAIGN_LEVELS[numericId - 1]) {
            starts.push(CAMPAIGN_LEVELS[numericId - 1].startWord);
          }
        }
      }
    } catch (err) { /* historical data is optional */ }

    var nextStarts = uniqueStrings(starts);
    var nextCampaign = uniqueNumbers(this.data.campaignLevelIds);
    var minimumUnassisted = Object.keys(knownUnassistedStarts).length;
    if (nextStarts.length !== this.data.uniqueStartWords.length) changed = true;
    if (nextCampaign.length !== this.data.campaignLevelIds.length) changed = true;
    if (minimumUnassisted > this.data.unassistedWins) changed = true;
    this.data.uniqueStartWords = nextStarts;
    this.data.campaignLevelIds = nextCampaign;
    this.data.unassistedWins = Math.max(this.data.unassistedWins, minimumUnassisted);
    this.data.totalLoops = Math.max(this.data.totalLoops, nextStarts.length, nextCampaign.length);
    if (changed) this.save();
  };

  AchievementController.prototype.metricValue = function(metric) {
    var value = this.data[metric];
    return Array.isArray(value) ? value.length : (Number(value) || 0);
  };

  AchievementController.prototype.syncUnlocked = function(announce) {
    var oldUnlocked = Object.create(null);
    for (var i = 0; i < this.data.unlocked.length; i++) oldUnlocked[this.data.unlocked[i]] = true;
    var next = [];
    var newlyUnlocked = [];
    for (var j = 0; j < DEFINITIONS.length; j++) {
      var definition = DEFINITIONS[j];
      if (this.metricValue(definition.metric) < definition.goal) continue;
      next.push(definition.id);
      if (!oldUnlocked[definition.id]) newlyUnlocked.push(definition);
    }
    this.data.unlocked = next;
    if (announce && newlyUnlocked.length) this.queueToasts(newlyUnlocked);
    return newlyUnlocked;
  };

  AchievementController.prototype.bindUI = function() {
    var self = this;
    var openButton = document.getElementById('achievementOpenBtn');
    var campaignOpenButton = document.getElementById('achievementCampaignOpenBtn');
    var closeButton = document.getElementById('achievementCloseBtn');
    var overlay = document.getElementById('achievementOverlay');
    openButton.addEventListener('click', function() { self.open(); });
    campaignOpenButton.addEventListener('click', function() { self.open(); });
    closeButton.addEventListener('click', function() { self.close(); });
    overlay.addEventListener('click', function(event) {
      if (event.target === overlay) self.close();
    });
    document.addEventListener('keydown', function(event) {
      if (event.key === 'Escape' && overlay.classList.contains('show')) self.close();
    });
    window.addEventListener('wordloop:completed', function(event) {
      self.recordCompletion(event.detail || {});
    });
  };

  AchievementController.prototype.recordCompletion = function(detail) {
    var roundKey = String(detail.mode || 'casual') + ':' + String(detail.roundId || 'unknown');
    if (this.seenRoundIds[roundKey]) return;
    this.seenRoundIds[roundKey] = true;

    this.data.totalLoops++;
    if (/^[a-z]{3,}$/i.test(detail.startWord || '')) {
      this.data.uniqueStartWords.push(String(detail.startWord).toLowerCase());
      this.data.uniqueStartWords = uniqueStrings(this.data.uniqueStartWords);
    }
    if (Number(detail.minimumMoves) > 0 && Number(detail.moves) === Number(detail.minimumMoves)) {
      this.data.optimalWins++;
    }
    if (!detail.assisted) this.data.unassistedWins++;
    if (detail.mode === 'campaign' && Number(detail.campaignLevelId) > 0) {
      this.data.campaignLevelIds.push(Number(detail.campaignLevelId));
      this.data.campaignLevelIds = uniqueNumbers(this.data.campaignLevelIds);
    }

    this.syncUnlocked(true);
    this.save();
    this.render();
  };

  AchievementController.prototype.unlockedCount = function() {
    return this.data.unlocked.length;
  };

  AchievementController.prototype.render = function() {
    document.getElementById('achievementSummaryTitle').textContent = text('summaryTitle');
    document.getElementById('achievementCount').textContent = this.unlockedCount() + ' / ' + DEFINITIONS.length;
    document.getElementById('achievementUniqueStarts').textContent = this.data.uniqueStartWords.length;
    document.getElementById('achievementUniqueStartsLabel').textContent = text('uniqueStarts');
    document.getElementById('achievementOptimalWins').textContent = this.data.optimalWins;
    document.getElementById('achievementOptimalWinsLabel').textContent = text('optimalWins');
    document.getElementById('achievementOpenBtn').textContent = text('open');
    document.getElementById('achievementCampaignOpenBtn').textContent = text('openShort');

    document.getElementById('achievementOverlayKicker').textContent = text('kicker');
    document.getElementById('achievementOverlayTitle').textContent = text('title');
    document.getElementById('achievementCloseBtn').setAttribute('aria-label', text('close'));
    document.getElementById('achievementIntro').textContent = text('intro');

    this.renderLedger();
    this.renderGrid();
  };

  AchievementController.prototype.renderLedger = function() {
    var values = [
      [this.data.totalLoops, text('totalLoops')],
      [this.data.uniqueStartWords.length, text('uniqueStarts')],
      [this.data.optimalWins, text('optimalWins')],
      [this.data.unassistedWins, text('unassistedWins')],
      [this.data.campaignLevelIds.length + ' / 12', text('campaignLevels')]
    ];
    var html = '';
    for (var i = 0; i < values.length; i++) {
      html += '<div class="achievement-ledger-item"><strong>' + values[i][0] + '</strong><span>' + values[i][1] + '</span></div>';
    }
    document.getElementById('achievementLedger').innerHTML = html;
  };

  AchievementController.prototype.renderGrid = function() {
    var unlocked = Object.create(null);
    for (var i = 0; i < this.data.unlocked.length; i++) unlocked[this.data.unlocked[i]] = true;
    var html = '';
    for (var j = 0; j < DEFINITIONS.length; j++) {
      var definition = DEFINITIONS[j];
      var current = this.metricValue(definition.metric);
      var complete = !!unlocked[definition.id];
      var percentage = Math.min(100, Math.round(current / definition.goal * 100));
      html += '<article class="achievement-item' + (complete ? ' is-unlocked' : '') + '">' +
        '<span class="achievement-index">' + String(j + 1).padStart(2, '0') + '</span>' +
        '<div class="achievement-copy"><h3>' + text(definition.title) + '</h3><p>' + text(definition.description) + '</p></div>' +
        '<span class="achievement-state">' + text(complete ? 'unlocked' : 'locked') + '</span>' +
        '<div class="achievement-progress"><div class="achievement-progress-copy"><span>' + text('progress') + '</span><span>' + Math.min(current, definition.goal) + ' / ' + definition.goal + '</span></div>' +
        '<div class="achievement-progress-track"><span class="achievement-progress-fill" style="width:' + percentage + '%"></span></div></div>' +
        '</article>';
    }
    document.getElementById('achievementGrid').innerHTML = html;
  };

  AchievementController.prototype.open = function() {
    this.lastFocusedElement = document.activeElement;
    this.render();
    document.getElementById('achievementOverlay').classList.add('show');
    document.getElementById('achievementCloseBtn').focus();
  };

  AchievementController.prototype.close = function() {
    document.getElementById('achievementOverlay').classList.remove('show');
    if (this.lastFocusedElement && this.lastFocusedElement.focus) this.lastFocusedElement.focus();
  };

  AchievementController.prototype.queueToasts = function(definitions) {
    for (var i = 0; i < definitions.length; i++) this.toastQueue.push(definitions[i]);
    if (!this.toastTimer) this.showNextToast();
  };

  AchievementController.prototype.showNextToast = function() {
    var self = this;
    var toast = document.getElementById('achievementToast');
    var definition = this.toastQueue.shift();
    if (!definition) {
      toast.hidden = true;
      this.currentToastDefinition = null;
      this.toastTimer = null;
      return;
    }
    this.currentToastDefinition = definition;
    document.getElementById('achievementToastKicker').textContent = text('toast');
    document.getElementById('achievementToastTitle').textContent = text(definition.title);
    toast.hidden = false;
    this.toastTimer = setTimeout(function() {
      toast.hidden = true;
      self.toastTimer = setTimeout(function() {
        self.toastTimer = null;
        self.showNextToast();
      }, 180);
    }, 2600);
  };

  AchievementController.prototype.refreshLanguage = function() {
    this.render();
    if (!document.getElementById('achievementToast').hidden && this.currentToastDefinition) {
      document.getElementById('achievementToastKicker').textContent = text('toast');
      document.getElementById('achievementToastTitle').textContent = text(this.currentToastDefinition.title);
    }
  };

  window.AchievementController = AchievementController;
  window.achievementController = new AchievementController();
})();
