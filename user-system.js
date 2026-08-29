(function() {
  'use strict';

  var SIGN_IN_PATH = '/signin-with-chatgpt?return_to=%2Fword-chain-game.html';
  var SYNC_META_KEY = 'word-chain-loop:account-sync:v1';
  var TEXT = {
    zh: {
      login: '登录', loginNote: '保存游戏进度', profile: '玩家档案', profileNote: '已连接', menuLabel: '登录或查看玩家档案',
      kicker: '玩家档案 · 云端保存', title: '玩家档案', close: '关闭玩家档案', signedIn: '已登录',
      loops: '完成词环', levels: '闯关完成', stars: '累计星数', nickname: '玩家昵称', nicknameHint: '2–24 个字符，只用于词环内展示。', save: '保存',
      cloudTitle: '云端进度', checking: '正在检查同步状态…', noCloud: '尚无云端记录', lastSync: '上次同步：{time}',
      backup: '立即同步', restore: '恢复到此设备', privacy: '身份由 ChatGPT 安全验证；词环不会保存你的密码。', signOut: '退出登录',
      saved: '昵称已保存。', synced: '此设备的进度已同步到云端。', restored: '云端进度已恢复，正在重新载入游戏…',
      restoreConfirm: '将云端记录写入此设备并重新载入游戏。现有进度不会被删除，确定继续吗？',
      noRestore: '云端还没有可恢复的进度。', unavailable: '暂时无法连接账户服务，请稍后重试。', invalidName: '昵称需要 2–24 个字符。'
    },
    en: {
      login: 'Log in', loginNote: 'Save your progress', profile: 'Player profile', profileNote: 'Connected', menuLabel: 'Log in or view player profile',
      kicker: 'PLAYER PROFILE · CLOUD SAVE', title: 'Player profile', close: 'Close player profile', signedIn: 'Signed in',
      loops: 'Loops closed', levels: 'Levels cleared', stars: 'Total stars', nickname: 'Player name', nicknameHint: '2–24 characters, displayed only inside Word Loop.', save: 'Save',
      cloudTitle: 'Cloud progress', checking: 'Checking sync status…', noCloud: 'No cloud record yet', lastSync: 'Last synced: {time}',
      backup: 'Sync now', restore: 'Restore to this device', privacy: 'Identity is securely verified by ChatGPT. Word Loop never stores your password.', signOut: 'Log out',
      saved: 'Player name saved.', synced: 'This device is now synced to the cloud.', restored: 'Cloud progress restored. Reloading the game…',
      restoreConfirm: 'Write the cloud record to this device and reload the game? Existing progress will not be deleted.',
      noRestore: 'There is no cloud progress to restore yet.', unavailable: 'The account service is unavailable. Please try again later.', invalidName: 'Your player name must contain 2–24 characters.'
    }
  };

  function language() { return typeof currentLanguage === 'string' && currentLanguage === 'en' ? 'en' : 'zh'; }
  function text(key, params) {
    var value = (TEXT[language()] || TEXT.zh)[key] || key;
    if (!params) return value;
    return value.replace(/\{(\w+)\}/g, function(match, name) { return params[name] === undefined ? match : params[name]; });
  }
  function safeJson(value, fallback) { try { return JSON.parse(value); } catch (err) { return fallback; } }
  function api(path, options) {
    var requestOptions = options || {};
    requestOptions.headers = Object.assign({ 'accept': 'application/json' }, requestOptions.headers || {});
    requestOptions.cache = 'no-store';
    return fetch(path, requestOptions).then(function(response) {
      return response.json().catch(function() { return {}; }).then(function(body) {
        if (!response.ok) {
          var error = new Error(body.error || 'Request failed');
          error.status = response.status;
          throw error;
        }
        return body;
      });
    });
  }

  function UserSystemController() {
    this.user = null;
    this.lastFocused = null;
    this.backupTimer = null;
    this.progressChanged = false;
    this.overlay = document.getElementById('accountOverlay');
    this.startButton = document.getElementById('startLoginBtn');
    this.menuButton = document.getElementById('accountMenuBtn');
    this.bindUI();
    this.refreshLanguage();
    this.loadUser();
  }

  UserSystemController.prototype.bindUI = function() {
    var self = this;
    this.startButton.addEventListener('click', function() { self.accountAction(); });
    this.menuButton.addEventListener('click', function() { self.accountAction(); });
    document.getElementById('accountCloseBtn').addEventListener('click', function() { self.close(); });
    this.overlay.addEventListener('click', function(event) { if (event.target === self.overlay) self.close(); });
    document.getElementById('accountProfileForm').addEventListener('submit', function(event) { event.preventDefault(); self.saveProfile(); });
    document.getElementById('accountBackupBtn').addEventListener('click', function() { self.backupProgress(true); });
    document.getElementById('accountRestoreBtn').addEventListener('click', function() { self.restoreProgress(); });
    document.addEventListener('keydown', function(event) { if (event.key === 'Escape' && !self.overlay.hidden) self.close(); });
    window.addEventListener('wordloop:progress-changed', function() {
      self.progressChanged = true;
      if (!self.user || !self.user.authenticated) return;
      clearTimeout(self.backupTimer);
      self.backupTimer = setTimeout(function() { self.backupProgress(false); }, 1200);
    });
  };

  UserSystemController.prototype.loadUser = function() {
    var self = this;
    api('/api/user').then(function(result) {
      self.user = result;
      self.renderIdentity();
      if (!result.authenticated) return;
      if (result.hasCloudProgress) {
        self.updateCloudStatus(result.progressUpdatedAt);
        if (!self.hasMeaningfulLocalProgress()) self.restoreProgress(true);
      } else if (self.hasMeaningfulLocalProgress()) {
        self.backupProgress(false);
      } else {
        self.updateCloudStatus(null);
      }
    }).catch(function() {
      self.user = { authenticated: false, serviceUnavailable: true };
      self.renderIdentity();
    });
  };

  UserSystemController.prototype.accountAction = function() {
    if (!this.user || !this.user.authenticated) {
      window.location.assign(SIGN_IN_PATH);
      return;
    }
    this.open();
  };

  UserSystemController.prototype.open = function() {
    this.lastFocused = document.activeElement;
    this.renderIdentity();
    this.renderStats();
    this.overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    document.getElementById('accountCloseBtn').focus({ preventScroll: true });
  };

  UserSystemController.prototype.close = function() {
    this.overlay.hidden = true;
    document.body.style.overflow = '';
    if (this.lastFocused && this.lastFocused.focus) this.lastFocused.focus({ preventScroll: true });
  };

  UserSystemController.prototype.renderIdentity = function() {
    var authenticated = this.user && this.user.authenticated;
    var displayName = authenticated ? (this.user.profile.nickname || this.user.profile.displayName || this.user.email) : '';
    document.getElementById('startLoginLabel').textContent = authenticated ? text('profile') : text('login');
    document.getElementById('startLoginNote').textContent = authenticated ? displayName : text('loginNote');
    document.getElementById('accountMenuLabel').textContent = authenticated ? displayName : text('login');
    this.menuButton.classList.toggle('is-authenticated', !!authenticated);
    this.menuButton.setAttribute('aria-label', text('menuLabel'));
    if (!authenticated) return;
    document.getElementById('accountDisplayName').textContent = displayName;
    document.getElementById('accountEmail').textContent = this.user.email || '';
    document.getElementById('accountNickname').value = this.user.profile.nickname || displayName;
    document.getElementById('accountAvatar').textContent = (displayName.trim().charAt(0) || 'W').toUpperCase();
  };

  UserSystemController.prototype.localStats = function() {
    var achievements = safeJson(localStorage.getItem('word-chain-loop:achievements:v1'), {}) || {};
    var campaign = safeJson(localStorage.getItem('word-chain-loop:campaign-progress:v3'), {}) || {};
    var levels = campaign.levels || {};
    var completed = 0;
    var stars = 0;
    Object.keys(levels).forEach(function(id) {
      if (levels[id] && levels[id].completed) completed += 1;
      stars += Math.max(0, Number(levels[id] && levels[id].stars) || 0);
    });
    return { loops: Math.max(0, Number(achievements.totalLoops) || 0), levels: completed, stars: stars };
  };

  UserSystemController.prototype.renderStats = function() {
    var stats = this.localStats();
    document.getElementById('accountLoops').textContent = stats.loops;
    document.getElementById('accountLevels').textContent = stats.levels + ' / 12';
    document.getElementById('accountStars').textContent = stats.stars;
  };

  UserSystemController.prototype.progressSnapshot = function() {
    var values = {};
    var size = 0;
    for (var i = 0; i < localStorage.length && Object.keys(values).length < 160; i++) {
      var key = localStorage.key(i) || '';
      var allowed = key === 'word-chain-loop:achievements:v1' || key === 'word-chain-loop:campaign-progress:v3' || key.indexOf('word-chain-loop:record:v3:') === 0;
      if (!allowed) continue;
      var value = localStorage.getItem(key);
      size += key.length + (value ? value.length : 0);
      if (size > 90000) break;
      values[key] = value;
    }
    return { version: 1, values: values, stats: this.localStats() };
  };

  UserSystemController.prototype.hasMeaningfulLocalProgress = function() {
    var stats = this.localStats();
    if (stats.loops > 0 || stats.levels > 0) return true;
    for (var i = 0; i < localStorage.length; i++) {
      if ((localStorage.key(i) || '').indexOf('word-chain-loop:record:v3:') === 0) return true;
    }
    return false;
  };

  UserSystemController.prototype.backupProgress = function(announce) {
    if (!this.user || !this.user.authenticated) return Promise.resolve();
    var self = this;
    var button = document.getElementById('accountBackupBtn');
    button.disabled = true;
    return api('/api/user/progress', {
      method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ snapshot: this.progressSnapshot() })
    }).then(function(result) {
      self.progressChanged = false;
      self.user.hasCloudProgress = true;
      self.user.progressUpdatedAt = result.updatedAt;
      try { localStorage.setItem(SYNC_META_KEY, JSON.stringify({ updatedAt: result.updatedAt })); } catch (err) { /* optional */ }
      self.updateCloudStatus(result.updatedAt);
      if (announce) self.showMessage(text('synced'));
    }).catch(function() {
      if (announce) self.showMessage(text('unavailable'), true);
    }).finally(function() { button.disabled = false; });
  };

  UserSystemController.prototype.restoreProgress = function(silent) {
    if (!this.user || !this.user.authenticated) return;
    if (!this.user.hasCloudProgress) {
      if (!silent) this.showMessage(text('noRestore'), true);
      return;
    }
    if (!silent && !window.confirm(text('restoreConfirm'))) return;
    var self = this;
    var button = document.getElementById('accountRestoreBtn');
    button.disabled = true;
    api('/api/user/progress').then(function(result) {
      var values = result.snapshot && result.snapshot.values;
      if (!values || typeof values !== 'object') throw new Error('No snapshot');
      Object.keys(values).forEach(function(key) {
        if (key.indexOf('word-chain-loop:') !== 0 || typeof values[key] !== 'string') return;
        localStorage.setItem(key, values[key]);
      });
      localStorage.setItem(SYNC_META_KEY, JSON.stringify({ updatedAt: result.updatedAt }));
      if (!silent) self.showMessage(text('restored'));
      setTimeout(function() { window.location.reload(); }, silent ? 0 : 650);
    }).catch(function() {
      button.disabled = false;
      if (!silent) self.showMessage(text('unavailable'), true);
    });
  };

  UserSystemController.prototype.saveProfile = function() {
    var self = this;
    var input = document.getElementById('accountNickname');
    var nickname = input.value.trim();
    if (nickname.length < 2 || nickname.length > 24) {
      this.showMessage(text('invalidName'), true);
      input.focus();
      return;
    }
    var button = document.getElementById('accountSaveBtn');
    button.disabled = true;
    api('/api/user', {
      method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ nickname: nickname })
    }).then(function(result) {
      self.user.profile = result.profile;
      self.renderIdentity();
      self.showMessage(text('saved'));
    }).catch(function(error) {
      self.showMessage(error.status === 400 ? text('invalidName') : text('unavailable'), true);
    }).finally(function() { button.disabled = false; });
  };

  UserSystemController.prototype.updateCloudStatus = function(updatedAt) {
    var label = text('noCloud');
    if (updatedAt) {
      var date = new Date(updatedAt);
      label = text('lastSync', { time: isNaN(date.getTime()) ? updatedAt : date.toLocaleString(language() === 'en' ? 'en-US' : 'zh-CN', { dateStyle: 'medium', timeStyle: 'short' }) });
    }
    document.getElementById('accountCloudStatus').textContent = label;
    document.getElementById('accountRestoreBtn').disabled = !updatedAt;
  };

  UserSystemController.prototype.showMessage = function(message, error) {
    var target = document.getElementById('accountMessage');
    target.textContent = message;
    target.classList.toggle('is-error', !!error);
  };

  UserSystemController.prototype.refreshLanguage = function() {
    document.getElementById('accountKicker').textContent = text('kicker');
    document.getElementById('accountTitle').textContent = text('title');
    document.getElementById('accountCloseBtn').setAttribute('aria-label', text('close'));
    document.getElementById('accountStatus').textContent = text('signedIn');
    document.getElementById('accountLoopsLabel').textContent = text('loops');
    document.getElementById('accountLevelsLabel').textContent = text('levels');
    document.getElementById('accountStarsLabel').textContent = text('stars');
    document.getElementById('accountNicknameLabel').textContent = text('nickname');
    document.getElementById('accountNicknameHint').textContent = text('nicknameHint');
    document.getElementById('accountSaveBtn').textContent = text('save');
    document.getElementById('accountCloudTitle').textContent = text('cloudTitle');
    document.getElementById('accountBackupBtn').textContent = text('backup');
    document.getElementById('accountRestoreBtn').textContent = text('restore');
    document.getElementById('accountPrivacy').textContent = text('privacy');
    document.getElementById('accountSignOut').textContent = text('signOut');
    if (this.user && this.user.authenticated) this.updateCloudStatus(this.user.progressUpdatedAt);
    else document.getElementById('accountCloudStatus').textContent = text('checking');
    this.renderIdentity();
  };

  window.UserSystemController = UserSystemController;
  window.userSystemController = new UserSystemController();
})();
