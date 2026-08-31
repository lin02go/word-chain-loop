(function() {
  'use strict';

  var COPY = {
    zh: {
      open: '词条反馈', report: '报告这个词条', kicker: 'DICTIONARY REVIEW', title: '词条反馈', close: '关闭词条反馈',
      intro: '发现生僻词、错误释义或词库缺词？提交后会进入人工复核队列。', word: '英文单词', reason: '问题类型', note: '补充说明（可选）',
      placeholder: '例如：这个词只在专业医学语境中使用。', cancel: '取消', submit: '提交反馈', login: '登录后提交',
      loginRequired: '为避免重复或恶意提交，请先登录。', sending: '正在提交…', sent: '已收到，感谢你帮助改进词库。',
      duplicate: '这条反馈已经在复核队列中，无需重复提交。', invalid: '请输入 3–45 个英文字母组成的单词。',
      limited: '一小时内提交次数较多，请稍后再试。', unavailable: '反馈服务暂时不可用，请稍后再试。',
      reasons: {
        too_obscure: '过于生僻，不适合作为题目或提示', not_word: '不像有效英文单词', wrong_definition: '释义或发音有误',
        missing_word: '常见词未被词库接受', other: '其他问题'
      }
    },
    en: {
      open: 'Word feedback', report: 'Report this entry', kicker: 'DICTIONARY REVIEW', title: 'Word feedback', close: 'Close word feedback',
      intro: 'Found an obscure word, a wrong definition, or a missing word? Your report will enter the review queue.', word: 'English word', reason: 'Issue type', note: 'Additional note (optional)',
      placeholder: 'For example: this term is only used in specialist medicine.', cancel: 'Cancel', submit: 'Submit feedback', login: 'Log in to submit',
      loginRequired: 'Please log in first to reduce duplicate and abusive reports.', sending: 'Submitting…', sent: 'Received. Thanks for helping improve the dictionary.',
      duplicate: 'This report is already in the review queue.', invalid: 'Enter a word containing 3–45 English letters.',
      limited: 'You have sent several reports this hour. Please try again later.', unavailable: 'The feedback service is unavailable. Please try again later.',
      reasons: {
        too_obscure: 'Too obscure for a puzzle or hint', not_word: 'Does not appear to be a valid English word', wrong_definition: 'Definition or pronunciation is wrong',
        missing_word: 'A common word is not accepted', other: 'Other issue'
      }
    }
  };

  function language() {
    return typeof currentLanguage === 'string' && currentLanguage === 'en' ? 'en' : 'zh';
  }

  function copy(key) { return (COPY[language()] || COPY.zh)[key] || key; }

  function normalizeWord(value) {
    var word = typeof value === 'string' ? value.trim().toLowerCase() : '';
    return /^[a-z]{3,45}$/.test(word) ? word : '';
  }

  function WordFeedbackController() {
    this.overlay = document.getElementById('wordFeedbackOverlay');
    this.form = document.getElementById('wordFeedbackForm');
    this.wordInput = document.getElementById('wordFeedbackWord');
    this.reasonInput = document.getElementById('wordFeedbackReason');
    this.noteInput = document.getElementById('wordFeedbackNote');
    this.status = document.getElementById('wordFeedbackStatus');
    this.submitButton = document.getElementById('wordFeedbackSubmit');
    this.loginButton = document.getElementById('wordFeedbackLogin');
    this.source = 'manual';
    this.lastFocused = null;
    this.previousOverflow = '';
    this.bindUI();
    this.refreshLanguage();
  }

  WordFeedbackController.prototype.isAuthenticated = function() {
    return Boolean(window.userSystemController && window.userSystemController.user && window.userSystemController.user.authenticated);
  };

  WordFeedbackController.prototype.bindUI = function() {
    var self = this;
    document.getElementById('wordFeedbackBtn').addEventListener('click', function() {
      var typed = normalizeWord(document.getElementById('wordInput').value);
      self.open(typed, typed ? 'rejected_input' : 'manual');
    });
    document.getElementById('wordDefinitionReport').addEventListener('click', function() {
      var word = normalizeWord(document.getElementById('wordDefinitionTitle').textContent);
      if (window.wordDefinitionController) window.wordDefinitionController.close();
      self.open(word, 'definition');
    });
    document.getElementById('wordFeedbackClose').addEventListener('click', function() { self.close(); });
    document.getElementById('wordFeedbackCancel').addEventListener('click', function() { self.close(); });
    this.overlay.addEventListener('click', function(event) { if (event.target === self.overlay) self.close(); });
    this.form.addEventListener('submit', function(event) { event.preventDefault(); self.submit(); });
    this.loginButton.addEventListener('click', function() {
      self.close();
      if (window.userSystemController) window.userSystemController.open();
    });
    document.addEventListener('keydown', function(event) {
      if (event.key === 'Escape' && !self.overlay.hidden) self.close();
    });
  };

  WordFeedbackController.prototype.open = function(word, source) {
    this.lastFocused = document.activeElement;
    this.source = ['manual', 'definition', 'rejected_input'].indexOf(source) >= 0 ? source : 'manual';
    this.wordInput.value = normalizeWord(word);
    this.noteInput.value = '';
    this.showStatus(this.isAuthenticated() ? '' : copy('loginRequired'), !this.isAuthenticated());
    this.syncAuthentication();
    this.previousOverflow = document.body.style.overflow;
    this.overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    this.wordInput.focus({ preventScroll: true });
  };

  WordFeedbackController.prototype.close = function() {
    if (this.overlay.hidden) return;
    this.overlay.hidden = true;
    document.body.style.overflow = this.previousOverflow;
    this.submitButton.disabled = false;
    if (this.lastFocused && this.lastFocused.focus) this.lastFocused.focus({ preventScroll: true });
  };

  WordFeedbackController.prototype.syncAuthentication = function() {
    var authenticated = this.isAuthenticated();
    this.loginButton.hidden = authenticated;
    this.submitButton.hidden = !authenticated;
  };

  WordFeedbackController.prototype.showStatus = function(message, error) {
    this.status.textContent = message || '';
    this.status.classList.toggle('is-error', Boolean(error));
  };

  WordFeedbackController.prototype.submit = function() {
    var self = this;
    this.syncAuthentication();
    if (!this.isAuthenticated()) {
      this.showStatus(copy('loginRequired'), true);
      return;
    }
    var word = normalizeWord(this.wordInput.value);
    if (!word || !this.wordInput.checkValidity()) {
      this.showStatus(copy('invalid'), true);
      this.wordInput.focus();
      return;
    }

    var difficulty = typeof game !== 'undefined' && game ? game.difficulty : '';
    var gameMode = window.campaignController && window.campaignController.mode ? window.campaignController.mode : '';
    this.submitButton.disabled = true;
    this.showStatus(copy('sending'));
    fetch('/api/word-feedback', {
      method: 'POST',
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { accept: 'application/json', 'content-type': 'application/json' },
      body: JSON.stringify({
        word: word,
        reason: this.reasonInput.value,
        note: this.noteInput.value,
        source: this.source,
        difficulty: difficulty,
        gameMode: gameMode,
      }),
    }).then(function(response) {
      return response.json().catch(function() { return {}; }).then(function(body) {
        if (!response.ok) {
          var error = new Error(body.error || 'Request failed');
          error.code = body.code || '';
          error.status = response.status;
          throw error;
        }
        return body;
      });
    }).then(function(result) {
      self.showStatus(copy(result.duplicate ? 'duplicate' : 'sent'));
      self.noteInput.value = '';
    }).catch(function(error) {
      if (error.code === 'AUTH_REQUIRED') {
        self.syncAuthentication();
        self.showStatus(copy('loginRequired'), true);
      } else if (error.code === 'VALIDATION') self.showStatus(copy('invalid'), true);
      else if (error.code === 'FEEDBACK_LIMIT') self.showStatus(copy('limited'), true);
      else self.showStatus(copy('unavailable'), true);
    }).finally(function() { self.submitButton.disabled = false; });
  };

  WordFeedbackController.prototype.refreshLanguage = function() {
    document.getElementById('wordFeedbackBtn').textContent = copy('open');
    document.getElementById('wordDefinitionReport').textContent = copy('report');
    document.getElementById('wordFeedbackKicker').textContent = copy('kicker');
    document.getElementById('wordFeedbackTitle').textContent = copy('title');
    document.getElementById('wordFeedbackClose').setAttribute('aria-label', copy('close'));
    document.getElementById('wordFeedbackIntro').textContent = copy('intro');
    document.getElementById('wordFeedbackWordLabel').textContent = copy('word');
    document.getElementById('wordFeedbackReasonLabel').textContent = copy('reason');
    document.getElementById('wordFeedbackNoteLabel').textContent = copy('note');
    this.noteInput.setAttribute('placeholder', copy('placeholder'));
    document.getElementById('wordFeedbackCancel').textContent = copy('cancel');
    this.submitButton.textContent = copy('submit');
    this.loginButton.textContent = copy('login');
    var reasons = copy('reasons');
    for (var i = 0; i < this.reasonInput.options.length; i++) {
      var option = this.reasonInput.options[i];
      option.textContent = reasons[option.value] || option.value;
    }
    this.syncAuthentication();
  };

  window.wordFeedbackController = new WordFeedbackController();
})();
