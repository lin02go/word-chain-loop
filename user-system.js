(function() {
  'use strict';

  var SYNC_META_KEY = 'word-chain-loop:account-sync:v1';
  var CAMPAIGN_LEVEL_COUNT = typeof CAMPAIGN_LEVELS !== 'undefined' ? CAMPAIGN_LEVELS.length : 100;
  var TEXT = {
    zh: {
      login: '登录', register: '注册', loginNote: '保存游戏进度', profile: '玩家档案', menuLabel: '登录或查看玩家档案',
      kicker: '邮箱账户 · 云端保存', titleGuest: '登录词环', titleProfile: '玩家档案', close: '关闭账户窗口', signedIn: '已登录',
      authIntroLogin: '登录后可跨设备保存词环进度。', authIntroRegister: '创建一个词环账户，自动保存你的成就与闯关进度。',
      email: '邮箱', password: '密码', nickname: '玩家昵称', passwordHint: '至少 10 个字符。', show: '显示', hide: '隐藏',
      authSecurity: '密码经加盐派生后保存；本站不会读取或保存明文密码。',
      loops: '完成词环', levels: '闯关完成', stars: '累计星数', nicknameHint: '2–24 个字符，只用于词环内展示。', save: '保存',
      cloudTitle: '云端进度', checking: '正在检查同步状态…', noCloud: '尚无云端记录', lastSync: '上次同步：{time}',
      backup: '立即同步', restore: '恢复到此设备', privacy: '账户和游戏进度保存在 Cloudflare；词环不会保存你的明文密码。', signOut: '退出登录',
      saved: '昵称已保存。', synced: '此设备的进度已同步到云端。', restored: '云端进度已恢复，正在重新载入游戏…', restoredNoChange: '此设备已经是最新进度，无需重新载入。',
      restoreConfirm: '将云端记录写入此设备并重新载入游戏。现有进度不会被删除，确定继续吗？', noRestore: '云端还没有可恢复的进度。',
      unavailable: '暂时无法连接账户服务，请稍后重试。', invalidName: '昵称需要 2–24 个字符。', invalidForm: '请填写有效邮箱；密码至少需要 10 个字符。',
      invalidCredentials: '邮箱或密码不正确。', emailExists: '该邮箱已注册，请直接登录。', rateLimited: '尝试次数过多，请稍后再试。', registered: '账户已创建并登录。', loggedIn: '登录成功。'
    },
    en: {
      login: 'Log in', register: 'Create account', loginNote: 'Save your progress', profile: 'Player profile', menuLabel: 'Log in or view player profile',
      kicker: 'EMAIL ACCOUNT · CLOUD SAVE', titleGuest: 'Log in to Word Loop', titleProfile: 'Player profile', close: 'Close account window', signedIn: 'Signed in',
      authIntroLogin: 'Log in to save Word Loop progress across devices.', authIntroRegister: 'Create a Word Loop account and automatically save achievements and campaign progress.',
      email: 'Email', password: 'Password', nickname: 'Player name', passwordHint: 'Use at least 10 characters.', show: 'Show', hide: 'Hide',
      authSecurity: 'Passwords are stored only as salted derived hashes. Plain-text passwords are never saved.',
      loops: 'Loops closed', levels: 'Levels cleared', stars: 'Total stars', nicknameHint: '2–24 characters, displayed only inside Word Loop.', save: 'Save',
      cloudTitle: 'Cloud progress', checking: 'Checking sync status…', noCloud: 'No cloud record yet', lastSync: 'Last synced: {time}',
      backup: 'Sync now', restore: 'Restore to this device', privacy: 'Your account and progress are stored on Cloudflare. Word Loop never stores your plain-text password.', signOut: 'Log out',
      saved: 'Player name saved.', synced: 'This device is now synced to the cloud.', restored: 'Cloud progress restored. Reloading the game…', restoredNoChange: 'This device already has the latest progress. No reload is needed.',
      restoreConfirm: 'Write the cloud record to this device and reload the game? Existing progress will not be deleted.', noRestore: 'There is no cloud progress to restore yet.',
      unavailable: 'The account service is unavailable. Please try again later.', invalidName: 'Your player name must contain 2–24 characters.', invalidForm: 'Enter a valid email and a password of at least 10 characters.',
      invalidCredentials: 'The email or password is incorrect.', emailExists: 'That email is already registered. Please log in.', rateLimited: 'Too many attempts. Please try again later.', registered: 'Account created and signed in.', loggedIn: 'Signed in successfully.'
    }
  };

  function language() { return typeof currentLanguage === 'string' && currentLanguage === 'en' ? 'en' : 'zh'; }
  function text(key, params) {
    var value = (TEXT[language()] || TEXT.zh)[key] || key;
    if (!params) return value;
    return value.replace(/\{(\w+)\}/g, function(match, name) { return params[name] === undefined ? match : params[name]; });
  }
  function safeJson(value, fallback) { try { return JSON.parse(value); } catch (err) { return fallback; } }
  function canUseBackend() {
    return window.location.protocol === 'http:' || window.location.protocol === 'https:';
  }
  function isProgressKey(key) {
    return key === 'word-chain-loop:achievements:v1' ||
      key === 'word-chain-loop:campaign-progress:v3' ||
      key === 'word-chain-loop:daily:v1' ||
      key.indexOf('word-chain-loop:record:v3:') === 0;
  }
  function api(path, options) {
    if (!canUseBackend()) return Promise.reject(new Error('Account service requires HTTP or HTTPS.'));
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

  function UserSystemController() {
    this.user = { authenticated: false };
    this.authMode = 'login';
    this.lastFocused = null;
    this.backupTimer = null;
    this.overlay = document.getElementById('accountOverlay');
    this.startButton = document.getElementById('startLoginBtn');
    this.menuButton = document.getElementById('accountMenuBtn');
    this.bindUI();
    this.refreshLanguage();
    this.loadUser();
  }

  UserSystemController.prototype.bindUI = function() {
    var self = this;
    this.startButton.addEventListener('click', function() { self.open(); });
    this.menuButton.addEventListener('click', function() { self.open(); });
    document.getElementById('accountCloseBtn').addEventListener('click', function() { self.close(); });
    this.overlay.addEventListener('click', function(event) { if (event.target === self.overlay) self.close(); });
    document.querySelectorAll('[data-auth-mode]').forEach(function(button) {
      button.addEventListener('click', function() { self.setAuthMode(button.getAttribute('data-auth-mode')); });
    });
    document.getElementById('accountPasswordToggle').addEventListener('click', function() { self.togglePassword(); });
    document.getElementById('accountAuthForm').addEventListener('submit', function(event) { event.preventDefault(); self.submitAuth(); });
    document.getElementById('accountProfileForm').addEventListener('submit', function(event) { event.preventDefault(); self.saveProfile(); });
    document.getElementById('accountBackupBtn').addEventListener('click', function() { self.backupProgress(true); });
    document.getElementById('accountRestoreBtn').addEventListener('click', function() { self.restoreProgress(false); });
    document.getElementById('accountSignOut').addEventListener('click', function() { self.signOut(); });
    document.addEventListener('keydown', function(event) { if (event.key === 'Escape' && !self.overlay.hidden) self.close(); });
    window.addEventListener('wordloop:progress-changed', function() {
      if (!self.user.authenticated) return;
      clearTimeout(self.backupTimer);
      self.backupTimer = setTimeout(function() { self.backupProgress(false); }, 1200);
    });
  };

  UserSystemController.prototype.loadUser = function() {
    var self = this;
    return api('/api/auth/me').then(function(result) {
      self.user = result;
      self.render();
      window.dispatchEvent(new CustomEvent('wordloop:auth-changed', { detail: result }));
      if (!result.authenticated) return;
      if (result.hasCloudProgress) {
        self.updateCloudStatus(result.progressUpdatedAt);
        if (!self.hasMeaningfulLocalProgress() && !self.hasSyncedVersion(result.progressUpdatedAt)) self.restoreProgress(true);
      } else if (self.hasMeaningfulLocalProgress()) self.backupProgress(false);
      else self.updateCloudStatus(null);
    }).catch(function() {
      self.user = { authenticated: false, serviceUnavailable: true };
      self.render();
      window.dispatchEvent(new CustomEvent('wordloop:auth-changed', { detail: self.user }));
    });
  };

  UserSystemController.prototype.open = function() {
    this.lastFocused = document.activeElement;
    this.render();
    this.renderStats();
    this.showMessage('');
    this.overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    (this.user.authenticated ? document.getElementById('accountCloseBtn') : document.getElementById('accountAuthEmail')).focus({ preventScroll: true });
  };

  UserSystemController.prototype.close = function() {
    this.overlay.hidden = true;
    document.body.style.overflow = '';
    document.getElementById('accountAuthPassword').value = '';
    if (this.lastFocused && this.lastFocused.focus) this.lastFocused.focus({ preventScroll: true });
  };

  UserSystemController.prototype.setAuthMode = function(mode) {
    this.authMode = mode === 'register' ? 'register' : 'login';
    var register = this.authMode === 'register';
    document.getElementById('accountRegisterFields').hidden = !register;
    document.getElementById('accountRegisterNickname').required = register;
    document.getElementById('accountAuthPassword').setAttribute('autocomplete', register ? 'new-password' : 'current-password');
    document.querySelectorAll('[data-auth-mode]').forEach(function(button) {
      var active = button.getAttribute('data-auth-mode') === (register ? 'register' : 'login');
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    document.getElementById('accountAuthIntro').textContent = text(register ? 'authIntroRegister' : 'authIntroLogin');
    document.getElementById('accountAuthSubmit').textContent = text(register ? 'register' : 'login');
    this.showMessage('');
  };

  UserSystemController.prototype.togglePassword = function() {
    var input = document.getElementById('accountAuthPassword');
    var visible = input.type === 'text';
    input.type = visible ? 'password' : 'text';
    document.getElementById('accountPasswordToggle').textContent = text(visible ? 'show' : 'hide');
    document.getElementById('accountPasswordToggle').setAttribute('aria-label', text(visible ? 'show' : 'hide'));
  };

  UserSystemController.prototype.submitAuth = function() {
    var self = this;
    var emailInput = document.getElementById('accountAuthEmail');
    var passwordInput = document.getElementById('accountAuthPassword');
    var nicknameInput = document.getElementById('accountRegisterNickname');
    var email = emailInput.value.trim().toLowerCase();
    var password = passwordInput.value;
    var nickname = nicknameInput.value.trim();
    if (!emailInput.checkValidity() || password.length < 10 || (this.authMode === 'register' && (nickname.length < 2 || nickname.length > 24))) {
      this.showMessage(text(this.authMode === 'register' && nickname.length < 2 ? 'invalidName' : 'invalidForm'), true);
      return;
    }
    var button = document.getElementById('accountAuthSubmit');
    button.disabled = true;
    api('/api/auth/' + this.authMode, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify(this.authMode === 'register' ? { email: email, password: password, nickname: nickname } : { email: email, password: password })
    }).then(function(result) {
      self.user = result;
      passwordInput.value = '';
      self.render();
      window.dispatchEvent(new CustomEvent('wordloop:auth-changed', { detail: result }));
      self.renderStats();
      self.showMessage(text(self.authMode === 'register' ? 'registered' : 'loggedIn'));
      if (result.hasCloudProgress && !self.hasMeaningfulLocalProgress() && !self.hasSyncedVersion(result.progressUpdatedAt)) self.restoreProgress(true);
      else if (!result.hasCloudProgress && self.hasMeaningfulLocalProgress()) self.backupProgress(false);
    }).catch(function(error) {
      var key = error.code === 'INVALID_CREDENTIALS' ? 'invalidCredentials' : error.code === 'EMAIL_EXISTS' ? 'emailExists' : error.code === 'RATE_LIMITED' ? 'rateLimited' : error.code === 'VALIDATION' ? 'invalidForm' : 'unavailable';
      self.showMessage(text(key), true);
    }).finally(function() { button.disabled = false; });
  };

  UserSystemController.prototype.signOut = function() {
    var self = this;
    api('/api/auth/logout', { method: 'POST' }).catch(function() {}).finally(function() {
      self.user = { authenticated: false };
      self.setAuthMode('login');
      self.render();
      window.dispatchEvent(new CustomEvent('wordloop:auth-changed', { detail: self.user }));
      self.close();
    });
  };

  UserSystemController.prototype.render = function() {
    var authenticated = Boolean(this.user && this.user.authenticated);
    var displayName = authenticated ? (this.user.profile.nickname || this.user.profile.displayName || this.user.email) : '';
    document.getElementById('accountAuthView').hidden = authenticated;
    document.getElementById('accountProfileView').hidden = !authenticated;
    document.getElementById('accountTitle').textContent = text(authenticated ? 'titleProfile' : 'titleGuest');
    document.getElementById('startLoginLabel').textContent = authenticated ? text('profile') : text('login');
    document.getElementById('startLoginNote').textContent = authenticated ? displayName : text('loginNote');
    document.getElementById('accountMenuLabel').textContent = authenticated ? displayName : text('login');
    this.menuButton.classList.toggle('is-authenticated', authenticated);
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
    document.getElementById('accountLevels').textContent = stats.levels + ' / ' + CAMPAIGN_LEVEL_COUNT;
    document.getElementById('accountStars').textContent = stats.stars;
  };

  UserSystemController.prototype.progressSnapshot = function() {
    var values = {};
    var size = 0;
    for (var i = 0; i < localStorage.length && Object.keys(values).length < 160; i++) {
      var key = localStorage.key(i) || '';
      if (!isProgressKey(key)) continue;
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
    for (var i = 0; i < localStorage.length; i++) if ((localStorage.key(i) || '').indexOf('word-chain-loop:record:v3:') === 0) return true;
    return false;
  };

  UserSystemController.prototype.hasSyncedVersion = function(updatedAt) {
    if (!updatedAt) return false;
    try {
      var meta = safeJson(localStorage.getItem(SYNC_META_KEY), {});
      return meta.updatedAt === updatedAt;
    } catch (err) {
      return false;
    }
  };

  UserSystemController.prototype.backupProgress = function(announce) {
    if (!this.user.authenticated) return Promise.resolve();
    var self = this;
    var button = document.getElementById('accountBackupBtn');
    button.disabled = true;
    return api('/api/user/progress', {
      method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ snapshot: this.progressSnapshot() })
    }).then(function(result) {
      self.user.hasCloudProgress = true;
      self.user.progressUpdatedAt = result.updatedAt;
      try { localStorage.setItem(SYNC_META_KEY, JSON.stringify({ updatedAt: result.updatedAt })); } catch (err) {}
      self.updateCloudStatus(result.updatedAt);
      if (announce) self.showMessage(text('synced'));
    }).catch(function() { if (announce) self.showMessage(text('unavailable'), true); }).finally(function() { button.disabled = false; });
  };

  UserSystemController.prototype.restoreProgress = function(silent) {
    if (!this.user.authenticated) return;
    if (!this.user.hasCloudProgress) { if (!silent) this.showMessage(text('noRestore'), true); return; }
    if (!silent && !window.confirm(text('restoreConfirm'))) return;
    var self = this;
    var button = document.getElementById('accountRestoreBtn');
    button.disabled = true;
    return api('/api/user/progress').then(function(result) {
      var values = result.snapshot && result.snapshot.values;
      if (!values || typeof values !== 'object') throw new Error('No snapshot');
      var changed = false;
      Object.keys(values).forEach(function(key) {
        if (!isProgressKey(key) || typeof values[key] !== 'string') return;
        if (localStorage.getItem(key) === values[key]) return;
        localStorage.setItem(key, values[key]);
        changed = true;
      });
      var updatedAt = result.updatedAt || self.user.progressUpdatedAt;
      if (updatedAt) localStorage.setItem(SYNC_META_KEY, JSON.stringify({ updatedAt: updatedAt }));
      if (!silent) self.showMessage(text(changed ? 'restored' : 'restoredNoChange'));
      if (changed) setTimeout(function() { window.location.reload(); }, silent ? 0 : 650);
      else button.disabled = false;
    }).catch(function() { button.disabled = false; if (!silent) self.showMessage(text('unavailable'), true); });
  };

  UserSystemController.prototype.saveProfile = function() {
    var self = this;
    var input = document.getElementById('accountNickname');
    var nickname = input.value.trim();
    if (nickname.length < 2 || nickname.length > 24) { this.showMessage(text('invalidName'), true); input.focus(); return; }
    var button = document.getElementById('accountSaveBtn');
    button.disabled = true;
    api('/api/user', {
      method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ nickname: nickname })
    }).then(function(result) {
      self.user.profile = result.profile;
      self.render();
      self.showMessage(text('saved'));
    }).catch(function(error) {
      self.showMessage(error.code === 'VALIDATION' ? text('invalidName') : text('unavailable'), true);
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
    target.textContent = message || '';
    target.classList.toggle('is-error', Boolean(error));
  };

  UserSystemController.prototype.refreshLanguage = function() {
    document.getElementById('accountKicker').textContent = text('kicker');
    document.getElementById('accountCloseBtn').setAttribute('aria-label', text('close'));
    document.getElementById('accountLoginTab').textContent = text('login');
    document.getElementById('accountRegisterTab').textContent = text('register');
    document.getElementById('accountEmailLabel').textContent = text('email');
    document.getElementById('accountRegisterNicknameLabel').textContent = text('nickname');
    document.getElementById('accountPasswordLabel').textContent = text('password');
    document.getElementById('accountPasswordHint').textContent = text('passwordHint');
    document.getElementById('accountPasswordToggle').textContent = text(document.getElementById('accountAuthPassword').type === 'text' ? 'hide' : 'show');
    document.getElementById('accountAuthSecurity').textContent = text('authSecurity');
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
    this.setAuthMode(this.authMode);
    if (this.user.authenticated) this.updateCloudStatus(this.user.progressUpdatedAt);
    else document.getElementById('accountCloudStatus').textContent = text('checking');
    this.render();
  };

  window.UserSystemController = UserSystemController;
  window.userSystemController = new UserSystemController();
})();
