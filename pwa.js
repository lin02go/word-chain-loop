(function() {
  'use strict';

  var installPrompt = null;
  var registration = null;
  var statusTimer = 0;
  var installButtons = document.querySelectorAll('[data-pwa-install]');
  var status = document.getElementById('pwaStatus');
  var statusCopy = document.getElementById('pwaStatusCopy');
  var refreshButton = document.getElementById('pwaRefreshBtn');

  function standalone() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  }

  function setInstallVisible(visible) {
    for (var i = 0; i < installButtons.length; i++) {
      installButtons[i].hidden = !visible || standalone();
    }
  }

  function localized(key, fallback) {
    return typeof window.t === 'function' ? window.t(key) : fallback;
  }

  function showStatus(key, state, persistent) {
    if (!status || !statusCopy) return;
    window.clearTimeout(statusTimer);
    statusCopy.textContent = localized(key, key);
    status.dataset.state = state || 'ready';
    status.hidden = false;
    if (refreshButton) refreshButton.hidden = key !== 'updateReady';
    if (!persistent) {
      statusTimer = window.setTimeout(function() { status.hidden = true; }, 4200);
    }
  }

  function bindWaitingWorker(worker) {
    if (!worker) return;
    showStatus('updateReady', 'ready', true);
    if (refreshButton) {
      refreshButton.onclick = function() {
        refreshButton.disabled = true;
        worker.postMessage({ type: 'SKIP_WAITING' });
      };
    }
  }

  function watchRegistration(reg) {
    registration = reg;
    if (reg.waiting) bindWaitingWorker(reg.waiting);
    reg.addEventListener('updatefound', function() {
      var worker = reg.installing;
      if (!worker) return;
      worker.addEventListener('statechange', function() {
        if (worker.state === 'installed') {
          if (navigator.serviceWorker.controller) bindWaitingWorker(worker);
          else showStatus('offlineReady', 'ready', false);
        }
      });
    });
  }

  for (var i = 0; i < installButtons.length; i++) {
    installButtons[i].addEventListener('click', function() {
      if (!installPrompt) return;
      installPrompt.prompt();
      installPrompt.userChoice.then(function(choice) {
        if (choice.outcome === 'accepted') setInstallVisible(false);
        installPrompt = null;
      });
    });
  }

  window.addEventListener('beforeinstallprompt', function(event) {
    event.preventDefault();
    installPrompt = event;
    setInstallVisible(true);
  });

  window.addEventListener('appinstalled', function() {
    installPrompt = null;
    setInstallVisible(false);
    showStatus('installComplete', 'ready', false);
  });

  window.addEventListener('offline', function() {
    showStatus('offlineStatus', 'offline', true);
  });

  window.addEventListener('online', function() {
    showStatus('onlineStatus', 'ready', false);
  });

  if ('serviceWorker' in navigator && window.isSecureContext) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('./service-worker.js', { scope: './' })
        .then(watchRegistration)
        .catch(function(error) { console.warn('PWA registration failed:', error); });
    });

    var refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', function() {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  }

  if (!navigator.onLine) showStatus('offlineStatus', 'offline', true);
  setInstallVisible(false);

  window.pwaController = {
    refreshLanguage: function() {
      if (status && !status.hidden) {
        var state = status.dataset.state;
        if (refreshButton && !refreshButton.hidden) showStatus('updateReady', state, true);
        else if (!navigator.onLine) showStatus('offlineStatus', 'offline', true);
      }
    },
    checkForUpdate: function() {
      if (registration) return registration.update();
      return Promise.resolve();
    }
  };
})();
