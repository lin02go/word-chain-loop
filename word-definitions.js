(function() {
  'use strict';

  var CACHE_PREFIX = 'word-chain-loop:definition:v3:';
  var CACHE_TTL = 30 * 24 * 60 * 60 * 1000;
  var DICTIONARY_ENDPOINT = 'https://api.dictionaryapi.dev/api/v2/entries/en/';
  var DATAMUSE_ENDPOINT = 'https://api.datamuse.com/words';
  var TRANSLATION_ENDPOINT = 'https://api.mymemory.translated.net/get';
  var POS_ZH = {
    noun: 'n. · 名词', verb: 'v. · 动词', adjective: 'adj. · 形容词', adverb: 'adv. · 副词',
    pronoun: 'pron. · 代词', preposition: 'prep. · 介词', conjunction: 'conj. · 连词',
    interjection: 'int. · 感叹词', exclamation: 'excl. · 感叹词', determiner: 'det. · 限定词',
    article: 'art. · 冠词', numeral: 'num. · 数词'
  };

  function cleanWord(word) {
    return String(word || '').trim().toLowerCase().replace(/[^a-z'-]/g, '');
  }

  function normalizeAudio(url) {
    if (!url) return '';
    return url.indexOf('//') === 0 ? 'https:' + url : url;
  }

  function pronunciationLabel(item, index) {
    var audio = (item.audio || '').toLowerCase();
    if (audio.indexOf('-uk') >= 0 || audio.indexOf('/uk/') >= 0) return 'UK';
    if (audio.indexOf('-us') >= 0 || audio.indexOf('/us/') >= 0) return 'US';
    return index === 0 ? 'IPA' : 'IPA ' + (index + 1);
  }

  function truncateUtf8(value, maxBytes) {
    var chars = Array.from(String(value || ''));
    var result = '';
    var bytes = 0;
    for (var i = 0; i < chars.length; i++) {
      var size = new TextEncoder().encode(chars[i]).length;
      if (bytes + size > maxBytes) break;
      result += chars[i];
      bytes += size;
    }
    return result;
  }

  function decodeHtmlEntities(value) {
    var decoder = document.createElement('textarea');
    decoder.innerHTML = String(value || '');
    return decoder.value;
  }

  function normalizeTranslation(value) {
    var raw = String(value || '');
    var unsafe = /<\/?[a-z][^>]*>|https?:\/\/|www\.|href\s*=|target\s*=|\|\s*by\s+/i.test(raw);
    var text = decodeHtmlEntities(raw)
      .replace(/<[^>]*>/g, '')
      .replace(/[\u0000-\u001F\u007F\uFFFD]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    try { text = text.normalize('NFC'); } catch (error) { /* normalization is optional */ }
    return { text: text, unsafe: unsafe };
  }

  function containsChinese(value) {
    return /[\u3400-\u9FFF]/.test(value);
  }

  function compactChineseGloss(value) {
    var text = String(value || '').trim();
    var colonParts = text.split(/[:：]/);
    if (colonParts.length > 1 && !containsChinese(colonParts[0])) text = colonParts.slice(1).join('：').trim();
    var pieces = text.split(/[,，;；|]/).map(function(piece) {
      return piece.replace(/^(?:n|v|adj|adv)\.\s*/i, '').trim();
    }).filter(containsChinese);
    if (pieces.length) {
      pieces.sort(function(a, b) { return a.length - b.length; });
      text = pieces[0];
    }
    return text.replace(/[。；;，,]+$/, '').trim();
  }

  function validDirectTranslation(rawValue, word) {
    var normalized = normalizeTranslation(rawValue);
    if (normalized.unsafe) return '';
    var text = compactChineseGloss(normalized.text);
    if (!containsChinese(text)) return '';
    if (/[<>{}@]/.test(text) || /汉化|字幕|版权所有|翻译者|点击|官网|下载/.test(text)) return '';
    if (text.length > 24) return '';
    if (text.toLowerCase() === String(word || '').toLowerCase()) return '';
    return text;
  }

  function contextualGloss(rawValue) {
    var normalized = normalizeTranslation(rawValue);
    if (normalized.unsafe || !containsChinese(normalized.text)) return '';
    var parts = normalized.text.split(/[:：]/);
    var prefix = parts[0] ? parts[0].trim() : '';
    var text = containsChinese(prefix) ? prefix : parts.slice(1).join('：').trim();
    text = compactChineseGloss(text)
      .replace(/(?:的行为|的动作|的过程|的意思|的一种)$/, '')
      .trim();
    if (!containsChinese(text) || text.length > 24) return '';
    return text;
  }

  function fetchWithTimeout(url, timeout) {
    var controller = new AbortController();
    var timer = setTimeout(function() { controller.abort(); }, timeout || 8000);
    return fetch(url, { signal: controller.signal }).finally(function() { clearTimeout(timer); });
  }

  function arpabetToIpa(value) {
    var map = {
      AA: 'ɑ', AE: 'æ', AH: 'ʌ', AO: 'ɔ', AW: 'aʊ', AY: 'aɪ', EH: 'ɛ', ER: 'ɝ',
      EY: 'eɪ', IH: 'ɪ', IY: 'i', OW: 'oʊ', OY: 'ɔɪ', UH: 'ʊ', UW: 'u',
      B: 'b', CH: 'tʃ', D: 'd', DH: 'ð', F: 'f', G: 'ɡ', HH: 'h', JH: 'dʒ',
      K: 'k', L: 'l', M: 'm', N: 'n', NG: 'ŋ', P: 'p', R: 'r', S: 's', SH: 'ʃ',
      T: 't', TH: 'θ', V: 'v', W: 'w', Y: 'j', Z: 'z', ZH: 'ʒ'
    };
    var tokens = String(value || '').trim().split(/\s+/);
    var result = '';
    for (var i = 0; i < tokens.length; i++) {
      var phone = tokens[i].replace(/[012]$/, '');
      if (map[phone]) result += map[phone];
    }
    return result ? '/' + result + '/' : '';
  }

  function WordDefinitionService() {
    this.memory = new Map();
  }

  WordDefinitionService.prototype._readCache = function(word) {
    if (this.memory.has(word)) return this.memory.get(word);
    try {
      var raw = localStorage.getItem(CACHE_PREFIX + word);
      if (!raw) return null;
      var value = JSON.parse(raw);
      if (!value || !value.fetchedAt || Date.now() - value.fetchedAt > CACHE_TTL) {
        localStorage.removeItem(CACHE_PREFIX + word);
        return null;
      }
      this.memory.set(word, value);
      return value;
    } catch (error) {
      return null;
    }
  };

  WordDefinitionService.prototype._writeCache = function(word, value) {
    this.memory.set(word, value);
    try { localStorage.setItem(CACHE_PREFIX + word, JSON.stringify(value)); } catch (error) { /* storage may be unavailable */ }
  };

  WordDefinitionService.prototype._fetchEntry = async function(word) {
    var response = await fetchWithTimeout(DICTIONARY_ENDPOINT + encodeURIComponent(word), 8000);
    if (!response.ok) throw new Error('definition-not-found');
    var entries = await response.json();
    if (!Array.isArray(entries) || !entries.length) throw new Error('definition-not-found');
    return entries[0];
  };

  WordDefinitionService.prototype._fetchDatamuseEntry = async function(word) {
    var url = DATAMUSE_ENDPOINT + '?sp=' + encodeURIComponent(word) + '&md=dpr&max=10';
    var response = await fetchWithTimeout(url, 8000);
    if (!response.ok) throw new Error('definition-not-found');
    var entries = await response.json();
    var item = Array.isArray(entries) ? entries.find(function(candidate) {
      return candidate && String(candidate.word || '').toLowerCase() === word && Array.isArray(candidate.defs) && candidate.defs.length;
    }) : null;
    if (!item) throw new Error('definition-not-found');
    var rawDefinition = String(item.defs[0] || '');
    var tabIndex = rawDefinition.indexOf('\t');
    var pos = tabIndex >= 0 ? rawDefinition.slice(0, tabIndex) : '';
    var definition = tabIndex >= 0 ? rawDefinition.slice(tabIndex + 1) : rawDefinition;
    var tags = Array.isArray(item.tags) ? item.tags : [];
    var pronunciation = '';
    for (var i = 0; i < tags.length; i++) {
      if (String(tags[i]).indexOf('pron:') === 0) {
        pronunciation = arpabetToIpa(String(tags[i]).slice(5));
        break;
      }
    }
    var posMap = { n: 'noun', v: 'verb', adj: 'adjective', adv: 'adverb', u: '' };
    return {
      word: word,
      phonetic: pronunciation,
      phonetics: pronunciation ? [{ text: pronunciation, audio: '' }] : [],
      meanings: [{
        partOfSpeech: posMap[pos] || pos,
        definitions: [{ definition: definition.trim() }]
      }]
    };
  };

  WordDefinitionService.prototype._fetchFirstEntry = function(word) {
    var self = this;
    return new Promise(function(resolve, reject) {
      var failures = 0;
      function failed() {
        failures++;
        if (failures === 2) reject(new Error('definition-not-found'));
      }
      self._fetchEntry(word).then(resolve).catch(failed);
      self._fetchDatamuseEntry(word).then(resolve).catch(failed);
    });
  };

  WordDefinitionService.prototype._requestTranslation = async function(query) {
    query = truncateUtf8(query, 450);
    if (!query) return '';
    try {
      var url = TRANSLATION_ENDPOINT + '?q=' + encodeURIComponent(query) + '&langpair=en%7Czh-CN';
      var response = await fetchWithTimeout(url, 8000);
      return response.ok ? await response.json() : null;
    } catch (error) {
      return null;
    }
  };

  WordDefinitionService.prototype._translate = async function(word, definition) {
    var directData = await this._requestTranslation(word);
    var candidates = [];
    if (directData && directData.responseData) {
      var primary = validDirectTranslation(directData.responseData.translatedText, word);
      if (primary) candidates.push({ text: primary, match: Number(directData.responseData.match) || 0.8 });
    }
    var matches = directData && Array.isArray(directData.matches) ? directData.matches : [];
    for (var i = 0; i < matches.length; i++) {
      var matchScore = Number(matches[i].match) || 0;
      if (matchScore < 0.9) continue;
      var candidate = validDirectTranslation(matches[i].translation, word);
      if (candidate) candidates.push({ text: candidate, match: matchScore });
    }
    if (candidates.length) {
      candidates.sort(function(a, b) {
        return a.text.length - b.text.length || b.match - a.match;
      });
      return candidates[0].text;
    }

    var contextualData = await this._requestTranslation(word + ': ' + definition);
    var contextual = contextualData && contextualData.responseData ?
      contextualGloss(contextualData.responseData.translatedText) : '';
    return contextual;
  };

  WordDefinitionService.prototype.lookup = async function(requestedWord) {
    var word = cleanWord(requestedWord);
    if (!word) throw new Error('definition-not-found');
    var cached = this._readCache(word);
    if (cached) return cached;

    var lookupWord = word;
    var entry;
    try {
      entry = await this._fetchFirstEntry(lookupWord);
    } catch (firstError) {
      var lemma = typeof game !== 'undefined' && game && game.wordLemmaRoots ? game.wordLemmaRoots.get(word) : '';
      lemma = cleanWord(lemma);
      if (!lemma || lemma === word) throw firstError;
      lookupWord = lemma;
      entry = await this._fetchFirstEntry(lookupWord);
    }

    var meanings = Array.isArray(entry.meanings) ? entry.meanings : [];
    var selectedMeaning = null;
    var selectedDefinition = null;
    for (var i = 0; i < meanings.length && !selectedDefinition; i++) {
      var definitions = Array.isArray(meanings[i].definitions) ? meanings[i].definitions : [];
      for (var j = 0; j < definitions.length; j++) {
        if (definitions[j] && definitions[j].definition) {
          selectedMeaning = meanings[i];
          selectedDefinition = definitions[j].definition;
          break;
        }
      }
    }
    if (!selectedDefinition) throw new Error('definition-not-found');

    var rawPhonetics = Array.isArray(entry.phonetics) ? entry.phonetics : [];
    var phonetics = [];
    var seen = new Set();
    for (var p = 0; p < rawPhonetics.length && phonetics.length < 2; p++) {
      var phoneticText = String(rawPhonetics[p].text || '').trim();
      var audio = normalizeAudio(rawPhonetics[p].audio);
      if (!phoneticText && !audio) continue;
      var key = phoneticText + '|' + audio;
      if (seen.has(key)) continue;
      seen.add(key);
      phonetics.push({
        label: pronunciationLabel({ audio: audio }, phonetics.length),
        text: phoneticText,
        audio: audio
      });
    }
    if (!phonetics.length && entry.phonetic) {
      phonetics.push({ label: 'IPA', text: entry.phonetic, audio: '' });
    }

    var value = {
      word: word,
      lookupWord: lookupWord,
      phonetics: phonetics,
      partOfSpeech: String(selectedMeaning.partOfSpeech || ''),
      english: String(selectedDefinition).trim(),
      chinese: '',
      translationPending: true,
      fetchedAt: Date.now()
    };
    var self = this;
    value.translationPromise = this._translate(word, selectedDefinition).then(function(chinese) {
      value.chinese = chinese;
      value.translationPending = false;
      delete value.translationPromise;
      if (value.chinese) self._writeCache(word, value);
      return value.chinese;
    });
    this.memory.set(word, value);
    return value;
  };

  function WordDefinitionController() {
    this.popover = document.getElementById('wordDefinitionPopover');
    this.title = document.getElementById('wordDefinitionTitle');
    this.phonetics = document.getElementById('wordDefinitionPhonetics');
    this.status = document.getElementById('wordDefinitionStatus');
    this.content = document.getElementById('wordDefinitionContent');
    this.partOfSpeech = document.getElementById('wordDefinitionPartOfSpeech');
    this.chinese = document.getElementById('wordDefinitionChinese');
    this.english = document.getElementById('wordDefinitionEnglish');
    this.closeButton = document.getElementById('wordDefinitionClose');
    this.service = new WordDefinitionService();
    this.anchor = null;
    this.data = null;
    this.requestId = 0;
    this._bind();
  }

  WordDefinitionController.prototype._bind = function() {
    var self = this;
    document.addEventListener('click', function(event) {
      var wordElement = event.target.closest('.lookup-word');
      if (wordElement) {
        event.preventDefault();
        self.open(wordElement.getAttribute('data-word') || wordElement.textContent, wordElement);
        return;
      }
      if (!self.popover.hidden && !self.popover.contains(event.target)) self.close();
    });
    document.addEventListener('keydown', function(event) {
      if ((event.key === 'Enter' || event.key === ' ') && event.target.closest('.lookup-word')) {
        event.preventDefault();
        var wordElement = event.target.closest('.lookup-word');
        self.open(wordElement.getAttribute('data-word') || wordElement.textContent, wordElement);
      } else if (event.key === 'Escape' && !self.popover.hidden) {
        self.close();
      }
    });
    this.closeButton.addEventListener('click', function() { self.close(); });
    window.addEventListener('resize', function() { if (!self.popover.hidden) self._position(); });
  };

  WordDefinitionController.prototype._clearExpanded = function() {
    if (this.anchor) this.anchor.removeAttribute('aria-expanded');
  };

  WordDefinitionController.prototype._position = function() {
    if (!this.anchor || window.matchMedia('(max-width: 620px)').matches) return;
    var margin = 12;
    var gap = 10;
    var anchorRect = this.anchor.getBoundingClientRect();
    var popRect = this.popover.getBoundingClientRect();
    var left = anchorRect.left;
    var top = anchorRect.bottom + gap;
    if (left + popRect.width > window.innerWidth - margin) left = window.innerWidth - popRect.width - margin;
    if (left < margin) left = margin;
    if (top + popRect.height > window.innerHeight - margin) {
      var above = anchorRect.top - popRect.height - gap;
      if (above >= margin) {
        top = above;
      } else if (anchorRect.right + gap + popRect.width <= window.innerWidth - margin) {
        left = anchorRect.right + gap;
        top = anchorRect.top - 40;
      } else if (anchorRect.left - gap - popRect.width >= margin) {
        left = anchorRect.left - gap - popRect.width;
        top = anchorRect.top - 40;
      } else {
        top = Math.max(margin, (window.innerHeight - popRect.height) / 2);
      }
    }
    if (top < margin) top = margin;
    this.popover.style.left = Math.round(left) + 'px';
    this.popover.style.top = Math.round(top) + 'px';
  };

  WordDefinitionController.prototype._renderPhonetics = function(items) {
    var self = this;
    this.phonetics.replaceChildren();
    if (!items || !items.length) {
      this.phonetics.textContent = t('pronunciationUnavailable');
      return;
    }
    items.forEach(function(item) {
      var row = document.createElement('span');
      row.className = 'word-definition-pronunciation';
      var label = document.createElement('span');
      label.className = 'word-definition-locale';
      label.textContent = item.label;
      var ipa = document.createElement('span');
      ipa.textContent = item.text || '';
      row.append(label, ipa);
      if (item.audio) {
        var button = document.createElement('button');
        button.className = 'word-definition-audio';
        button.type = 'button';
        button.textContent = '▶';
        button.setAttribute('aria-label', t('playPronunciation', { label: item.label }));
        button.addEventListener('click', function() {
          var audio = new Audio(item.audio);
          audio.play().catch(function() { /* browser or network may block playback */ });
        });
        row.appendChild(button);
      }
      self.phonetics.appendChild(row);
    });
  };

  WordDefinitionController.prototype._renderData = function(data) {
    this.data = data;
    this.title.textContent = data.word;
    this._renderPhonetics(data.phonetics);
    this.partOfSpeech.textContent = currentLanguage === 'zh' ? (POS_ZH[data.partOfSpeech] || data.partOfSpeech) : data.partOfSpeech;
    this.chinese.textContent = data.translationPending ? t('translatingDefinition') : (data.chinese || t('chineseUnavailable'));
    this.english.textContent = data.english;
    this.status.textContent = '';
    this.status.classList.remove('is-loading');
    this.content.hidden = false;
    this._position();
  };

  WordDefinitionController.prototype.open = async function(word, anchor) {
    word = cleanWord(word);
    if (!word) return;
    this._clearExpanded();
    this.anchor = anchor;
    this.anchor.setAttribute('aria-expanded', 'true');
    this.data = null;
    this.title.textContent = word;
    this.phonetics.textContent = '';
    this.content.hidden = true;
    this.status.textContent = t('loadingDefinition');
    this.status.classList.add('is-loading');
    this.popover.hidden = false;
    this._position();
    var requestId = ++this.requestId;
    try {
      var data = await this.service.lookup(word);
      if (requestId !== this.requestId) return;
      this._renderData(data);
      if (data.translationPromise) {
        await data.translationPromise;
        if (requestId !== this.requestId) return;
        this._renderData(data);
      }
    } catch (error) {
      if (requestId !== this.requestId) return;
      this.status.textContent = t('definitionUnavailable');
      this.status.classList.remove('is-loading');
      this.phonetics.textContent = t('pronunciationUnavailable');
      this.content.hidden = true;
      this._position();
    }
  };

  WordDefinitionController.prototype.close = function() {
    this.requestId++;
    this._clearExpanded();
    this.anchor = null;
    this.popover.hidden = true;
  };

  WordDefinitionController.prototype.refreshLanguage = function() {
    var lookupWords = document.querySelectorAll('.lookup-word[data-word]');
    for (var i = 0; i < lookupWords.length; i++) {
      lookupWords[i].setAttribute('aria-label', t('wordLookupLabel', { word: lookupWords[i].getAttribute('data-word') }));
    }
    if (this.popover.hidden) return;
    if (this.data) this._renderData(this.data);
    else if (this.status.classList.contains('is-loading')) this.status.textContent = t('loadingDefinition');
    if (this.anchor) this.anchor.setAttribute('aria-label', t('wordLookupLabel', { word: this.anchor.getAttribute('data-word') }));
  };

  window.wordDefinitionController = new WordDefinitionController();
})();
