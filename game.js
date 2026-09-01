// ============================================================
// Dictionary: SCOWL-based English word list, length >= 3.
// See DICTIONARY_SOURCES.md before rebuilding the dictionary packs.
// ============================================================

// ============================================================
// Interface language
// ============================================================
var LANGUAGE_STORAGE_KEY = 'word-chain-loop:language:v1';
var UI_TEXT = {
  zh: {
    pageTitle: '词环 · Word Loop',
    puzzleMetadata: '游戏信息', languageLabel: '语言', difficultyLabel: '难度', gameModeLabel: '游戏模式', loopTarget: '词环目标', secondaryActions: '其他游戏操作', skipToGame: '跳到游戏内容',
    installApp: '安装应用', installComplete: '词环已经安装，可以像普通应用一样打开。', offlineReady: '离线资源准备完毕。',
    offlineStatus: '当前离线，游戏仍可继续；在线词义暂不可用。', onlineStatus: '网络已恢复。', updateReady: '新版本已经准备好。', refreshApp: '刷新',
    utilityLabel: '词环 · 单人', utilityCopy: '接住词尾，绕回词首',
    startBrand: '词环 · WORD LOOP', startEdition: '双字母接龙游戏', startWelcomeKicker: '欢迎来到文字的环路',
    startWelcomeCopy: '接住一个单词的最后两个字母，找到下一个词，最终绕回最初的两位。',
    startIntroKicker: '游戏简介', startIntroTitle: '让词尾成为下一步的开头。',
    startIntroCopy: '每次输入一个有效英文词，沿着末两位继续前进。用更少的词闭合环路，也可以在百关挑战中争取三星。',
    startGame: '开始游戏', aboutUs: '关于作者', login: '登录', comingSoon: '暂未开放',
    chooseModeKicker: '选择游戏方式', chooseModeTitle: '今天想怎样玩？',
    startCasualCopy: '自由选择难度，随时开始一个新词环。', startCampaignCopy: '挑战固定关卡、最大步数和三星目标。',
    workshopMode: '工坊', startWorkshopCopy: '设计、试玩并提交你自己的词环关卡。',
    backToWelcome: '← 返回', startFooterLeft: '词环 · 单人', startFooterRight: '从词尾出发，回到词首', home: '首页',
    aboutTitle: '关于作者', authorIntroTitle: '作者介绍',
    authorCopy: '一名 XJTU 统计专业的大二学生，喜欢英语。', aboutWhyTitle: '为什么做「词环」',
    aboutCopy: '高中时，我发明了词环这个游戏，那时只能在纸上玩。如今有了 AI 工具的帮助，我终于能把它搬到线上，与大家分享，也希望更多人能从游戏中感受到英语的趣味。',
    closeAbout: '关闭关于作者',
    editionNote: '把一个词的最后两个字母，交给下一个词。', gameName: '词环',
    casualMode: '休闲', campaignMode: '闯关',
    difficultyEasy: '简单', difficultyMedium: '标准', difficultyHard: '困难',
    easyDescription: '常用词 · 最多 3 次提示 · 较短词环',
    mediumDescription: '常用词 + 标准词 · 1 次提示 · 较长词环',
    hardDescription: '扩展词库 · 无提示 · 隐藏最短步数',
    currentLoop: '本局目标', loopHeading: '从两个字母出发，再回到同一处。',
    loopExplain: '每个新词，都要以前一个词的最后两个字母开头。',
    currentChain: '当前词链', starting: '正在开始…', enterNext: '接下一个词',
    mustBeginWith: '必须以', nextWordLabel: '下一个单词', wordPlaceholder: '输入英文单词…',
    submit: '接上这个词', availableWords: '本次提示 · 点击即可填入', shortestSolutions: '最短解法',
    showSolutions: '显示答案 · 练习模式', hideSolutions: '收起答案',
    puzzleNotes: '游戏手记', chainLength: '已用单词', minStepsLeft: '最少还需',
    minimumHidden: '最短步数已隐藏', bestRecord: '最佳纪录', newGame: '新游戏',
    howToPlay: '玩法介绍',
    rule1: '输入至少 3 个字母的有效英文词。',
    rule2: '新词要接住上一个词的最后两个字母。',
    rule3: '不能重复单词，也不能换个词形重复使用。',
    rule4: '让最后一个词的末两位回到起始词的前两位。',
    rule5: '用词越少越好；使用提示或答案后，本局记为练习。',
    letterKey: '颜色说明', wordHead: '单词开头', wordTail: '单词结尾', headTailOverlap: '开头与结尾重叠',
    cycleComplete: '词环完成', youWin: '你赢了！', playAgain: '再玩一次',
    noHints: '无提示', hintCounter: '提示 {remaining}/{limit}',
    loadingDictionary: '正在加载扩展词库…', dictionaryLoadFailed: '扩展词库加载失败，请检查网络后重试。',
    noStartWords: '当前难度没有符合质量要求的起始词。',
    startError: '游戏启动失败：{error}', onlyLetters: '只能输入英文字母。',
    minimumLength: '单词至少需要 3 个字母。', notInDictionary: '词库中没有：{word}',
    extendedWord: '“{word}”属于扩展词，请切换到更高难度。', alreadyUsed: '这个词已经用过：{word}',
    familyUsed: '“{lemma}”的同词根形式已经用过。', mustStart: '单词必须以“{prefix}”开头。',
    deadEnd: '“{word}”会走进死路：剩余可用词无法闭合词环。',
    hintsDisabled: '困难模式不提供提示。', noHintsRemaining: '本局的提示次数已经用完。',
    noValidWords: '从这里没有可用的有效单词，本次不消耗提示。',
    noMoreHintWords: '这个位置没有更多未显示的提示词，本次不消耗提示。',
    hintUsed: '已使用提示，本局现在记为练习。',
    solutionsRevealed: '已显示答案，本局现在记为练习。', noSolution: '没有找到解法。',
    solutionRoutes: '找到 {count} 条最短路线（每条 {words} 个词）：',
    solutionBestRoutes: '显示 {total} 条最短路线中质量较高的前 {shown} 条（每条 {words} 个词）：',
    completedCycle: '你用 {count} 个词完成了一个词环！',
    practiceRound: '练习局——本局使用了提示或答案。', newRecord: '这是该起始词的新无辅助纪录！',
    victory: '完成！{count} 个词组成了一个完整词环。',
    fatalTitle: '游戏加载失败', fatalHelp: '请打开浏览器控制台查看详细信息。',
    dictionaryEntry: '词条', closeDefinition: '关闭词义', chineseDefinition: '中文释义', englishDefinition: '英文解释',
    loadingDefinition: '正在查询词义…', translatingDefinition: '英文释义已找到，正在翻译单词…', definitionUnavailable: '暂未找到这个词的在线释义。请检查网络，或稍后再试。',
    chineseUnavailable: '暂无可靠中文翻译。', pronunciationUnavailable: '暂无音标',
    playPronunciation: '播放{label}发音', wordLookupLabel: '查看“{word}”的中英释义'
  },
  en: {
    pageTitle: 'Word Loop',
    puzzleMetadata: 'Puzzle metadata', languageLabel: 'Language', difficultyLabel: 'Difficulty', gameModeLabel: 'Game mode', loopTarget: 'Loop target', secondaryActions: 'Secondary game actions', skipToGame: 'Skip to game content',
    installApp: 'Install app', installComplete: 'Word Loop is installed and ready to launch like an app.', offlineReady: 'Offline play is ready.',
    offlineStatus: 'You are offline. The game still works; online definitions are unavailable.', onlineStatus: 'You are back online.', updateReady: 'A new version is ready.', refreshApp: 'Refresh',
    utilityLabel: 'Word Loop · Single player', utilityCopy: 'Connect the ending pair to the opening pair',
    startBrand: 'WORD LOOP', startEdition: 'A TWO-LETTER WORD CHAIN', startWelcomeKicker: 'Welcome to the circle of words',
    startWelcomeCopy: 'Catch the final two letters of one word, find the next, and make your way back to the opening pair.',
    startIntroKicker: 'About the game', startIntroTitle: 'Let every ending begin the next move.',
    startIntroCopy: 'Enter a valid English word and continue from its final pair. Close the loop in fewer words, or chase three stars across one hundred fixed challenges.',
    startGame: 'Start game', aboutUs: 'About the author', login: 'Log in', comingSoon: 'Coming soon',
    chooseModeKicker: 'Choose how to play', chooseModeTitle: 'How would you like to play today?',
    startCasualCopy: 'Choose a difficulty and begin a fresh loop whenever you like.', startCampaignCopy: 'Take on fixed levels, move limits, and three-star targets.',
    workshopMode: 'Workshop', startWorkshopCopy: 'Design, test, and submit your own Word Loop level.',
    backToWelcome: '← Back', startFooterLeft: 'WORD LOOP · SINGLE PLAYER', startFooterRight: 'Follow the ending. Return to the beginning.', home: 'Home',
    aboutTitle: 'About the author', authorIntroTitle: 'Author introduction',
    authorCopy: 'A second-year Statistics student at XJTU who loves English.', aboutWhyTitle: 'Why I made Word Loop',
    aboutCopy: 'I invented Word Loop in high school, when it could only be played on paper. With the help of AI tools, I can now bring it online, share it with everyone, and let more people discover how much fun English can be.',
    closeAbout: 'Close About the author',
    editionNote: 'Build a chain in which every word hands its final two letters to the next.', gameName: 'Word Loop',
    casualMode: 'Casual', campaignMode: 'Campaign',
    difficultyEasy: 'Easy', difficultyMedium: 'Medium', difficultyHard: 'Hard',
    easyDescription: 'Common words · up to 3 hints · shorter loops',
    mediumDescription: 'Common + standard words · 1 hint · longer loops',
    hardDescription: 'Extended vocabulary · no hints · minimum hidden',
    currentLoop: 'Current loop', loopHeading: 'Leave with two letters. Return with the same two.',
    loopExplain: 'Each word must begin with the final two letters of the word before it.',
    currentChain: 'Current chain', starting: 'Starting…', enterNext: 'Enter the next word',
    mustBeginWith: 'Must begin with', nextWordLabel: 'Next word', wordPlaceholder: 'Type a word…',
    submit: 'Add to chain', availableWords: 'Hint word · click to select', shortestSolutions: 'Shortest solutions',
    showSolutions: 'Show Solutions · practice', hideSolutions: 'Hide Solutions',
    puzzleNotes: 'Puzzle notes', chainLength: 'Chain Length', minStepsLeft: 'Min Steps Left',
    minimumHidden: 'Minimum Hidden', bestRecord: 'Best Record', newGame: 'New Game',
    howToPlay: 'How to play',
    rule1: 'Use a permitted English word of at least three letters.',
    rule2: 'Begin with the previous word’s final two letters.',
    rule3: 'Do not repeat a word or another inflection from the same word family.',
    rule4: 'Close the loop by returning to the first word’s opening pair.',
    rule5: 'Fewer words is better. Hints or solutions make the round practice-only.',
    letterKey: 'Letter key', wordHead: 'Word head', wordTail: 'Word tail', headTailOverlap: 'Head and tail overlap',
    cycleComplete: 'Cycle Complete!', youWin: 'You Win!', playAgain: 'Play Again',
    noHints: 'No Hints', hintCounter: 'Hint {remaining}/{limit}',
    loadingDictionary: 'Loading the extended dictionary…', dictionaryLoadFailed: 'The extended dictionary could not be loaded. Check your connection and try again.',
    noStartWords: 'No quality-controlled starting words are available for this mode.',
    startError: 'Error starting game: {error}', onlyLetters: 'Only English letters are allowed.',
    minimumLength: 'A word must have at least 3 letters.', notInDictionary: 'Not in dictionary: {word}',
    extendedWord: '“{word}” is an extended word. Try a harder difficulty to use it.', alreadyUsed: 'Already used: {word}',
    familyUsed: 'A form of “{lemma}” has already been used.', mustStart: 'The word must start with “{prefix}”.',
    deadEnd: 'Dead end: no permitted unused words can close the loop after “{word}”.',
    hintsDisabled: 'Hints are disabled in Hard mode.', noHintsRemaining: 'No hints remain in this round.',
    noValidWords: 'No valid word is available here. This attempt does not use a hint.',
    noMoreHintWords: 'No unseen hint words remain here. This attempt does not use a hint.',
    hintUsed: 'Hint used — this round is now practice-only.',
    solutionsRevealed: 'Solutions revealed — this round is now practice-only.', noSolution: 'No solution found.',
    solutionRoutes: '{count} shortest {routeWord} ({words} words):',
    solutionBestRoutes: 'Best {shown} of {total} shortest routes ({words} words):',
    completedCycle: 'Completed a perfect cycle of {count} words!',
    practiceRound: 'Practice round — hints or solutions were used.', newRecord: 'New unassisted record for this opening word!',
    victory: 'Victory! {count} words form a perfect loop!',
    fatalTitle: 'Game failed to load', fatalHelp: 'Please check the browser console for details.',
    dictionaryEntry: 'Dictionary entry', closeDefinition: 'Close definition', chineseDefinition: 'Chinese meaning', englishDefinition: 'English definition',
    loadingDefinition: 'Looking up this word…', translatingDefinition: 'English definition found. Translating the word into Chinese…', definitionUnavailable: 'No online definition is available for this word. Check your connection or try again later.',
    chineseUnavailable: 'Chinese translation is temporarily unavailable.', pronunciationUnavailable: 'No phonetic transcription',
    playPronunciation: 'Play {label} pronunciation', wordLookupLabel: 'View the Chinese and English definitions of “{word}”'
  }
};

var currentLanguage = 'zh';
try {
  var savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (savedLanguage === 'zh' || savedLanguage === 'en') currentLanguage = savedLanguage;
} catch (languageStorageError) { /* storage may be unavailable */ }

function t(key, params) {
  var table = UI_TEXT[currentLanguage] || UI_TEXT.zh;
  var value = table[key] === undefined ? (UI_TEXT.en[key] || key) : table[key];
  if (!params) return value;
  return value.replace(/\{(\w+)\}/g, function(match, name) {
    return params[name] === undefined ? match : String(params[name]);
  });
}

function applyLanguage(language) {
  currentLanguage = language === 'en' ? 'en' : 'zh';
  document.documentElement.lang = currentLanguage === 'zh' ? 'zh-CN' : 'en';
  document.title = t('pageTitle');

  var textNodes = document.querySelectorAll('[data-i18n]');
  for (var i = 0; i < textNodes.length; i++) {
    textNodes[i].textContent = t(textNodes[i].getAttribute('data-i18n'));
  }
  var placeholderNodes = document.querySelectorAll('[data-i18n-placeholder]');
  for (var j = 0; j < placeholderNodes.length; j++) {
    placeholderNodes[j].setAttribute('placeholder', t(placeholderNodes[j].getAttribute('data-i18n-placeholder')));
  }
  var ariaNodes = document.querySelectorAll('[data-i18n-aria]');
  for (var k = 0; k < ariaNodes.length; k++) {
    ariaNodes[k].setAttribute('aria-label', t(ariaNodes[k].getAttribute('data-i18n-aria')));
  }
  var languageButtons = document.querySelectorAll('.language-btn');
  for (var b = 0; b < languageButtons.length; b++) {
    languageButtons[b].classList.toggle('active', languageButtons[b].getAttribute('data-language') === currentLanguage);
    languageButtons[b].setAttribute('aria-pressed', languageButtons[b].getAttribute('data-language') === currentLanguage ? 'true' : 'false');
  }
  try { localStorage.setItem(LANGUAGE_STORAGE_KEY, currentLanguage); } catch (languageSaveError) { /* storage may be unavailable */ }
  if (typeof game !== 'undefined' && game && game.refreshLocalizedUI) game.refreshLocalizedUI();
  if (window.campaignController && window.campaignController.refreshLanguage) window.campaignController.refreshLanguage();
  if (window.wordDefinitionController && window.wordDefinitionController.refreshLanguage) window.wordDefinitionController.refreshLanguage();
  if (window.wordFeedbackController && window.wordFeedbackController.refreshLanguage) window.wordFeedbackController.refreshLanguage();
  if (window.achievementController && window.achievementController.refreshLanguage) window.achievementController.refreshLanguage();
  if (window.userSystemController && window.userSystemController.refreshLanguage) window.userSystemController.refreshLanguage();
  if (window.pwaController && window.pwaController.refreshLanguage) window.pwaController.refreshLanguage();
  if (window.workshopController && window.workshopController.refreshLanguage) window.workshopController.refreshLanguage();
}

// ============================================================
// Game Engine
// ============================================================
var WordChainGame = (function() {

  var MODE_CONFIG = {
    easy: {
      label: 'Easy', maxTier: 0, minRoute: 1, maxRoute: 2,
      hintUses: 3, hintWords: 8, showMinimum: true,
      descriptionKey: 'easyDescription'
    },
    medium: {
      label: 'Medium', maxTier: 1, minRoute: 2, maxRoute: 3,
      hintUses: 1, hintWords: 6, showMinimum: true,
      descriptionKey: 'mediumDescription'
    },
    hard: {
      label: 'Hard', maxTier: 2, minRoute: 3, maxRoute: 6,
      hintUses: 0, hintWords: 0, showMinimum: false,
      descriptionKey: 'hardDescription'
    }
  };

  function WordChainGame() {
    this.allDictionary = [];
    this.allWordSet = new Set();
    this.wordTiers = new Map();
    this.wordIsLemma = new Map();
    this.wordStartEligible = new Map();
    this.wordFeatured = new Map();
    this.wordLemmaRoots = new Map();
    this.dictionary = [];
    this.graph = null;       // Map<string, Map<string, string[]>>
    this.qualityGraph = null; // Featured canonical words used to rate puzzle difficulty.
    this.wordToEdge = null;  // Map<string, {from, to}>
    this.qualityClosersByTail = null; // Common canonical words grouped by final pair.
    this.startWord = null;
    this.chain = [];
    this.usedWords = null;
    this.startHead = null;
    this.currentRequired = null;
    this.targetGoal = null;
    this.difficulty = 'medium';
    this.record = 0;
    this.hintsVisible = false;
    this.assisted = false;
    this.hintUses = 0;
    this.hintHistoryByState = new Map();
    this.hintExhaustedStateKey = null;
    this.hintLimitOverride = null;
    this.hintWordsOverride = null;
    this.minimumMoves = 0;
    this.roundId = 0;
    this._completionEmittedForRound = null;
    this._processedDictionaryLength = 0;
    this._extendedDictionaryPromise = null;
    this.completionModeOverride = null;
    this.customLevelId = null;

    this.initDictionary();
    this.buildGraph();
  }

  WordChainGame.prototype.initDictionary = function() {
    var startIndex = this._processedDictionaryLength;
    for (var i = startIndex; i < DICTIONARY.length; i++) {
      var w = DICTIONARY[i].toLowerCase().trim();
      if (w.length < 3) continue;
      if (!/^[a-z]+$/.test(w)) continue;
      if (this.allWordSet.has(w)) continue;
      var tier = (typeof WORD_TIERS === 'string' && WORD_TIERS.charAt(i)) ?
        parseInt(WORD_TIERS.charAt(i), 10) : 2;
      this.allDictionary.push(w);
      this.allWordSet.add(w);
      this.wordTiers.set(w, isNaN(tier) ? 2 : tier);
      this.wordIsLemma.set(w, typeof WORD_FORMS !== 'string' || WORD_FORMS.charAt(i) === '0');
      this.wordStartEligible.set(w, typeof WORD_STARTS !== 'string' || WORD_STARTS.charAt(i) === '1');
      this.wordFeatured.set(w, typeof WORD_FEATURED !== 'string' || WORD_FEATURED.charAt(i) === '1');
      var lemmaIndex = (typeof WORD_LEMMA_IDS === 'string' && WORD_LEMMA_IDS.length >= (i + 1) * 4) ?
        parseInt(WORD_LEMMA_IDS.substr(i * 4, 4), 36) : i;
      this.wordLemmaRoots.set(w, DICTIONARY[lemmaIndex] || w);
    }
    this._processedDictionaryLength = DICTIONARY.length;
    console.log('Dictionary loaded: ' + this.allDictionary.length + ' words');
  };

  WordChainGame.prototype.isDifficultyAvailable = function(diff) {
    if (!MODE_CONFIG[diff]) return false;
    var loadedTier = DICTIONARY_META && typeof DICTIONARY_META.loadedThroughTier === 'number' ?
      DICTIONARY_META.loadedThroughTier : 2;
    return MODE_CONFIG[diff].maxTier <= loadedTier;
  };

  WordChainGame.prototype._mergeExtendedDictionaryPack = function() {
    var pack = window.WORD_LOOP_EXTENDED_DICTIONARY_PACK;
    if (!pack || !Array.isArray(pack.words)) throw new Error('Extended dictionary pack is missing');
    if (pack.tiers.length !== pack.words.length || pack.forms.length !== pack.words.length ||
        pack.starts.length !== pack.words.length || pack.featured.length !== pack.words.length ||
        pack.lemmaIds.length !== pack.words.length * 4) {
      throw new Error('Extended dictionary metadata is not aligned');
    }
    DICTIONARY = DICTIONARY.concat(pack.words);
    WORD_TIERS += pack.tiers;
    WORD_FORMS += pack.forms;
    WORD_STARTS += pack.starts;
    WORD_FEATURED += pack.featured;
    WORD_LEMMA_IDS += pack.lemmaIds;
    DICTIONARY_META.loadedThroughTier = pack.loadedThroughTier;
    this.initDictionary();
    window.WORD_LOOP_EXTENDED_DICTIONARY_PACK = null;
  };

  WordChainGame.prototype.ensureDifficultyAvailable = function(diff) {
    var self = this;
    if (!MODE_CONFIG[diff]) return Promise.reject(new Error('Unknown difficulty: ' + diff));
    if (this.isDifficultyAvailable(diff)) return Promise.resolve();
    if (this._extendedDictionaryPromise) return this._extendedDictionaryPromise;
    this.showMessageKey('loadingDictionary', 'info');
    this._extendedDictionaryPromise = new Promise(function(resolve, reject) {
      var script = document.createElement('script');
      script.src = 'dictionary-extended.js?v=1';
      script.onload = function() {
        try {
          self._mergeExtendedDictionaryPack();
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      script.onerror = function() { reject(new Error('Failed to load dictionary-extended.js')); };
      document.head.appendChild(script);
    }).catch(function(error) {
      self._extendedDictionaryPromise = null;
      throw error;
    });
    return this._extendedDictionaryPromise;
  };

  WordChainGame.prototype.buildGraph = function() {
    this.graph = new Map();
    this.qualityGraph = new Map();
    this.wordToEdge = new Map();
    this.qualityClosersByTail = new Map();
    this.dictionary = [];
    var maxTier = MODE_CONFIG[this.difficulty].maxTier;

    for (var i = 0; i < this.allDictionary.length; i++) {
      var word = this.allDictionary[i];
      if (this.wordTiers.get(word) > maxTier) continue;
      this.dictionary.push(word);
      var head = word.substring(0, 2);
      var tail = word.substring(word.length - 2);
      this.wordToEdge.set(word, { from: head, to: tail });

      // Editorial visibility is independent from start eligibility: a word
      // can be a fair answer/hint without also being selected as an opening.
      if (this.wordIsLemma.get(word) && this.wordFeatured.get(word) && word.length <= 12) {
        if (!this.qualityClosersByTail.has(tail)) this.qualityClosersByTail.set(tail, []);
        this.qualityClosersByTail.get(tail).push(word);
        if (!this.qualityGraph.has(head)) this.qualityGraph.set(head, new Map());
        var qualityEdges = this.qualityGraph.get(head);
        if (!qualityEdges.has(tail)) qualityEdges.set(tail, []);
        qualityEdges.get(tail).push(word);
      }

      if (!this.graph.has(head)) {
        this.graph.set(head, new Map());
      }
      var inner = this.graph.get(head);
      if (!inner.has(tail)) {
        inner.set(tail, []);
      }
      inner.get(tail).push(word);
    }

    var edgeCount = 0;
    var values = this.graph.values();
    var entry = values.next();
    while (!entry.done) {
      edgeCount += entry.value.size;
      entry = values.next();
    }
    this.distances = this._buildDistances(this.graph);
    this.qualityDistances = this._buildDistances(this.qualityGraph);
    this._startCandidates = null;
    console.log(
      MODE_CONFIG[this.difficulty].label + ' graph: ' + this.dictionary.length +
      ' words, ' + this.graph.size + ' nodes, ' + edgeCount + ' unique edges'
    );
  };

  WordChainGame.prototype._buildDistances = function(graph) {
    var table = {};
    var starts = graph.keys();
    var startEntry = starts.next();
    while (!startEntry.done) {
      var start = startEntry.value;
      var row = {};
      row[start] = 0;
      var queue = [start];
      for (var q = 0; q < queue.length; q++) {
        var node = queue[q];
        var edges = graph.get(node);
        if (!edges) continue;
        var nextNodes = edges.keys();
        var next = nextNodes.next();
        while (!next.done) {
          if (row[next.value] === undefined) {
            row[next.value] = row[node] + 1;
            queue.push(next.value);
          }
          next = nextNodes.next();
        }
      }
      table[start] = row;
      startEntry = starts.next();
    }
    return table;
  };

  // Find a real path while excluding words already used in this round.
  WordChainGame.prototype.findShortestPath = function(fromNode, toNode, excludedWords, excludedLemmas) {
    var exclude = excludedWords || new Set();
    var lemmaExclude = excludedLemmas || new Set();
    if (fromNode === toNode) return [];

    var queue = [{ node: fromNode, path: [] }];
    var visitedNodes = new Set();
    visitedNodes.add(fromNode);

    while (queue.length > 0) {
      var current = queue.shift();
      var edges = this.graph.get(current.node);
      if (!edges) continue;

      var edgeEntries = edges.entries();
      var e = edgeEntries.next();
      while (!e.done) {
        var nextNode = e.value[0];
        var words = e.value[1];

        var available = [];
        for (var k = 0; k < words.length; k++) {
          if (!exclude.has(words[k]) && !lemmaExclude.has(this.wordLemmaRoots.get(words[k]))) {
            available.push(words[k]);
          }
        }
        if (available.length === 0) { e = edgeEntries.next(); continue; }

        var newPath = current.path.concat([available[0]]);
        if (nextNode === toNode) return newPath;

        if (!visitedNodes.has(nextNode)) {
          visitedNodes.add(nextNode);
          queue.push({ node: nextNode, path: newPath });
        }
        e = edgeEntries.next();
      }
    }
    return null;
  };


  WordChainGame.prototype._countShortestRoutes = function(node, goal, remaining, cap, memo, graph, distances) {
    if (remaining === 0) return node === goal ? 1 : 0;
    graph = graph || this.graph;
    distances = distances || this.distances;
    var key = node + '|' + goal + '|' + remaining;
    if (memo[key] !== undefined) return memo[key];
    var total = 0;
    var edges = graph.get(node);
    if (!edges) return 0;
    var self = this;
    edges.forEach(function(words, nextNode) {
      if (total >= cap) return;
      if (!distances[nextNode] || distances[nextNode][goal] !== remaining - 1) return;
      total += words.length * self._countShortestRoutes(
        nextNode, goal, remaining - 1, cap, memo, graph, distances
      );
      if (total > cap) total = cap;
    });
    memo[key] = total;
    return total;
  };

  // Count distinct familiar closing words that are reachable on a shortest
  // route from this candidate. This prevents technically valid starts whose
  // opening pair can only be reached through obscure final words.
  WordChainGame.prototype._countReachableQualityClosers = function(fromNode, goal, remaining, startLemma, distances) {
    if (remaining < 1) return 0;
    var closers = this.qualityClosersByTail.get(goal) || [];
    var distanceRow = (distances || this.distances)[fromNode];
    if (!distanceRow) return 0;
    var closerLemmas = new Set();
    for (var i = 0; i < closers.length; i++) {
      var closer = closers[i];
      var closerEdge = this.wordToEdge.get(closer);
      var closerLemma = this.wordLemmaRoots.get(closer);
      if (!closerEdge || closerLemma === startLemma) continue;
      if (distanceRow[closerEdge.from] === remaining - 1) closerLemmas.add(closerLemma);
    }
    return closerLemmas.size;
  };

  WordChainGame.prototype._buildStartCandidates = function(relaxed) {
    var config = MODE_CONFIG[this.difficulty];
    var maxStartTier = this.difficulty === 'hard' ? 1 : 0;
    var minimumBranch = this.difficulty === 'easy' ? 12 : (this.difficulty === 'medium' ? 8 : 4);
    var minimumQualityClosers = this.difficulty === 'easy' ? 3 : 2;
    var candidates = [];
    var routeMemo = {};
    for (var i = 0; i < this.dictionary.length; i++) {
      var word = this.dictionary[i];
      if (this.wordTiers.get(word) > maxStartTier) continue;
      if (!this.wordIsLemma.get(word)) continue;
      if (!this.wordStartEligible.get(word)) continue;
      if (word.length < 4 || word.length > 10) continue;
      var head = word.substring(0, 2);
      var tail = word.substring(word.length - 2);
      if (head === tail) continue;
      var distance = this.distances[tail] && this.distances[tail][head];
      if (distance === undefined || distance < 1) continue;
      // The full Hard graph is deliberately dense, so its absolute shortest
      // path is often two moves through obscure words. Rate Hard openings on
      // the featured-word graph instead; rare shortcuts remain legal, but no
      // longer make a rich puzzle look too easy to the picker.
      var routeGraph = this.difficulty === 'hard' ? this.qualityGraph : this.graph;
      var routeDistances = this.difficulty === 'hard' ? this.qualityDistances : this.distances;
      var challengeDistance = routeDistances[tail] && routeDistances[tail][head];
      if (challengeDistance === undefined || challengeDistance < 1) continue;
      if (!relaxed && (challengeDistance < config.minRoute || challengeDistance > config.maxRoute)) continue;

      var outgoing = this.graph.get(tail);
      var branchWords = 0;
      var commonBranchWords = 0;
      var self = this;
      if (outgoing) outgoing.forEach(function(words) {
        branchWords += words.length;
        for (var j = 0; j < words.length; j++) {
          if (self.wordTiers.get(words[j]) === 0) commonBranchWords++;
        }
      });
      if (branchWords < minimumBranch) continue;
      if (commonBranchWords < 6) continue;

      var routeCount = this._countShortestRoutes(
        tail, head, challengeDistance, 201, routeMemo, routeGraph, routeDistances
      );
      if (routeCount < 2 || routeCount > 200) continue;
      var qualityCloserCount = this._countReachableQualityClosers(
        tail, head, challengeDistance, this.wordLemmaRoots.get(word), routeDistances
      );
      if (qualityCloserCount < minimumQualityClosers) continue;
      candidates.push({
        word: word, head: head, tail: tail,
        pathLength: distance, totalLength: distance + 1, challengeLength: challengeDistance,
        routeCount: routeCount, qualityCloserCount: qualityCloserCount
      });
    }
    return candidates;
  };

  WordChainGame.prototype.pickStartWord = function() {
    if (!this._startCandidates) {
      this._startCandidates = this._buildStartCandidates(false);
      if (this._startCandidates.length === 0) {
        this._startCandidates = this._buildStartCandidates(true);
      }
      if (console && console.log) {
        console.log(this.difficulty + ' start candidates: ' + this._startCandidates.length);
      }
    }
    if (this._startCandidates.length === 0) {
      throw new Error(t('noStartWords'));
    }
    return this._startCandidates[Math.floor(Math.random() * this._startCandidates.length)];
  };

  // Start a new game
  WordChainGame.prototype.newGame = function() {
    var startTime = Date.now ? Date.now() : 0;
    try {
      this.chain = [];
      this.usedWords = new Set();
      this.usedLemmas = new Set();
      if (!this._usedStarts) this._usedStarts = [];

      var customPick = this.customStartOverride;
      var replayWord = this._replayWord;
      this._replayWord = null;
      var pick;
      if (customPick && customPick.word) {
        pick = {
          word: customPick.word,
          head: customPick.head || customPick.word.slice(0, 2),
          tail: customPick.tail || customPick.word.slice(-2),
          pathLength: Number(customPick.pathLength),
          totalLength: 1 + Number(customPick.pathLength)
        };
      } else if (replayWord && this.wordToEdge.has(replayWord)) {
        var replayEdge = this.wordToEdge.get(replayWord);
        pick = {
          word: replayWord,
          head: replayEdge.from,
          tail: replayEdge.to,
          pathLength: this.distances[replayEdge.to][replayEdge.from],
          totalLength: 1 + this.distances[replayEdge.to][replayEdge.from]
        };
      } else {
        pick = this.pickStartWord();
        if (this._usedStarts.length > 0 && this._usedStarts.indexOf(pick.word) !== -1) {
          // Retry up to 20 times to get a fresh start
          for (var retries = 0; retries < 20; retries++) {
            var nextPick = this.pickStartWord();
            if (this._usedStarts.indexOf(nextPick.word) === -1) {
              pick = nextPick;
              break;
            }
          }
        }
        this._usedStarts.push(pick.word);
        if (this._usedStarts.length > 30) this._usedStarts.shift();
      }
      this.startWord = pick.word;
      this.startHead = pick.head;
      this.targetGoal = pick.head;
      this.currentRequired = pick.tail;
      this.minimumMoves = pick.pathLength;
      this.roundId++;
      this._completionEmittedForRound = null;
      this.chain.push(pick.word);
      this.usedWords.add(pick.word);
      this.usedLemmas.add(this.wordLemmaRoots.get(pick.word) || pick.word);
      this.hintsVisible = false;
      this.assisted = false;
      this.hintUses = 0;
      this.hintHistoryByState = new Map();
      this.hintExhaustedStateKey = null;
      this.loadRecord();

      if (console && console.log) {
        console.log(
          'Start: "' + pick.word + '" (' + pick.head + ' -> ' + pick.tail +
          '), need ' + pick.pathLength + ' more word(s) to close loop'
        );
      }

      // Reset and show the solution button for this game.
      document.getElementById('solveSection').style.display = 'block';
      document.getElementById('solvePanel').style.display = 'none';
      this._solution = null;

      this.render();
      // Stats update deferred — avoid counting paths on newGame
      this.updateStats();

      document.getElementById('wordInput').disabled = false;
      document.getElementById('submitBtn').disabled = false;
      this._updateHintButton();
      document.getElementById('wordInput').value = this.currentRequired;
      var ni = document.getElementById('wordInput');
      ni.focus();
      ni.setSelectionRange(2, ni.value.length);
      document.getElementById('winOverlay').classList.remove('show');
      this.hideMessage();
      this.hideHints();
      // Reset solution panel
      this._solution = null;
      document.getElementById('solveSection').style.display = 'block';
      document.getElementById('solvePanel').style.display = 'none';
      document.getElementById('solveBtn').textContent = t('showSolutions');
    } catch (err) {
      if (console && console.error) console.error('newGame error:', err);
      this.showMessageKey('startError', 'error', { error: err.message });
    }
    if (console && console.log) {
      var elapsed = Date.now() - startTime;
      console.log('newGame took ' + elapsed + 'ms');
    }
  };

  // Restart with the same initial word.
  WordChainGame.prototype.playAgain = function() {
    if (!this.startWord) {
      this.newGame();
      return;
    }
    this._replayWord = this.startWord;
    this.newGame();
  };

  // Submit a word
  WordChainGame.prototype.submitWord = function(word) {
    word = word.toLowerCase().trim();

    // Validation 1: letters only
    if (!/^[a-z]+$/.test(word)) {
      this.showMessageKey('onlyLetters', 'error');
      return false;
    }

    // Validation 2: length >= 3
    if (word.length < 3) {
      this.showMessageKey('minimumLength', 'error');
      return false;
    }

    // Validation 3: in the source dictionary and permitted in this mode
    if (!this.allWordSet.has(word)) {
      this.showMessageKey('notInDictionary', 'error', { word: word });
      return false;
    }
    if (!this.wordToEdge.has(word)) {
      this.showMessageKey('extendedWord', 'error', { word: word });
      return false;
    }

    // Validation 4: not used yet
    if (this.usedWords.has(word)) {
      this.showMessageKey('alreadyUsed', 'error', { word: word });
      return false;
    }
    var lemma = this.wordLemmaRoots.get(word);
    if (this.usedLemmas.has(lemma)) {
      this.showMessageKey('familyUsed', 'error', { lemma: lemma });
      return false;
    }

    // Validation 5: starts with correct 2 letters
    var head = word.substring(0, 2);
    if (head !== this.currentRequired) {
      this.showMessageKey('mustStart', 'error', { prefix: this.currentRequired });
      return false;
    }

    // Validation 6: a path still exists using permitted, unused words
    var tail = word.substring(word.length - 2);
    if (tail !== this.targetGoal) {
      var excludedAfterMove = new Set(this.usedWords);
      excludedAfterMove.add(word);
      var excludedLemmasAfterMove = new Set(this.usedLemmas);
      excludedLemmasAfterMove.add(lemma);
      if (!this.findShortestPath(tail, this.targetGoal, excludedAfterMove, excludedLemmasAfterMove)) {
        this.showMessageKey('deadEnd', 'error', { word: word });
        return false;
      }
    }

    // Valid -- accept the word
    this.chain.push(word);
    this.usedWords.add(word);
    this.usedLemmas.add(lemma);
    this.currentRequired = tail;

    // Check win condition
    if (tail === this.targetGoal) {
      this.onWin();
      return true;
    }

    this.render();
    // Also use quick stats on win (no heavy path counting needed)
    this.updateStats();
    this.hideMessage();
    this.hideHints();
    document.getElementById('wordInput').value = tail;
    // select the auto-filled prefix so typing replaces it
    var inp = document.getElementById('wordInput');
    inp.focus();
    inp.setSelectionRange(2, inp.value.length);
    return true;
  };

  // Win handler
  WordChainGame.prototype.onWin = function() {
    var len = this.chain.length;
    var newRecord = false;
    if (!this.assisted && (this.record === 0 || len < this.record)) {
      this.record = len;
      newRecord = true;
      this.saveRecord();
    }

    this.render();
    // Also use quick stats on win (no heavy path counting needed)
    this.updateStats();
    document.getElementById('wordInput').disabled = true;
    document.getElementById('submitBtn').disabled = true;
    document.getElementById('hintBtn').disabled = true;

    this._lastWinNewRecord = newRecord;
    this._renderWinSummary(newRecord);

    document.getElementById('winOverlay').classList.add('show');
    this.showMessageKey('victory', 'success', { count: len });
    this.emitCompletion({
      mode: this.completionModeOverride || 'casual',
      moves: Math.max(0, len - 1),
      minimumMoves: this.minimumMoves,
      assisted: this.assisted,
      customLevelId: this.customLevelId
    });
  };

  WordChainGame.prototype.emitCompletion = function(result) {
    if (this._completionEmittedForRound === this.roundId) return;
    this._completionEmittedForRound = this.roundId;
    result = result || {};
    window.dispatchEvent(new CustomEvent('wordloop:completed', { detail: {
      roundId: this.roundId,
      mode: result.mode || 'casual',
      startWord: this.startWord,
      moves: Number(result.moves) || 0,
      minimumMoves: Number(result.minimumMoves) || 0,
      assisted: !!result.assisted,
      campaignLevelId: result.campaignLevelId || null,
      customLevelId: result.customLevelId || null
    }}));
  };

  WordChainGame.prototype._renderWinSummary = function(newRecord) {
    var len = this.chain.length;
    var summaryParts = [];
    for (var i = 0; i < this.chain.length; i++) {
      if (i === 0) {
        summaryParts.push('<span class=\"accent-word\">' + this.chain[i] + '</span>');
      } else if (i === len - 1) {
        summaryParts.push(' &rarr; <span class=\"last-word\">' + this.chain[i] + '</span>');
      } else {
        summaryParts.push(' &rarr; ' + this.chain[i]);
      }
    }
    document.getElementById('winSummary').innerHTML =
      t('completedCycle', { count: '<strong>' + len + '</strong>' }) + '<br>' +
      summaryParts.join('') +
      (this.assisted ? '<br><small>' + t('practiceRound') + '</small>' :
        (newRecord ? '<br><small>' + t('newRecord') + '</small>' : ''));
  };

  // Hint system
  WordChainGame.prototype.getHints = function(maxHints) {
    if (maxHints === undefined) maxHints = this.hintWordsOverride === null ?
      MODE_CONFIG[this.difficulty].hintWords : this.hintWordsOverride;
    var edges = this.graph.get(this.currentRequired);
    if (!edges) return [];

    var hints = [];
    var edgeEntries = edges.entries();
    var e = edgeEntries.next();
    while (!e.done) {
      var words = e.value[1];
      for (var k = 0; k < words.length; k++) {
        var w = words[k];
        if (this.usedWords.has(w)) continue;
        var lemma = this.wordLemmaRoots.get(w);
        if (this.usedLemmas.has(lemma)) continue;
        var tail = w.substring(w.length - 2);
        var exclude = new Set(this.usedWords);
        exclude.add(w);
        var lemmaExclude = new Set(this.usedLemmas);
        lemmaExclude.add(lemma);
        if (tail === this.targetGoal || this.findShortestPath(tail, this.targetGoal, exclude, lemmaExclude)) {
          hints.push(w);
        }
      }
      e = edgeEntries.next();
    }
    var self = this;
    hints.sort(function(a, b) {
      return Number(!self.wordFeatured.get(a)) - Number(!self.wordFeatured.get(b)) ||
        self.wordTiers.get(a) - self.wordTiers.get(b) || a.length - b.length || a.localeCompare(b);
    });
    return maxHints === null ? hints : hints.slice(0, maxHints);
  };

  WordChainGame.prototype._hintStateKey = function() {
    return this.chain.join('|') + '>' + this.currentRequired + '>' + this.targetGoal;
  };

  WordChainGame.prototype.toggleHints = function() {
    var config = MODE_CONFIG[this.difficulty];
    var hintLimit = this.hintLimitOverride === null ? config.hintUses : this.hintLimitOverride;
    if (hintLimit === 0) {
      this.showMessageKey('hintsDisabled', 'info');
      return;
    }
    if (this.hintUses >= hintLimit) {
      this.showMessageKey('noHintsRemaining', 'info');
      return;
    }

    var stateKey = this._hintStateKey();
    var hints = this.getHints(null);
    if (hints.length === 0) {
      this.hintExhaustedStateKey = stateKey;
      this.hideHints();
      this.showMessageKey('noValidWords', 'info');
      return;
    }

    var shown = this.hintHistoryByState.get(stateKey);
    if (!shown) {
      shown = new Set();
      this.hintHistoryByState.set(stateKey, shown);
    }
    var nextHint = null;
    for (var h = 0; h < hints.length; h++) {
      if (!shown.has(hints[h])) {
        nextHint = hints[h];
        break;
      }
    }
    if (!nextHint) {
      this.hintExhaustedStateKey = stateKey;
      this.hideHints();
      this.showMessageKey('noMoreHintWords', 'info');
      return;
    }

    this.hintsVisible = true;
    this.hintUses++;
    this.assisted = true;
    shown.add(nextHint);
    this.hintExhaustedStateKey = null;
    this._updateHintButton();
    var panel = document.getElementById('hintsPanel');
    var container = document.getElementById('hintWords');
    var hintButton = document.createElement('button');
    hintButton.type = 'button';
    hintButton.className = 'hint-word';
    hintButton.textContent = nextHint;
    hintButton.addEventListener('click', function() { game.useHint(nextHint); });
    container.replaceChildren(hintButton);
    panel.classList.add('show');
    this.showMessageKey('hintUsed', 'info');
  };

  WordChainGame.prototype._updateHintButton = function() {
    var button = document.getElementById('hintBtn');
    var limit = this.hintLimitOverride === null ? MODE_CONFIG[this.difficulty].hintUses : this.hintLimitOverride;
    var exhausted = this.startWord && this.hintExhaustedStateKey === this._hintStateKey();
    button.disabled = limit === 0 || this.hintUses >= limit || exhausted;
    button.textContent = limit === 0 ? t('noHints') :
      t('hintCounter', { remaining: Math.max(0, limit - this.hintUses), limit: limit });
  };

  WordChainGame.prototype.hideHints = function() {
    this.hintsVisible = false;
    document.getElementById('hintsPanel').classList.remove('show');
    if (this.startWord) this._updateHintButton();
  };

  // Show every shortest cycle from this game's initial word.
  WordChainGame.prototype.showSolution = function() {
    // Compute the solutions once and cache them for this game.
    if (!this._solution) {
      this._solution = this._computeShortestCycles();
    }
    var panel = document.getElementById('solvePanel');
    if (panel.style.display === 'block') {
      panel.style.display = 'none';
      document.getElementById('solveBtn').textContent = t('showSolutions');
      return;
    }
    this.assisted = true;
    panel.style.display = 'block';
    panel.innerHTML = this._solution;
    document.getElementById('solveBtn').textContent = t('hideSolutions');
    this.showMessageKey('solutionsRevealed', 'info');
  };

  WordChainGame.prototype._formatSolutionWord = function(word) {
    var parts = [];
    for (var i = 0; i < word.length; i++) {
      var inHead = i < 2;
      var inTail = i >= word.length - 2;
      var cls = inHead && inTail ? 'sw-overlap' :
        (inHead ? 'sw-head' : (inTail ? 'sw-tail' : 'sw-body'));
      if (parts.length > 0 && parts[parts.length - 1].cls === cls) {
        parts[parts.length - 1].text += word.charAt(i);
      } else {
        parts.push({ cls: cls, text: word.charAt(i) });
      }
    }
    var html = '<span class=\"solution-word lookup-word\" data-word=\"' + word + '\" tabindex=\"0\" role=\"button\" aria-label=\"' + t('wordLookupLabel', { word: word }) + '\">';
    for (var j = 0; j < parts.length; j++) {
      html += '<span class=\"' + parts[j].cls + '\">' + parts[j].text + '</span>';
    }
    return html + '</span>';
  };

  // Enumerate every shortest cycle from the initial word back to itself.
  WordChainGame.prototype._computeShortestCycles = function() {
    var start = this.startWord;
    var tail = start.substring(start.length - 2);
    var goal = this.targetGoal;

    if (!this.distances[tail] || this.distances[tail][goal] === undefined) {
      return t('noSolution');
    }

    var steps = this.distances[tail][goal];
    var solutions = [];
    var self = this;
    var solutionScanLimit = 500;
    var solutionDisplayLimit = 50;

    function walk(node, remaining, path, usedLemmaSet) {
      if (solutions.length >= solutionScanLimit) return;
      if (remaining === 0) {
        if (node === goal) solutions.push(path.slice());
        return;
      }
      var edges = self.graph.get(node);
      if (!edges) return;
      edges.forEach(function(words, nextNode) {
        if (solutions.length >= solutionScanLimit) return;
        if (!self.distances[nextNode] || self.distances[nextNode][goal] !== remaining - 1) return;
        for (var i = 0; i < words.length; i++) {
          if (solutions.length >= solutionScanLimit) break;
          if (words[i] === start) continue;
          var lemma = self.wordLemmaRoots.get(words[i]);
          if (usedLemmaSet.has(lemma)) continue;
          usedLemmaSet.add(lemma);
          path.push(words[i]);
          walk(nextNode, remaining - 1, path, usedLemmaSet);
          path.pop();
          usedLemmaSet.delete(lemma);
        }
      });
    }

    var solutionLemmas = new Set();
    solutionLemmas.add(this.wordLemmaRoots.get(start));
    walk(tail, steps, [start], solutionLemmas);
    solutions.sort(function(a, b) {
      function qualityScore(route) {
        var score = 0;
        for (var r = 1; r < route.length; r++) {
          score += self.wordTiers.get(route[r]) * 1000 + route[r].length;
        }
        return score;
      }
      return qualityScore(a) - qualityScore(b) || a.join('|').localeCompare(b.join('|'));
    });
    var displayedSolutions = solutions.slice(0, solutionDisplayLimit);
    var routeTitle;
    if (solutions.length > solutionDisplayLimit) {
      routeTitle = t('solutionBestRoutes', {
        shown: displayedSolutions.length, total: solutions.length, words: steps + 1
      });
    } else {
      routeTitle = t('solutionRoutes', {
        count: displayedSolutions.length, words: steps + 1,
        routeWord: displayedSolutions.length === 1 ? 'route' : 'routes'
      });
    }
    var html = '<p class=\"solution-title\">' + routeTitle + '</p>';
    for (var i = 0; i < displayedSolutions.length; i++) {
      var cycle = displayedSolutions[i];
      html += '<div class=\"solution-row solve-chain\">';
      for (var j = 0; j < cycle.length; j++) {
        if (j > 0) html += '<span class=\"solution-link\"><span class=\"sw-arrow\">&rarr;</span>' + self._formatSolutionWord(cycle[j]) + '</span>';
        else html += self._formatSolutionWord(cycle[j]);
      }
      html += '</div>';
    }
    return html;
  };

  WordChainGame.prototype.useHint = function(word) {
    document.getElementById('wordInput').value = word;
    document.getElementById('wordInput').focus();
  };

  // UI rendering
  WordChainGame.prototype._formatChainWord = function(word, isFirst, isLast) {
    if (!word || word.length < 4) return word;
    var head = word.slice(0, 2);
    var middle = word.slice(2, -2);
    var tail = word.slice(-2);
    var html = isFirst ? '<span class="chain-origin">' + head + '</span>' : head;
    html += middle;
    html += isLast ? '<span class="chain-handoff">' + tail + '</span>' : tail;
    return html;
  };

  WordChainGame.prototype.render = function() {
    document.getElementById('targetCard').style.display = 'block';
    document.getElementById('targetStart').textContent = this.currentRequired;
    document.getElementById('targetGoal').textContent = this.targetGoal;

    var chainDiv = document.getElementById('chainWords');
    var html = '';
    for (var i = 0; i < this.chain.length; i++) {
      var cls = i === 0 ? 'chain-word first' : 'chain-word';
      html += '<span class="' + cls + ' lookup-word" data-word="' + this.chain[i] + '" tabindex="0" role="button" aria-label="' + t('wordLookupLabel', { word: this.chain[i] }) + '">' +
        this._formatChainWord(this.chain[i], i === 0, i === this.chain.length - 1) + '</span>';
      if (i < this.chain.length - 1) {
        html += '<span class="chain-arrow">&rarr;</span>';
      }
    }
    if (this.currentRequired !== this.targetGoal || this.chain.length === 1) {
      html += '<span class="chain-arrow">&rarr;</span><span class="chain-question">?</span>';
    }
    chainDiv.innerHTML = html;

    document.getElementById('currentReq').style.display = 'flex';
    document.getElementById('currentPrefix').textContent = this.currentRequired;
  };

  WordChainGame.prototype.updateStats = function() {
    document.getElementById('statLength').textContent = this.chain.length;
    document.getElementById('statRecord').textContent = this.record > 0 ? this.record : '--';

    if (!this.currentRequired || !this.targetGoal) {
      document.getElementById('statMinRemain').textContent = '--';
      return;
    }

    this._updateMinimumStat();
  };

  WordChainGame.prototype._updateMinimumStat = function() {
    var config = MODE_CONFIG[this.difficulty];
    var value = document.getElementById('statMinRemain');
    var label = document.getElementById('statMinLabel');
    if (!config.showMinimum) {
      value.textContent = '?';
      label.textContent = t('minimumHidden');
      return;
    }
    label.textContent = t('minStepsLeft');
    var path = this.findShortestPath(
      this.currentRequired, this.targetGoal, this.usedWords, this.usedLemmas
    );
    value.textContent = path ? path.length : '--';
  };

  WordChainGame.prototype.showMessage = function(text, type) {
    var el = document.getElementById('message');
    el.textContent = text;
    el.className = 'message show ' + type;
  };

  WordChainGame.prototype.showMessageKey = function(key, type, params) {
    this._lastMessage = { key: key, type: type, params: params || null };
    this.showMessage(t(key, params), type);
  };

  WordChainGame.prototype.hideMessage = function() {
    this._lastMessage = null;
    document.getElementById('message').className = 'message';
  };

  WordChainGame.prototype.loadRecord = function() {
    var key = 'word-chain-loop:record:v3:' + this.difficulty + ':' + this.startWord;
    var saved = 0;
    try { saved = parseInt(localStorage.getItem(key) || '0', 10); } catch (err) { saved = 0; }
    this.record = isNaN(saved) ? 0 : saved;
    document.getElementById('statRecord').textContent = this.record > 0 ? this.record : '--';
  };

  WordChainGame.prototype.saveRecord = function() {
    var key = 'word-chain-loop:record:v3:' + this.difficulty + ':' + this.startWord;
    try { localStorage.setItem(key, String(this.record)); } catch (err) { /* storage may be unavailable */ }
    window.dispatchEvent(new CustomEvent('wordloop:progress-changed'));
  };

  WordChainGame.prototype.setDifficulty = function(diff) {
    var self = this;
    if (!MODE_CONFIG[diff]) return Promise.resolve(false);
    return this.ensureDifficultyAvailable(diff).then(function() {
      self.difficulty = diff;
      self._usedStarts = [];
      document.getElementById('modeDescription').textContent = t(MODE_CONFIG[diff].descriptionKey);
      self.buildGraph();
      self.newGame();
      return true;
    });
  };

  WordChainGame.prototype.refreshLocalizedUI = function() {
    var solutionVisible = document.getElementById('solvePanel').style.display === 'block';
    document.getElementById('modeDescription').textContent = t(MODE_CONFIG[this.difficulty].descriptionKey);
    document.getElementById('solveBtn').textContent =
      solutionVisible ? t('hideSolutions') : t('showSolutions');
    if (this.startWord) {
      this._updateHintButton();
      this._updateMinimumStat();
    }
    if (this._lastMessage) {
      this.showMessage(t(this._lastMessage.key, this._lastMessage.params), this._lastMessage.type);
    }
    this._solution = null;
    if (solutionVisible) {
      this._solution = this._computeShortestCycles();
      document.getElementById('solvePanel').innerHTML = this._solution;
    }
    if (document.getElementById('winOverlay').classList.contains('show')) {
      this._renderWinSummary(!!this._lastWinNewRecord);
    }
  };

  return WordChainGame;
})();

// ============================================================
// Initialize
// ============================================================
try {
  applyLanguage(currentLanguage);
  var game = new WordChainGame();
  applyLanguage(currentLanguage);

  document.getElementById('submitBtn').addEventListener('click', function() {
    var input = document.getElementById('wordInput');
    var word = input.value;
    if (!word) return;
    var ok = game.submitWord(word);
    if (!ok) {
      input.classList.add('error');
      setTimeout(function() { input.classList.remove('error'); }, 400);
    }
  });

  document.getElementById('wordInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      document.getElementById('submitBtn').click();
    }
  });

  document.getElementById('hintBtn').addEventListener('click', function() {
    game.toggleHints();
  });

  document.getElementById('newGameBtn').addEventListener('click', function() {
    game.newGame();
  });

  document.getElementById('playAgainBtn').addEventListener('click', function() {
    game.playAgain();
  });

  document.getElementById('winNewGameBtn').addEventListener('click', function() {
    game.newGame();
  });

  document.getElementById('solveBtn').addEventListener('click', function() {
    game.showSolution();
  });

  var languageBtns = document.querySelectorAll('.language-btn');
  for (var languageIndex = 0; languageIndex < languageBtns.length; languageIndex++) {
    languageBtns[languageIndex].addEventListener('click', function() {
      applyLanguage(this.getAttribute('data-language'));
    });
  }

  // Difficulty selector
  var diffBtns = document.querySelectorAll('.diff-btn');
  for (var i = 0; i < diffBtns.length; i++) {
    diffBtns[i].setAttribute('aria-pressed', diffBtns[i].classList.contains('active') ? 'true' : 'false');
    diffBtns[i].addEventListener('click', function() {
      var requestedDifficulty = this.dataset.diff;
      var all = document.querySelectorAll('.diff-btn');
      for (var j = 0; j < all.length; j++) all[j].disabled = true;
      game.setDifficulty(requestedDifficulty).then(function(changed) {
        if (!changed) return;
        for (var k = 0; k < all.length; k++) {
          all[k].classList.toggle('active', all[k].dataset.diff === requestedDifficulty);
          all[k].setAttribute('aria-pressed', all[k].dataset.diff === requestedDifficulty ? 'true' : 'false');
        }
      }).catch(function(error) {
        console.error(error);
        game.showMessageKey('dictionaryLoadFailed', 'error');
      }).finally(function() {
        for (var k = 0; k < all.length; k++) all[k].disabled = false;
      });
    });
  }

  // Start!
  game.newGame();
  console.log('Word Chain Loop ready!');
  console.log('  Dictionary: ' + game.dictionary.length + ' words');
  console.log('  Graph: ' + game.graph.size + ' nodes');
} catch (err) {
  console.error('FATAL:', err.message);
  document.body.innerHTML = '<div style="color:red;padding:20px;font-family:monospace;">' +
    '<h2>' + t('fatalTitle') + '</h2>' +
    '<p>' + err.message + '</p>' +
    '<p>' + t('fatalHelp') + '</p>' +
    '</div>';
}
