'use strict';

(function() {
  var form = document.getElementById('resetPasswordForm');
  var password = document.getElementById('resetPassword');
  var confirmation = document.getElementById('resetPasswordConfirm');
  var submit = document.getElementById('resetPasswordSubmit');
  var status = document.getElementById('resetPasswordStatus');
  var success = document.getElementById('resetPasswordSuccess');
  var token = new URLSearchParams(window.location.search).get('token') || '';

  if (token) window.history.replaceState(null, '', window.location.pathname);
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) {
    status.textContent = '重置链接无效或已经过期，请申请新的链接。';
    submit.disabled = true;
  }

  document.getElementById('resetPasswordShow').addEventListener('change', function() {
    var type = this.checked ? 'text' : 'password';
    password.type = type;
    confirmation.type = type;
  });

  form.addEventListener('submit', function(event) {
    event.preventDefault();
    status.textContent = '';
    if (password.value.length < 10 || password.value.length > 128) {
      status.textContent = '新密码需要 10–128 个字符。';
      password.focus();
      return;
    }
    if (password.value !== confirmation.value) {
      status.textContent = '两次输入的密码不一致。';
      confirmation.focus();
      return;
    }

    submit.disabled = true;
    fetch('/api/auth/reset-password', {
      method: 'POST',
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: token, password: password.value })
    }).then(function(response) {
      return response.json().catch(function() { return {}; }).then(function(body) {
        if (!response.ok) throw new Error(body.code || 'RESET_FAILED');
        return body;
      });
    }).then(function() {
      password.value = '';
      confirmation.value = '';
      token = '';
      form.hidden = true;
      success.hidden = false;
      success.querySelector('a').focus();
    }).catch(function(error) {
      status.textContent = error.message === 'INVALID_RESET_TOKEN' ?
        '重置链接无效、已过期或已经使用过。' : '暂时无法重置密码，请稍后再试。';
      submit.disabled = false;
    });
  });
})();
