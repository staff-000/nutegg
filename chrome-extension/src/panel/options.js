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

  const section = el('section', 'settings-section panel-settings');
  section.id = 'nutegg-panel-settings';

  // Header
  const header = el('div', 'panel-settings-header');
  header.append(el('h2', '', t('panelSettings')));
  const status = el('span', 'panel-save-status');
  status.setAttribute('role', 'status');
  header.append(status);
  section.append(header);

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

  section.append(displayRow, layoutRow);
  if (nativePosition) section.append(nativePosition);
  section.append(nativeNotice);

  // 2. Auto-Popup Default & Auto-Analyze
  const policySelect = makeSelect([
    ['nutegg', t('panelPresetDefault')],
    ['open', t('panelDefaultOpen')],
    ['closed', t('panelDefaultClosed')],
  ]);
  policySelect.value =
    settings.openingPolicy === 'custom'
      ? settings.defaultOpen
        ? 'open'
        : 'closed'
      : settings.openingPolicy;

  const autoCheck = el('input');
  autoCheck.type = 'checkbox';
  autoCheck.checked = settings.autoAnalyze;

  const policyRow = row(t('panelPopupConfig'), policySelect, t('panelHintPreset'));
  const autoRow = row(t('panelAutoAnalyze'), autoCheck, t('panelHintAuto'));
  section.append(policyRow, autoRow);

  // 3. Always-visible Whitelist & Blacklist Rules
  const rulesBox = el('div', 'panel-rules-box');
  const rulesHeader = el('div', 'panel-rules-header');
  rulesHeader.append(el('h3', '', t('panelRules')));

  const rulesActions = el('div', 'panel-rules-actions');
  const addBtn = el('button', 'secondary-btn', `+ ${t('panelAddRule')}`);
  addBtn.type = 'button';
  const tryBtn = el('button', 'text-btn', t('panelTryExample'));
  tryBtn.type = 'button';
  const testCurrentBtn = el('button', 'text-btn', t('panelTest'));
  testCurrentBtn.type = 'button';
  rulesActions.append(addBtn, tryBtn, testCurrentBtn);
  rulesHeader.append(rulesActions);
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
  websiteInput.placeholder = 'youtube.com, * or /^https:\\/\\//';

  const topicsInput = el('input');
  topicsInput.type = 'text';
  topicsInput.placeholder = 'Dan Koe, AI (optional)';

  const primaryGrid = el('div', 'panel-composer-grid');
  primaryGrid.append(
    row(t('panelAction'), actionSel),
    row(t('panelWebsite'), websiteInput),
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
  const listingsCheck = el('input');
  listingsCheck.type = 'checkbox';

  more.append(
    row(t('panelRuleName'), nameInput),
    row(t('panelAliases'), aliasesInput),
    row(t('panelMin'), minInput),
    row(t('panelMax'), maxInput),
    row(t('panelAvailability'), availSelect),
    row(t('panelSkipLists'), listingsCheck)
  );
  editor.append(more);

  const editorBtns = el('div', 'panel-composer-footer');
  const saveRuleBtn = el('button', 'primary-btn', t('panelSave'));
  saveRuleBtn.type = 'button';
  const testRuleBtn = el('button', 'secondary-btn', t('panelTest'));
  testRuleBtn.type = 'button';
  const cancelRuleBtn = el('button', 'text-btn', t('panelCancel'));
  cancelRuleBtn.type = 'button';
  editorBtns.append(cancelRuleBtn, testRuleBtn, saveRuleBtn);
  editor.append(editorBtns);
  editor.addEventListener('submit', event => event.preventDefault());
  rulesBox.append(editor);
  section.append(rulesBox);

  function visibility() {
    const isNative = displaySelect.value === 'native';
    layoutRow.hidden = isNative;
    if (nativePosition) nativePosition.hidden = !isNative;
    nativeNotice.hidden = !isNative;
    policyRow.hidden = isNative;
    autoRow.hidden = isNative;
    rulesBox.hidden = isNative;
    policySelect.disabled = isNative;
    autoCheck.disabled = isNative;
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
    settings = NutEggRules.normalize({
      ...settings,
      mode: val === 'native' ? 'native' : 'injected',
      side: val === 'injected-left' ? 'left' : 'right',
      layoutMode: layoutSelect.value,
      openingPolicy: policySelect.value,
      defaultOpen: policySelect.value === 'open',
      autoAnalyze: autoCheck.checked,
    });
    visibility();
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

  function buildDraft() {
    const aliasMap = {};
    for (const line of aliasesInput.value.split('\n').filter(l => l.trim())) {
      const [topic, ...rest] = line.split(':');
      if (!topic.trim() || !rest.length) throw new Error('aliases');
      aliasMap[topic.trim()] = parseCsv(rest.join(':'));
    }

    const rawSite = websiteInput.value.trim();
    let hostname = '';
    let website = '.*';
    if (!rawSite || rawSite === '*' || rawSite === '.*') {
      website = '.*';
    } else if (rawSite.startsWith('/') && rawSite.endsWith('/') && rawSite.length > 2) {
      website = rawSite.slice(1, -1);
    } else if (rawSite.startsWith('^')) {
      website = rawSite;
    } else {
      hostname = rawSite;
      website = NutEggRules.websiteRegex(rawSite);
    }

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
      excludeListings: listingsCheck.checked,
    });
  }

  async function preview(rule) {
    const res = await chrome.runtime.sendMessage({ action: 'panel-test-rules', rules: rule ? [rule] : undefined });
    status.textContent =
      res?.error || res?.decision?.error
        ? t(res?.error === 'panelNoSignals' ? 'panelNoSignals' : 'panelInvalid')
        : [
            t(res.decision.open ? 'panelAllow' : 'panelBlock'),
            res.decision.name === 'panelStarter' ? t('panelStarter') : res.decision.name,
            res.decision.topic,
            res.decision.minutes == null
              ? t('panelMinutesUnknown')
              : t('panelMinutes', { count: res.decision.minutes }),
            t(res.decision.contentAvailable ? 'panelContentReady' : 'panelContentMissing'),
          ]
            .filter(Boolean)
            .join(' · ');
  }

  function edit(rule) {
    editing = rule || null;
    editor.hidden = false;
    actionSel.value = rule?.action || 'allow';
    const friendlyHost = NutEggRules.websiteHostname(rule);
    websiteInput.value = friendlyHost || (rule?.website && rule.website !== '.*' ? rule.website : '');
    topicsInput.value = [...new Set([...(rule?.topics || []), ...(rule?.authors || [])])].join(', ');
    nameInput.value = rule?.name === 'panelStarter' ? t('panelStarter') : rule?.name || '';
    aliasesInput.value = Object.entries(rule?.aliases || {})
      .map(([topic, vals]) => `${topic}: ${vals.join(', ')}`)
      .join('\n');
    minInput.value = rule?.minMinutes ?? '';
    maxInput.value = rule?.maxMinutes ?? '';
    availSelect.value = typeof rule?.contentAvailable === 'boolean' ? (rule.contentAvailable ? 'yes' : 'no') : 'any';
    listingsCheck.checked = rule?.excludeListings === true;
    more.open = !!(rule?.minMinutes != null || rule?.maxMinutes != null || Object.keys(rule?.aliases || {}).length);
    websiteInput.focus();
  }

  function render() {
    rulesList.replaceChildren();
    if (!settings.rules.length) {
      rulesList.append(el('p', 'hint panel-empty-rules', 'No custom rules yet.'));
      return;
    }
    for (const rule of settings.rules) {
      const item = el('div', 'panel-rule-row');
      const enabled = el('input');
      enabled.type = 'checkbox';
      enabled.checked = rule.enabled !== false;
      enabled.setAttribute('aria-label', t('panelEnabled'));
      enabled.addEventListener('change', async () => {
        rule.enabled = enabled.checked;
        await persist();
      });

      const badge = el(
        'span',
        `panel-rule-badge ${rule.action === 'block' ? 'block' : 'allow'}`,
        t(rule.action === 'block' ? 'panelBlock' : 'panelAllow')
      );
      const scope = NutEggRules.websiteHostname(rule) || (rule.website === '.*' ? t('panelAllWebsites') : rule.website);
      const summary = el('span', 'panel-rule-summary', `${scope}${rule.topics?.length ? ' · ' + rule.topics.join(', ') : ''}`);

      const editBtn = el('button', 'text-btn', t('panelEdit'));
      editBtn.type = 'button';
      editBtn.addEventListener('click', () => edit(rule));

      const testBtn = el('button', 'text-btn', t('panelTest'));
      testBtn.type = 'button';
      testBtn.addEventListener('click', () => void preview(rule));

      const delBtn = el('button', 'text-btn', t('panelDelete'));
      delBtn.type = 'button';
      delBtn.addEventListener('click', async () => {
        settings.rules = settings.rules.filter(r => r.id !== rule.id);
        await persist();
        render();
      });

      item.append(enabled, badge, summary, editBtn, testBtn, delBtn);
      rulesList.append(item);
    }
  }

  addBtn.addEventListener('click', () => edit());
  tryBtn.addEventListener('click', () =>
    edit({
      id: crypto.randomUUID(),
      name: 'YouTube · Dan Koe',
      enabled: true,
      hostname: 'youtube.com',
      website: NutEggRules.websiteRegex('youtube.com'),
      action: 'allow',
      topics: ['Dan Koe'],
    })
  );
  testCurrentBtn.addEventListener('click', () => void preview());
  cancelRuleBtn.addEventListener('click', () => {
    editor.hidden = true;
  });
  testRuleBtn.addEventListener('click', () => {
    try {
      void preview(buildDraft());
    } catch {
      status.textContent = t('panelInvalid');
    }
  });
  saveRuleBtn.addEventListener('click', async () => {
    try {
      const rule = buildDraft();
      settings.rules = [...settings.rules.filter(item => item.id !== rule.id), rule];
      await persist();
      editor.hidden = true;
      render();
    } catch {
      status.textContent = t('panelInvalid');
    }
  });

  const density = document.querySelector('#ui-density-card');
  if (density) density.before(section);
  else document.querySelector('.setup-card')?.after(section);
  if (!section.isConnected) document.querySelector('.settings-intro')?.after(section);
  render();
  visibility();

  const draftRule = (await chrome.storage.session.get('panelRuleDraft')).panelRuleDraft;
  if (draftRule) {
    edit(draftRule);
    await chrome.storage.session.remove('panelRuleDraft');
    section.scrollIntoView();
  }
});
