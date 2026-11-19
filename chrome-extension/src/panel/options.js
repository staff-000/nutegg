/* Panel settings save independently of provider settings. */
document.addEventListener('DOMContentLoaded', async () => {
  const t = (key, params) => NutEggI18n.t(key, params);
  const response = await chrome.runtime.sendMessage({ action: 'panel-get-settings' });
  let settings = NutEggRules.normalize(response?.settings),
    editing = null,
    fieldId = 0;

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  };

  const section = el('details', 'settings-disclosure panel-settings');
  section.id = 'nutegg-panel-settings';

  // Disclosure summary header (matches "Make it yours")
  const summary = el('summary');
  const icon = el('span', 'disclosure-icon', '🪟');
  icon.setAttribute('aria-hidden', 'true');
  const summaryCopy = el('span', 'summary-copy');
  summaryCopy.append(el('strong', '', t('panelSettings')), el('span', '', t('panelPopupConfig')));
  const status = el('span', 'panel-save-status');
  status.setAttribute('role', 'status');
  const chevron = el('span', 'chevron');
  chevron.setAttribute('aria-hidden', 'true');
  summary.append(icon, summaryCopy, status, chevron);

  const bodyWrap = el('div', 'disclosure-content');
  section.append(summary, bodyWrap);

  function makeSelect(options) {
    const sel = el('select');
    for (const [value, label] of options) {
      const opt = el('option', '', label);
      opt.value = value;
      sel.append(opt);
    }
    return sel;
  }

  function row(labelText, control, hintText) {
    control.id = `panel-setting-${++fieldId}`;
    const wrap = el('div', 'option-row');
    const lbl = el('label', '', labelText);
    lbl.htmlFor = control.id;
    wrap.append(lbl, control);
    if (hintText) {
      const hint = el('p', 'hint panel-field-hint', hintText);
      hint.id = `${control.id}-hint`;
      control.setAttribute('aria-describedby', hint.id);
      wrap.append(hint);
    }
    return wrap;
  }

  // 1. Panel Display (Mode + Side combined into 3 clean choices)
  const displayValue =
    settings.mode === 'native' ? 'native' : settings.side === 'left' ? 'injected-left' : 'injected-right';
  const displaySelect = makeSelect([
    ['injected-right', `${t('panelInjected')} · ${t('panelRight')}`],
    ['injected-left', `${t('panelInjected')} · ${t('panelLeft')}`],
    ['native', t('panelNative')],
  ]);
  displaySelect.value = displayValue;

  const layoutSelect = makeSelect([
    ['auto', 'Auto (float or push page)'],
    ['floating', 'Always float (never alter page)'],
    ['push', 'Always push page'],
  ]);
  layoutSelect.value = settings.layoutMode || 'auto';

  const nativePosition = document.querySelector('.panel-position-card');
  const nativeNotice = el('p', 'hint', t('panelNativeNotice'));
  const displayRow = row('Panel display', displaySelect);
  const layoutRow = row('Page overlap', layoutSelect);

  bodyWrap.append(displayRow, layoutRow);
  if (nativePosition) bodyWrap.append(nativePosition);
  bodyWrap.append(nativeNotice);

  // 2. Auto-Popup Default & Auto-Analyze
  const policySelect = makeSelect([
    ['nutegg', t('panelPresetDefault')],
    ['open', t('panelDefaultOpen')],
    ['closed', t('panelDefaultClosed')],
    ['custom', t('panelPresetCustom')],
  ]);
  policySelect.value = settings.openingPolicy;

  const autoCheck = el('input');
  autoCheck.type = 'checkbox';
  autoCheck.checked = settings.autoAnalyze;

  const policyRow = row(t('panelPopupConfig'), policySelect, t('panelHintPreset'));
  const autoRow = row(t('panelAutoAnalyze'), autoCheck, t('panelHintAuto'));
  bodyWrap.append(policyRow, autoRow);

  // 3. Opening rules hidden under "Add custom rules"
  const rulesDisclosure = el('details', 'panel-custom-rules');
  const rulesSummary = el('summary', '', t('panelAddCustomRules'));
  rulesDisclosure.append(rulesSummary);

  const rulesBox = el('div', 'panel-rules-box');
  const rulesHeader = el('form', 'panel-rules-header');
  const filterInput = el('input', 'panel-rules-filter');
  filterInput.type = 'search';
  filterInput.placeholder = t('panelTreeFilter');
  filterInput.setAttribute('aria-label', t('panelTreeFilter'));

  const addSiteBtn = el('button', 'secondary-btn', `+ ${t('panelTreeAddSite')}`);
  addSiteBtn.type = 'submit';
  addSiteBtn.hidden = true;

  const addBtn = el('button', 'text-btn', t('panelTreeAdvancedRule'));
  addBtn.type = 'button';

  const rulesActions = el('div', 'panel-rules-actions');
  rulesActions.append(addSiteBtn, addBtn);
  rulesHeader.append(filterInput, rulesActions);
  rulesBox.append(rulesHeader);

  const rulesList = el('div', 'panel-rules-list');
  rulesBox.append(rulesList);

  // Compact 3-field inline rule composer (+ collapsible More conditions)
  const editor = el('form', 'panel-rule-editor');
  editor.hidden = true;

  const actionSel = makeSelect([
    ['allow', t('panelAllow')],
    ['block', t('panelBlock')],
  ]);
  const websiteInput = el('input');
  websiteInput.type = 'text';
  websiteInput.placeholder = 'youtube.com, youtube.com/shorts, or *';

  const websiteRow = row(t('panelWebsite'), websiteInput);
  const websitePreview = el('p', 'hint panel-website-preview');
  websiteRow.append(websitePreview);

  const topicsInput = el('input');
  topicsInput.type = 'text';
  topicsInput.placeholder = 'Dan Koe, AI (optional)';

  const primaryGrid = el('div', 'panel-composer-grid');
  primaryGrid.append(
    row(t('panelAction'), actionSel),
    websiteRow,
    row(t('panelTopics'), topicsInput)
  );
  editor.append(primaryGrid);

  // Optional More Conditions
  const more = el('details', 'panel-advanced-matching');
  more.append(el('summary', '', t('panelAdvancedMatching')));
  const nameInput = el('input');
  nameInput.type = 'text';
  nameInput.placeholder = 'Auto-named from site & topic';
  const aliasesInput = el('textarea');
  aliasesInput.rows = 2;
  aliasesInput.placeholder = 'AI: artificial intelligence, 人工智能';
  const minInput = el('input');
  minInput.type = 'number';
  minInput.min = '0';
  const maxInput = el('input');
  maxInput.type = 'number';
  maxInput.min = '0';
  const availSelect = makeSelect([
    ['any', t('panelAny')],
    ['yes', t('panelContentReady')],
    ['no', t('panelContentMissing')],
  ]);
  const videoLongCheck = el('input');
  videoLongCheck.type = 'checkbox';
  const listingsCheck = el('input');
  listingsCheck.type = 'checkbox';

  more.append(
    row(t('panelRuleName'), nameInput),
    row(t('panelAliases'), aliasesInput),
    ...(NutEggRules.contentConditionsEnabled ? [
      row(t('panelMin'), minInput),
      row(t('panelMax'), maxInput),
      row(t('panelAvailability'), availSelect),
    ] : []),
    row(t('panelVideoLong'), videoLongCheck, t('panelVideoLongHint')),
    row(t('panelSkipLists'), listingsCheck)
  );
  editor.append(more);

  const editorBtns = el('div', 'panel-composer-footer');
  const saveRuleBtn = el('button', 'primary-btn', t('panelSave'));
  saveRuleBtn.type = 'button';
  const cancelRuleBtn = el('button', 'text-btn', t('panelCancel'));
  cancelRuleBtn.type = 'button';
  editorBtns.append(cancelRuleBtn, saveRuleBtn);
  editor.append(editorBtns);
  editor.addEventListener('submit', event => event.preventDefault());
  rulesBox.append(editor);
  rulesDisclosure.append(rulesBox);
  bodyWrap.append(rulesDisclosure);

  function visibility() {
    const isNative = displaySelect.value === 'native';
    layoutRow.hidden = isNative;
    if (nativePosition) nativePosition.hidden = !isNative;
    nativeNotice.hidden = !isNative;
    policyRow.hidden = isNative;
    autoRow.hidden = isNative;
    rulesDisclosure.hidden = isNative;
    policySelect.disabled = isNative;
    autoCheck.disabled = isNative;
  }

  function beginCustomEdit() {
    settings = NutEggRules.customize(settings);
    policySelect.value = 'custom';
  }

  async function persist() {
    await chrome.storage.local.set({ panelSettings: settings });
    status.textContent = t('panelSaved');
    setTimeout(() => {
      if (status.textContent === t('panelSaved')) status.textContent = '';
    }, 2500);
  }

  async function saveSettings() {
    const val = displaySelect.value;
    if (
      policySelect.value === 'custom' && settings.openingPolicy !== 'custom'
    ) {
      beginCustomEdit();
    }
    settings = NutEggRules.normalize({
      ...settings,
      mode: val === 'native' ? 'native' : 'injected',
      side: val === 'injected-left' ? 'left' : 'right',
      layoutMode: layoutSelect.value,
      openingPolicy: policySelect.value,
      defaultOpen: settings.defaultOpen,
      customRulesInitialized: settings.customRulesInitialized || policySelect.value === 'custom',
      autoAnalyze: autoCheck.checked,
    });
    visibility();
    render();
    await persist();
  }

  for (const ctrl of [displaySelect, layoutSelect, policySelect, autoCheck]) {
    ctrl.addEventListener('change', () => void saveSettings());
  }

  const parseCsv = text =>
    text
      .split(',')
      .map(v => v.trim())
      .filter(Boolean);

  function resolveWebsiteInput(rawInput) {
    const rawSite = String(rawInput || '').trim();
    if (!rawSite || rawSite === '*' || rawSite === '.*') {
      return { hostname: '', website: '.*' };
    }
    if (rawSite.startsWith('/') && rawSite.endsWith('/') && rawSite.length > 2) {
      const pattern = rawSite.slice(1, -1);
      new RegExp(pattern, 'i');
      return { hostname: '', website: pattern };
    }
    if (rawSite.startsWith('^')) {
      new RegExp(rawSite, 'i');
      return { hostname: '', website: rawSite };
    }
    const rootHost = NutEggRules.rootDomain(rawSite);
    const website = rawSite.includes('/') ? NutEggRules.subUrlRegex(rootHost, rawSite) : NutEggRules.websiteRegex(rawSite);
    const hostname = NutEggRules.websiteHostname({ website });
    return { hostname, website };
  }

  function updateWebsitePreview() {
    try {
      const { website } = resolveWebsiteInput(websiteInput.value);
      websitePreview.textContent = `Regex: ${website}`;
      websitePreview.classList.remove('is-error');
    } catch {
      websitePreview.textContent = t('panelInvalid');
      websitePreview.classList.add('is-error');
    }
  }
  websiteInput.addEventListener('input', updateWebsitePreview);

  function buildDraft() {
    const aliasMap = {};
    for (const line of aliasesInput.value.split('\n').filter(l => l.trim())) {
      const [topic, ...rest] = line.split(':');
      if (!topic.trim() || !rest.length) throw new Error('aliases');
      aliasMap[topic.trim()] = parseCsv(rest.join(':'));
    }

    const { hostname, website } = resolveWebsiteInput(websiteInput.value);

    const topicList = parseCsv(topicsInput.value);
    const derivedName = nameInput.value.trim() || [hostname || t('panelAllWebsites'), ...topicList].join(' · ');

    return NutEggRules.validate({
      id: editing?.id || crypto.randomUUID(),
      enabled: editing?.enabled !== false,
      name: derivedName,
      ...(hostname ? { hostname } : {}),
      website,
      action: actionSel.value,
      topics: topicList,
      aliases: aliasMap,
      ...(minInput.value !== '' ? { minMinutes: Number(minInput.value) } : {}),
      ...(maxInput.value !== '' ? { maxMinutes: Number(maxInput.value) } : {}),
      ...(availSelect.value !== 'any' ? { contentAvailable: availSelect.value === 'yes' } : {}),
      ...(videoLongCheck.checked ? { videoLongerThanSeconds: editing?.videoLongerThanSeconds ?? 180 } : {}),
      excludeListings: listingsCheck.checked,
    });
  }

  function edit(rule) {
    editing = rule || null;
    editor.hidden = false;
    actionSel.value = rule?.action || 'allow';
    const friendlyHost = NutEggRules.websiteHostname(rule);
    websiteInput.value =
      friendlyHost || (rule?.website && rule.website !== '.*' ? rule.website : selectedKey !== '*' ? selectedKey : '');
    updateWebsitePreview();
    topicsInput.value = [...new Set([...(rule?.topics || []), ...(rule?.authors || [])])].join(', ');
    nameInput.value = rule?.name === 'panelStarter' ? t('panelStarter') : rule?.name || '';
    aliasesInput.value = Object.entries(rule?.aliases || {})
      .map(([topic, vals]) => `${topic}: ${vals.join(', ')}`)
      .join('\n');
    minInput.value = rule?.minMinutes ?? '';
    maxInput.value = rule?.maxMinutes ?? '';
    availSelect.value = typeof rule?.contentAvailable === 'boolean' ? (rule.contentAvailable ? 'yes' : 'no') : 'any';
    videoLongCheck.checked = rule?.videoLongerThanSeconds != null;
    listingsCheck.checked = rule?.excludeListings === true;
    more.open = !!(rule?.minMinutes != null || rule?.maxMinutes != null || Object.keys(rule?.aliases || {}).length);
    websiteInput.focus();
  }

  const draftSites = new Set();
  let selectedKey = 'youtube.com';

  function makeRegionBadge(host) {
    const region = NutEggRules.domainRegion(host);
    if (!region) return null;
    return el(
      'span',
      `panel-region-tag is-${region}`,
      t(region === 'global' ? 'panelRegionGlobal' : 'panelRegionChina')
    );
  }

  function describeRule(rule) {
    const scope = NutEggRules.websiteHostname(rule) || (rule.website === '.*' ? t('panelAllWebsites') : rule.website);
    const parts = [scope];
    if (rule.topics?.length) parts.push(rule.topics.join(', '));
    if (NutEggRules.contentConditionsEnabled && rule.minMinutes != null) parts.push(`${rule.minMinutes}+ min`);
    if (NutEggRules.contentConditionsEnabled && rule.maxMinutes != null) parts.push(`≤${rule.maxMinutes} min`);
    if (NutEggRules.contentConditionsEnabled && rule.contentAvailable === true) parts.push(t('panelContentReady'));
    if (rule.videoLongerThanSeconds != null) parts.push(t('panelVideoLong'));
    if (rule.excludeListings) parts.push(t('panelSkipLists'));
    return parts.join(' · ');
  }

  function makeChipRow(labelText, kind, topics, onAdd, onRemove, { hasAllPages = false, onAddAll, onRemoveAll } = {}) {
    const rowEl = el('div', 'panel-chip-row');
    rowEl.append(el('span', 'panel-chip-label', labelText));
    const chips = el('div', 'panel-chip-list');
    if (hasAllPages) {
      const chip = el('span', `panel-topic-chip ${kind}`);
      chip.append(el('span', '', t('panelTreeAllPages')));
      const rm = el('button', 'panel-chip-remove', '×');
      rm.type = 'button';
      rm.setAttribute('aria-label', `${t('panelDelete')} ${t('panelTreeAllPages')}`);
      rm.addEventListener('click', () => void onRemoveAll?.());
      chip.append(rm);
      chips.append(chip);
    }
    for (const topic of topics) {
      const chip = el('span', `panel-topic-chip ${kind}`);
      chip.append(el('span', '', topic));
      const rm = el('button', 'panel-chip-remove', '×');
      rm.type = 'button';
      rm.setAttribute('aria-label', `${t('panelDelete')} ${topic}`);
      rm.addEventListener('click', () => void onRemove(topic));
      chip.append(rm);
      chips.append(chip);
    }
    const addChipBtn = el('button', 'panel-chip-add', t('panelTreeAddTopic'));
    addChipBtn.type = 'button';
    addChipBtn.addEventListener('click', () => {
      const input = el('input', 'panel-chip-input');
      input.type = 'text';
      input.placeholder = t('panelTreeTopicPlaceholder');
      addChipBtn.replaceWith(input);
      input.focus();
      let done = false;
      const commit = async (saveIt, fromEnter = false) => {
        if (done) return;
        done = true;
        const val = input.value.trim();
        if (saveIt && val && val !== '*') await onAdd(val);
        else if (saveIt && (val === '*' || (fromEnter && !val)) && onAddAll) await onAddAll();
        else render();
      };
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          void commit(true, true);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          void commit(false, false);
        }
      });
      input.addEventListener('blur', () => void commit(true, false));
    });
    chips.append(addChipBtn);
    rowEl.append(chips);
    return rowEl;
  }

  async function addTopicForSite(website, hostname, action, topic) {
    beginCustomEdit();
    settings.rules = NutEggRules.mergeRule(settings.rules, {
      website,
      ...(hostname ? { hostname } : {}),
      action,
      topics: [topic],
    });
    if (hostname) draftSites.delete(hostname);
    await persist();
    render();
  }

  async function removeTopicForSite(website, action, topic) {
    const target = topic.toLocaleLowerCase();
    beginCustomEdit();
    settings.rules = settings.rules
      .map(r => {
        if (r.website !== website || !NutEggRules.isSimpleTopicRule(r) || r.action !== action) return r;
        const remaining = (r.topics || []).filter(tItem => tItem.toLocaleLowerCase() !== target);
        return remaining.length ? { ...r, topics: remaining } : null;
      })
      .filter(Boolean);
    await persist();
    render();
  }

  async function setSiteDefault(website, hostname, nextAction) {
    beginCustomEdit();
    settings.rules = settings.rules.filter(r => !(r.website === website && NutEggRules.isSimpleSiteRule(r)));
    if (nextAction === 'allow' || nextAction === 'block') {
      settings.rules = NutEggRules.mergeRule(settings.rules, {
        website,
        ...(hostname ? { hostname } : {}),
        action: nextAction,
      });
      if (hostname) draftSites.delete(hostname);
    }
    await persist();
    render();
  }

  function ruleGroupHost(rule) {
    if (!rule || rule.website === '.*') return '';
    return NutEggRules.rootDomain(NutEggRules.websiteHostname(rule) || rule.hostname || rule.website);
  }

  function render() {
    rulesList.replaceChildren();
    const query = filterInput.value.trim().toLocaleLowerCase();
    const queryRoot = NutEggRules.rootDomain(query);

    const groups = new Map();
    const ensureGroup = (key, hostname, website) => {
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          hostname,
          website,
          defaultRule: null,
          siteRule: null,
          allowUrls: [],
          blockUrls: [],
          allowTopics: [],
          blockTopics: [],
          advanced: [],
        });
      }
      return groups.get(key);
    };

    const globalGroup = ensureGroup('*', '', '.*');
    if (policySelect.value === 'nutegg') {
      for (const def of NutEggRules.defaultRules || []) {
        const host = ruleGroupHost(def);
        if (host) {
          const g = ensureGroup(host, host, NutEggRules.websiteRegex(host));
          g.defaultRule = def;
        }
      }
    }
    for (const host of draftSites) ensureGroup(host, host, NutEggRules.websiteRegex(host));

    const customRegexRules = [];
    for (const rule of settings.openingPolicy === 'custom' ? settings.rules : []) {
      const isGlobal = rule.website === '.*';
      const exactHost = NutEggRules.websiteHostname(rule);
      const groupHost = ruleGroupHost(rule);
      if (!isGlobal && !groupHost) {
        customRegexRules.push(rule);
        continue;
      }
      const g = isGlobal ? globalGroup : ensureGroup(groupHost, groupHost, NutEggRules.websiteRegex(groupHost));
      const isRootScope = isGlobal || exactHost === groupHost;
      const isRootSiteConditionRule =
        isRootScope &&
        !rule.topics?.length &&
        !rule.authors?.length &&
        (!rule.aliases || !Object.keys(rule.aliases).length);
      const isSimpleSubUrlRule =
        !isRootScope &&
        !rule.topics?.length &&
        !rule.authors?.length &&
        rule.minMinutes == null &&
        rule.maxMinutes == null &&
        rule.contentAvailable == null &&
        rule.excludeListings !== true &&
        (!rule.aliases || !Object.keys(rule.aliases).length);
      if (isRootSiteConditionRule && rule.enabled !== false) {
        // A copied preset retains its URL chips as well as its matching behavior.
        if (rule._starter) g.defaultRule = rule;
        else g.siteRule = rule;
      } else if (isRootScope && NutEggRules.isSimpleTopicRule(rule) && rule.enabled !== false) {
        const listTarget = rule.action === 'block' ? g.blockTopics : g.allowTopics;
        for (const topic of rule.topics || []) {
          if (!listTarget.some(v => v.toLocaleLowerCase() === topic.toLocaleLowerCase())) listTarget.push(topic);
        }
      } else if (isSimpleSubUrlRule && rule.enabled !== false) {
        if (rule.action === 'block') g.blockUrls.push(rule);
        else g.allowUrls.push(rule);
      } else {
        g.advanced.push(rule);
      }
    }

    const matchesFilter = g => {
      if (!query) return true;
      const label = g.hostname || t('panelAllWebsites');
      if (label.toLocaleLowerCase().includes(query) || (queryRoot && label.toLocaleLowerCase().includes(queryRoot)))
        return true;
      if ([...g.allowTopics, ...g.blockTopics].some(tItem => tItem.toLocaleLowerCase().includes(query))) return true;
      return g.advanced.some(r => describeRule(r).toLocaleLowerCase().includes(query));
    };

    const siteGroups = [...groups.values()]
      .filter(g => g.key !== '*' && matchesFilter(g))
      .sort((a, b) => NutEggRules.compareDomains(a.hostname, b.hostname));

    const visibleItems = [
      ...(matchesFilter(globalGroup) ? [globalGroup] : []),
      ...siteGroups,
    ];

    if (visibleItems.length) {
      if (!visibleItems.some(g => g.key === selectedKey)) {
        selectedKey = (siteGroups[0] || visibleItems[0]).key;
      }
      const split = el('div', 'panel-master-detail');
      const listPane = el('div', 'panel-site-list');
      listPane.setAttribute('role', 'listbox');
      const detailPane = el('div', 'panel-site-detail');

      for (const g of visibleItems) {
        const isSelected = g.key === selectedKey;
        const itemBtn = el('button', `panel-site-nav-item${isSelected ? ' is-selected' : ''}`);
        itemBtn.type = 'button';
        itemBtn.setAttribute('role', 'option');
        itemBtn.setAttribute('aria-selected', String(isSelected));
        itemBtn.dataset.siteKey = g.key;

        const nameSpan = el(
          'span',
          'panel-site-nav-name',
          g.key === '*' ? `🌐 ${t('panelAllWebsites')}` : g.hostname
        );
        const metaSpan = el('span', 'panel-site-nav-meta');
        const regionBadge = g.hostname ? makeRegionBadge(g.hostname) : null;
        if (regionBadge) metaSpan.append(regionBadge);
        const ruleCount =
          g.allowTopics.length + g.blockTopics.length + g.advanced.length + (g.siteRule ? 1 : 0);
        if (ruleCount > 0) metaSpan.append(el('span', 'panel-site-nav-count', String(ruleCount)));

        itemBtn.append(nameSpan, metaSpan);
        itemBtn.addEventListener('click', () => {
          selectedKey = g.key;
          render();
        });
        listPane.append(itemBtn);
      }

      const active = visibleItems.find(g => g.key === selectedKey);
      if (active && active.key === '*') {
        const card = el('div', 'panel-site-card is-global');
        const head = el('div', 'panel-site-head');
        const titleWrap = el('div', 'panel-site-title-wrap');
        titleWrap.append(el('span', 'panel-site-name', `🌐 ${t('panelAllWebsites')}`));
        head.append(titleWrap);
        card.append(head);
        const body = el('div', 'panel-site-body');
        body.append(
          makeChipRow(
            t('panelTreeOpenFor'),
            'allow',
            active.allowTopics,
            topic => addTopicForSite('.*', '', 'allow', topic),
            topic => removeTopicForSite('.*', 'allow', topic)
          ),
          makeChipRow(
            t('panelTreeClosedFor'),
            'block',
            active.blockTopics,
            topic => addTopicForSite('.*', '', 'block', topic),
            topic => removeTopicForSite('.*', 'block', topic)
          )
        );
        card.append(body);
        detailPane.append(card);
      } else if (active) {
        const card = el('div', `panel-site-card${active.defaultRule ? ' is-default-site' : ''}`);
        const head = el('div', 'panel-site-head');
        const titleWrap = el('div', 'panel-site-title-wrap');
        const siteNameEl = el('span', 'panel-site-name', active.hostname);
        if (!active.defaultRule) {
          siteNameEl.title = t('panelEdit');
          siteNameEl.classList.add('is-editable');
          siteNameEl.addEventListener('click', () => {
            const nameInputEl = el('input', 'panel-site-rename-input');
            nameInputEl.type = 'text';
            nameInputEl.value = active.hostname;
            siteNameEl.replaceWith(nameInputEl);
            nameInputEl.focus();
            nameInputEl.select();
            let done = false;
            const commitRename = async saveIt => {
              if (done) return;
              done = true;
              const nextHost = NutEggRules.rootDomain(nameInputEl.value.trim());
              if (saveIt && nextHost && nextHost !== active.hostname) {
                const oldHost = active.hostname;
                const nextRegex = NutEggRules.websiteRegex(nextHost);
                beginCustomEdit();
                settings.rules = settings.rules.map(r => {
                  if (ruleGroupHost(r) !== oldHost) return r;
                  const exact = NutEggRules.websiteHostname(r);
                  if (exact === oldHost) return { ...r, hostname: nextHost, website: nextRegex, name: nextHost };
                  return r;
                });
                if (draftSites.delete(oldHost)) draftSites.add(nextHost);
                selectedKey = nextHost;
                await persist();
              } else if (saveIt && nameInputEl.value.trim() && !nextHost) {
                status.textContent = t('panelInvalid');
              }
              render();
            };
            nameInputEl.addEventListener('keydown', e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void commitRename(true);
              } else if (e.key === 'Escape') {
                e.preventDefault();
                void commitRename(false);
              }
            });
            nameInputEl.addEventListener('blur', () => void commitRename(true));
          });
        }
        titleWrap.append(siteNameEl);
        const regionBadge = makeRegionBadge(active.hostname);
        if (regionBadge) titleWrap.append(regionBadge);
        const condSource = active.siteRule || active.defaultRule;
        const primaryParts = [];
        if (condSource?.videoLongerThanSeconds != null) primaryParts.push(t('panelVideoLong'));
        if (NutEggRules.contentConditionsEnabled && condSource?.minMinutes != null) primaryParts.push(`${condSource.minMinutes}+ min`);
        if (NutEggRules.contentConditionsEnabled && condSource?.maxMinutes != null) primaryParts.push(`≤${condSource.maxMinutes} min`);
        if (NutEggRules.contentConditionsEnabled && condSource?.contentAvailable === true) primaryParts.push(t('panelContentReady'));
        else if (NutEggRules.contentConditionsEnabled && condSource?.contentAvailable === false) primaryParts.push(t('panelContentMissing'));

        const condBtn = el('button', 'panel-rule-default-tag is-editable');
        condBtn.type = 'button';
        condBtn.setAttribute('aria-label', t('panelEdit'));
        const condTextWrap = el('span', 'panel-default-tag-text');
        if (primaryParts.length)
          condTextWrap.append(el('span', 'panel-default-tag-line', primaryParts.join(' · ')));
        if (condSource?.excludeListings) {
          condTextWrap.append(el('span', 'panel-default-tag-sub', t('panelSkipLists')));
        }
        const condEditIcon = el('span', 'panel-default-tag-edit');
        condEditIcon.setAttribute('aria-hidden', 'true');
        condEditIcon.innerHTML =
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4Z"/></svg>';
        if (condTextWrap.childElementCount) condBtn.append(condTextWrap);
        condBtn.append(condEditIcon);
        titleWrap.append(condBtn);
        head.append(titleWrap);

        const headRight = el('div', 'panel-site-controls');
        const hasCustomForGroup = settings.openingPolicy === 'custom' &&
          settings.rules.some(r => ruleGroupHost(r) === active.hostname);
        if (hasCustomForGroup || !active.defaultRule) {
          const delSiteBtn = el('button', 'text-btn', t('panelDelete'));
          delSiteBtn.type = 'button';
          delSiteBtn.addEventListener('click', async () => {
            draftSites.delete(active.hostname);
            beginCustomEdit();
            settings.rules = settings.rules.filter(r => ruleGroupHost(r) !== active.hostname);
            await persist();
            render();
          });
          headRight.append(delSiteBtn);
        }
        head.append(headRight);
        card.append(head);

        const condEditor = el('div', 'panel-site-conditions-bar');
        condEditor.hidden = true;
        const condMin = el('input', 'panel-cond-min');
        condMin.type = 'number';
        condMin.min = '0';
        condMin.placeholder = '0';
        condMin.value = condSource?.minMinutes ?? '';
        const condAvail = makeSelect([
          ['any', t('panelAny')],
          ['yes', t('panelContentReady')],
          ['no', t('panelContentMissing')],
        ]);
        condAvail.value =
          typeof condSource?.contentAvailable === 'boolean'
            ? condSource.contentAvailable
              ? 'yes'
              : 'no'
            : 'any';
        const condVideo = el('input');
        condVideo.type = 'checkbox';
        condVideo.checked = condSource?.videoLongerThanSeconds != null;
        condVideo.title = t('panelVideoLongHint');
        const condLists = el('input');
        condLists.type = 'checkbox';
        condLists.checked = condSource?.excludeListings !== false;
        const condSaveBtn = el('button', 'secondary-btn', t('panelSave'));
        condSaveBtn.type = 'button';

        const makeCondField = (labelText, ctrl) => {
          const wrap = el('label', 'panel-cond-field');
          wrap.append(el('span', '', labelText), ctrl);
          return wrap;
        };
        condEditor.append(
          ...(NutEggRules.contentConditionsEnabled ? [
            makeCondField(t('panelMin'), condMin),
            makeCondField(t('panelAvailability'), condAvail),
          ] : []),
          makeCondField(t('panelVideoLong'), condVideo),
          makeCondField(t('panelSkipLists'), condLists),
          condSaveBtn
        );
        condBtn.addEventListener('click', () => {
          condEditor.hidden = !condEditor.hidden;
        });
        condSaveBtn.addEventListener('click', async () => {
          const nextRule = NutEggRules.validate({
            id: active.siteRule?.id || crypto.randomUUID(),
            enabled: true,
            name: active.hostname,
            hostname: active.hostname,
            website: active.website,
            action: active.siteRule?.action || 'allow',
            ...(condSource?.maxMinutes != null ? { maxMinutes: condSource.maxMinutes } : {}),
            ...(condMin.value !== '' ? { minMinutes: Number(condMin.value) } : {}),
            ...(condAvail.value !== 'any' ? { contentAvailable: condAvail.value === 'yes' } : {}),
            ...(condVideo.checked ? { videoLongerThanSeconds: condSource?.videoLongerThanSeconds ?? 180 } : {}),
            excludeListings: condLists.checked,
          });
          beginCustomEdit();
          settings.rules = [
            ...settings.rules.filter(r => r.id !== active.siteRule?.id),
            nextRule,
          ];
          draftSites.delete(active.hostname);
          await persist();
          render();
        });
        card.append(condEditor);

        const makeUrlChipRow = (labelText, kind, urlRules, defaultPaths = []) => {
          const rowEl = el('div', 'panel-chip-row');
          rowEl.append(el('span', 'panel-chip-label', labelText));
          const chips = el('div', 'panel-chip-list');
          for (const pathLabel of defaultPaths) {
            const pathRegex = NutEggRules.subUrlRegex(active.hostname, pathLabel);
            if (active.blockUrls.some(r => r.website === pathRegex)) continue;
            const chip = el('span', `panel-topic-chip ${kind}`);
            chip.append(el('span', '', `${active.hostname}${pathLabel}`));
            const rm = el('button', 'panel-chip-remove', '×');
            rm.type = 'button';
            rm.setAttribute('aria-label', `${t('panelDelete')} ${pathLabel}`);
            rm.addEventListener('click', async () => {
              beginCustomEdit();
              settings.rules = NutEggRules.mergeRule(settings.rules, {
                name: `${active.hostname}${pathLabel}`,
                website: pathRegex,
                action: 'block',
              });
              await persist();
              render();
            });
            chip.append(rm);
            chips.append(chip);
          }
          for (const r of urlRules) {
            const label = NutEggRules.friendlyUrlLabel(r);
            const chip = el('span', `panel-topic-chip ${kind}`);
            chip.append(el('span', '', label));
            const rm = el('button', 'panel-chip-remove', '×');
            rm.type = 'button';
            rm.setAttribute('aria-label', `${t('panelDelete')} ${label}`);
            rm.addEventListener('click', async () => {
              beginCustomEdit();
              settings.rules = settings.rules.filter(item => item.id !== r.id);
              await persist();
              render();
            });
            chip.append(rm);
            chips.append(chip);
          }
          const addBtnEl = el('button', 'panel-chip-add', t('panelTreeAddUrl'));
          addBtnEl.type = 'button';
          addBtnEl.addEventListener('click', () => {
            const input = el('input', 'panel-chip-input');
            input.type = 'text';
            input.placeholder = t('panelTreeUrlPlaceholder');
            addBtnEl.replaceWith(input);
            input.focus();
            let done = false;
            const commit = async saveIt => {
              if (done) return;
              done = true;
              const val = input.value.trim();
              if (saveIt && val) {
                try {
                  const regex = NutEggRules.subUrlRegex(active.hostname, val);
                  const hostMatch = NutEggRules.websiteHostname({ website: regex });
                  beginCustomEdit();
                  settings.rules = [
                    ...settings.rules.filter(item => !(item.website === regex && item.action !== kind)),
                    NutEggRules.validate({
                      id: crypto.randomUUID(),
                      enabled: true,
                      name: val,
                      ...(hostMatch ? { hostname: hostMatch } : {}),
                      website: regex,
                      action: kind,
                    }),
                  ];
                  draftSites.delete(active.hostname);
                  await persist();
                } catch {
                  status.textContent = t('panelInvalid');
                }
              }
              render();
            };
            input.addEventListener('keydown', e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void commit(true);
              } else if (e.key === 'Escape') {
                e.preventDefault();
                void commit(false);
              }
            });
            input.addEventListener('blur', () => void commit(true));
          });
          chips.append(addBtnEl);
          rowEl.append(chips);
          return rowEl;
        };

        const body = el('div', 'panel-site-body');
        const urlSection = el('div', 'panel-site-subsection');
        urlSection.append(
          el('div', 'panel-site-subsection-title', t('panelTreeUrlSection')),
          makeUrlChipRow(
            t('panelTreeOpenUrls'),
            'allow',
            active.allowUrls,
            active.defaultRule ? NutEggRules.domainDefaultPaths(active.hostname) : []
          ),
          makeUrlChipRow(t('panelTreeClosedUrls'), 'block', active.blockUrls)
        );
        const topicSection = el('div', 'panel-site-subsection');
        topicSection.append(
          el('div', 'panel-site-subsection-title', t('panelTreeTopicSection')),
          makeChipRow(
            t('panelTreeOpenFor'),
            'allow',
            active.allowTopics,
            topic => addTopicForSite(active.website, active.hostname, 'allow', topic),
            topic => removeTopicForSite(active.website, 'allow', topic),
            {
              hasAllPages: active.siteRule?.action === 'allow',
              onAddAll: () => setSiteDefault(active.website, active.hostname, 'allow'),
              onRemoveAll: () => setSiteDefault(active.website, active.hostname, 'inherit'),
            }
          ),
          makeChipRow(
            t('panelTreeClosedFor'),
            'block',
            active.blockTopics,
            topic => addTopicForSite(active.website, active.hostname, 'block', topic),
            topic => removeTopicForSite(active.website, 'block', topic),
            {
              hasAllPages: active.siteRule?.action === 'block',
              onAddAll: () => setSiteDefault(active.website, active.hostname, 'block'),
              onRemoveAll: () => setSiteDefault(active.website, active.hostname, 'inherit'),
            }
          )
        );
        body.append(urlSection, topicSection);
        for (const adv of active.advanced) {
          const advRow = el('div', 'panel-rule-row');
          const badge = el(
            'span',
            `panel-rule-badge ${adv.action === 'block' ? 'block' : 'allow'}`,
            t(adv.action === 'block' ? 'panelBlock' : 'panelAllow')
          );
          const editBtn = el('button', 'text-btn', t('panelEdit'));
          editBtn.type = 'button';
          editBtn.addEventListener('click', () => edit(adv));
          const delBtn = el('button', 'text-btn', t('panelDelete'));
          delBtn.type = 'button';
          delBtn.addEventListener('click', async () => {
            beginCustomEdit();
            settings.rules = settings.rules.filter(r => r.id !== adv.id);
            await persist();
            render();
          });
          advRow.append(badge, el('span', 'panel-rule-summary', describeRule(adv)), editBtn, delBtn);
          body.append(advRow);
        }
        card.append(body);
        detailPane.append(card);
      }

      split.append(listPane, detailPane);
      rulesList.append(split);
    }

    // 3. Any custom regex rules not mapped to a plain hostname
    const visibleCustom = customRegexRules.filter(
      r => !query || describeRule(r).toLocaleLowerCase().includes(query)
    );
    if (visibleCustom.length) {
      const customWrap = el('div', 'panel-custom-regex-group');
      customWrap.append(el('div', 'panel-custom-regex-heading', t('panelTreeCustomRules')));
      for (const rule of visibleCustom) {
        const item = el('div', 'panel-rule-row');
        const badge = el(
          'span',
          `panel-rule-badge ${rule.action === 'block' ? 'block' : 'allow'}`,
          t(rule.action === 'block' ? 'panelBlock' : 'panelAllow')
        );
        const editBtn = el('button', 'text-btn', t('panelEdit'));
        editBtn.type = 'button';
        editBtn.addEventListener('click', () => edit(rule));
        const delBtn = el('button', 'text-btn', t('panelDelete'));
        delBtn.type = 'button';
        delBtn.addEventListener('click', async () => {
          beginCustomEdit();
          settings.rules = settings.rules.filter(r => r.id !== rule.id);
          await persist();
          render();
        });
        item.append(badge, el('span', 'panel-rule-summary', describeRule(rule)), editBtn, delBtn);
        customWrap.append(item);
      }
      rulesList.append(customWrap);
    }
    const rawQuery = filterInput.value.trim();
    const candidateHost = NutEggRules.rootDomain(rawQuery);
    const showAddSite = Boolean(candidateHost && !groups.has(candidateHost));
    addSiteBtn.hidden = !showAddSite;
    if (showAddSite) addSiteBtn.textContent = `+ ${t('panelTreeAddSite')} "${candidateHost}"`;
  }

  filterInput.addEventListener('input', () => render());
  rulesHeader.addEventListener('submit', async e => {
    e.preventDefault();
    const host = NutEggRules.rootDomain(filterInput.value.trim());
    if (!host) {
      status.textContent = t('panelInvalid');
      return;
    }
    beginCustomEdit();
    settings.rules = NutEggRules.mergeRule(settings.rules, {
      name: host,
      hostname: host,
      website: NutEggRules.websiteRegex(host),
      action: 'allow',
      excludeListings: true,
    });
    selectedKey = host;
    filterInput.value = '';
    await persist();
    render();
  });
  addBtn.addEventListener('click', () => edit());
  cancelRuleBtn.addEventListener('click', () => {
    editor.hidden = true;
  });
  saveRuleBtn.addEventListener('click', async () => {
    try {
      const rule = buildDraft();
      beginCustomEdit();
      settings.rules = [...settings.rules.filter(item => item.id !== rule.id), rule];
      await persist();
      editor.hidden = true;
      render();
    } catch {
      status.textContent = t('panelInvalid');
    }
  });

  const reading = document.querySelector('#reading-preferences');
  if (reading) reading.after(section);
  else {
    const density = document.querySelector('#ui-density-card');
    if (density) density.before(section);
    else document.querySelector('.setup-card')?.after(section);
  }
  if (!section.isConnected) document.querySelector('.settings-intro')?.after(section);
  render();
  visibility();

  const draftRule = (await chrome.storage.session.get('panelRuleDraft')).panelRuleDraft;
  if (draftRule) {
    section.open = true;
    rulesDisclosure.open = true;
    edit(draftRule);
    await chrome.storage.session.remove('panelRuleDraft');
    section.scrollIntoView();
  }

  window.addEventListener('nutegg-settings-updated', async () => {
    const fresh = await chrome.runtime.sendMessage({ action: 'panel-get-settings' });
    settings = NutEggRules.normalize(fresh?.settings);
    displaySelect.value =
      settings.mode === 'native' ? 'native' : settings.side === 'left' ? 'injected-left' : 'injected-right';
    layoutSelect.value = settings.layoutMode || 'auto';
    policySelect.value = settings.openingPolicy || 'nutegg';
    autoAnalyzeCheckbox.checked = !!settings.autoAnalyze;
    visibility();
    render();
  });
});
