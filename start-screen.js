(function() {
  'use strict';

  function StartScreenController() {
    this.screen = document.getElementById('startScreen');
    this.welcomePanel = document.getElementById('startWelcomePanel');
    this.modePicker = document.getElementById('startModePicker');
    this.about = document.getElementById('startAbout');
    this.lastFocused = null;
    this.bindUI();
    this.show();
  }

  StartScreenController.prototype.bindUI = function() {
    var self = this;
    document.getElementById('startGameBtn').addEventListener('click', function() {
      self.showModePicker();
    });
    document.getElementById('startModeBackBtn').addEventListener('click', function() {
      self.showWelcome();
    });
    document.getElementById('startAboutBtn').addEventListener('click', function() {
      self.openAbout();
    });
    document.getElementById('startAboutClose').addEventListener('click', function() {
      self.closeAbout();
    });
    document.getElementById('returnHomeBtn').addEventListener('click', function() {
      self.show();
    });
    this.about.addEventListener('click', function(event) {
      if (event.target === self.about) self.closeAbout();
    });

    var modeButtons = document.querySelectorAll('[data-start-mode]');
    for (var i = 0; i < modeButtons.length; i++) {
      modeButtons[i].addEventListener('click', function() {
        self.enterGame(this.getAttribute('data-start-mode'));
      });
    }

    document.addEventListener('keydown', function(event) {
      if (event.key !== 'Escape' || self.screen.hidden) return;
      if (!self.about.hidden) self.closeAbout();
      else if (!self.modePicker.hidden) self.showWelcome();
    });
  };

  StartScreenController.prototype.show = function() {
    this.screen.hidden = false;
    this.screen.classList.remove('is-leaving');
    document.body.classList.add('start-screen-open');
    this.closeAbout(false);
    this.showWelcome();
    var button = document.getElementById('startGameBtn');
    if (button) button.focus({ preventScroll: true });
  };

  StartScreenController.prototype.showWelcome = function() {
    this.welcomePanel.hidden = false;
    this.modePicker.hidden = true;
    document.getElementById('startGameBtn').focus({ preventScroll: true });
  };

  StartScreenController.prototype.showModePicker = function() {
    this.welcomePanel.hidden = true;
    this.modePicker.hidden = false;
    var firstMode = this.modePicker.querySelector('[data-start-mode]');
    if (firstMode) firstMode.focus({ preventScroll: true });
  };

  StartScreenController.prototype.openAbout = function() {
    this.lastFocused = document.activeElement;
    this.about.hidden = false;
    document.getElementById('startAboutClose').focus({ preventScroll: true });
  };

  StartScreenController.prototype.closeAbout = function(restoreFocus) {
    this.about.hidden = true;
    if (restoreFocus !== false && this.lastFocused && this.lastFocused.focus) {
      this.lastFocused.focus({ preventScroll: true });
    }
  };

  StartScreenController.prototype.enterGame = function(mode) {
    var nextMode = mode === 'campaign' ? 'campaign' : 'casual';
    if (window.campaignController && window.campaignController.setMode) {
      window.campaignController.setMode(nextMode);
    }
    this.screen.classList.add('is-leaving');
    document.body.classList.remove('start-screen-open');
    var self = this;
    setTimeout(function() {
      self.screen.hidden = true;
      self.screen.classList.remove('is-leaving');
      var focusTarget = nextMode === 'campaign' ?
        document.getElementById('campaignContinueBtn') : document.getElementById('wordInput');
      if (focusTarget && focusTarget.focus) focusTarget.focus({ preventScroll: true });
    }, 380);
  };

  window.StartScreenController = StartScreenController;
  window.startScreenController = new StartScreenController();
})();
