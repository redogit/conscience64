import { EVENT_KINDS, validateEvent } from './event-contract.mjs';

const metricKinds = ['OBSERVATION', 'TESTED', 'VERIFIED', 'CONTRADICTION', 'REVISED', 'PROMOTED', 'REOPENED'];
const counters = Object.fromEntries(EVENT_KINDS.map(kind => [kind, 0]));
const stream = document.getElementById('stream');
const mode = document.getElementById('mode');
const controlStatus = document.getElementById('controlStatus');
const metrics = document.getElementById('metrics');
let paused = false;
let pulseTimer = null;

const seed = [
  { kind: 'OBSERVATION', project: 'coordinate-space', message: 'Runtime artifact entered analytics ledger', evidence: 'direct' },
  { kind: 'TESTED', project: 'coordinate-space', message: 'UTF-8 / scalar sweep evidence registered', evidence: 'executed' },
  { kind: 'INTERPRETATION', project: 'shared-middle', message: 'Cross-carrier relation remains interpretive pending independent support', evidence: 'hypothesis' },
  { kind: 'BOUNDARY', project: 'research-method', message: 'Promotion guard requires provenance + verification scope', evidence: 'policy' },
  { kind: 'REOPENED', project: 'S-prime', message: 'Search for forgotten achievements reopened before summary', evidence: 'review' },
];

function makeElement(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function renderMetrics() {
  const cards = metricKinds.map(kind => {
    const card = makeElement('div', 'card');
    card.append(makeElement('div', 'k', String(counters[kind] || 0)));
    card.append(makeElement('div', 'label', kind));
    return card;
  });
  metrics.replaceChildren(...cards);
}

function addEvent(candidate) {
  if (paused) return false;
  const checked = validateEvent(candidate);
  if (!checked.ok) {
    controlStatus.textContent = `Rejected malformed analytics event: ${checked.error}.`;
    return false;
  }

  const event = checked.event;
  counters[event.kind] += 1;
  renderMetrics();

  const row = makeElement('div', 'event');
  const timestamp = new Date(event.time).toISOString().slice(11, 19);
  row.append(makeElement('time', '', timestamp));

  const kind = makeElement('div', 'kind', event.kind);
  kind.classList.add(event.kind);
  row.append(kind);

  const message = makeElement('div', '', event.message);
  message.append(makeElement('div', 'meta', `project=${event.project} · evidence=${event.evidence} · source=${event.source}`));
  row.append(message);
  row.append(makeElement('div', 'meta', event.status));
  stream.prepend(row);
  return true;
}

function makeDemoEvent(base, source = 'fallback-demo') {
  return {
    ...base,
    time: new Date().toISOString(),
    source,
    status: 'unpromoted',
  };
}

function localPulse() {
  const base = seed[Math.floor(Math.random() * seed.length)];
  addEvent(makeDemoEvent(base));
}

function fallback(reason = 'No SSE endpoint detected') {
  mode.textContent = 'DEMO DATA · SSE READY';
  mode.className = 'status fallback';
  controlStatus.textContent = `${reason}. Demonstration events are labeled and are not research evidence.`;
  seed.forEach((event, index) => {
    setTimeout(() => addEvent(makeDemoEvent(event, 'seed-demo')), index * 120);
  });
  if (!pulseTimer) pulseTimer = setInterval(localPulse, 2200);
}

function connect() {
  if (!('EventSource' in window)) {
    fallback('EventSource is unavailable in this browser');
    return;
  }

  const source = new EventSource('./events');
  let opened = false;
  const timeout = setTimeout(() => {
    if (!opened) {
      source.close();
      fallback();
    }
  }, 1800);

  source.onopen = () => {
    opened = true;
    clearTimeout(timeout);
    mode.textContent = 'LIVE SSE';
    mode.className = 'status live';
    controlStatus.textContent = 'Connected to the live analytics event source.';
  };

  source.onmessage = message => {
    try {
      addEvent(JSON.parse(message.data));
    } catch {
      controlStatus.textContent = 'Rejected analytics message: invalid JSON.';
    }
  };

  source.onerror = () => {
    if (opened) {
      source.close();
      fallback('Live SSE connection ended');
    }
  };
}

document.getElementById('pause').addEventListener('click', () => {
  paused = true;
  controlStatus.textContent = 'Live updates paused.';
});

document.getElementById('resume').addEventListener('click', () => {
  paused = false;
  controlStatus.textContent = 'Live updates resumed.';
});

document.getElementById('clear').addEventListener('click', () => {
  stream.replaceChildren();
  controlStatus.textContent = 'Visible event stream cleared; counters and source ledger are unchanged.';
});

setInterval(() => {
  document.getElementById('clock').textContent = new Date().toLocaleTimeString();
}, 1000);

renderMetrics();
connect();
