export function sampleDelay(minDelayMs, maxDelayMs, random = Math.random) {
  if (!Number.isFinite(minDelayMs) || !Number.isFinite(maxDelayMs) || maxDelayMs < minDelayMs) throw new RangeError('invalid timing range');
  const sample = Number(random());
  if (!(sample >= 0 && sample < 1)) throw new RangeError('random source must return a value in [0,1)');
  return minDelayMs + sample * (maxDelayMs - minDelayMs);
}

export function createReactionTrial({
  minDelayMs,
  maxDelayMs,
  now = () => performance.now(),
  random = Math.random,
  setTimer = (fn, delay) => setTimeout(fn, delay),
  clearTimer = id => clearTimeout(id),
  onSignal = () => {},
} = {}) {
  const delayMs = sampleDelay(minDelayMs, maxDelayMs, random);
  let state = 'waiting';
  let signalAt = null;
  let timerId = null;

  const signal = () => {
    if (state !== 'waiting') return Object.freeze({ status: state, delayMs });
    state = 'ready';
    signalAt = Number(now());
    if (!Number.isFinite(signalAt)) throw new RangeError('monotonic clock returned a non-finite value');
    onSignal(Object.freeze({ status: state, delayMs, signalAt }));
    return Object.freeze({ status: state, delayMs, signalAt });
  };

  timerId = setTimer(signal, delayMs);

  function press() {
    if (state === 'finished' || state === 'cancelled') return Object.freeze({ status: state, delayMs });
    if (state === 'waiting') {
      clearTimer(timerId);
      timerId = null;
      state = 'finished';
      return Object.freeze({ status: 'false-start', delayMs });
    }
    const end = Number(now());
    if (!Number.isFinite(end)) throw new RangeError('monotonic clock returned a non-finite value');
    const reactionMs = Math.max(0, end - signalAt);
    state = 'finished';
    return Object.freeze({ status: 'reaction', delayMs, reactionMs });
  }

  function practiceNow() {
    if (state === 'waiting') {
      clearTimer(timerId);
      timerId = null;
      return signal();
    }
    return Object.freeze({ status: state, delayMs, signalAt });
  }

  function cancel() {
    if (state === 'waiting') clearTimer(timerId);
    timerId = null;
    if (state !== 'finished') state = 'cancelled';
    return Object.freeze({ status: state, delayMs });
  }

  function snapshot() {
    return Object.freeze({ status: state, delayMs, signalAt });
  }

  return Object.freeze({ delayMs, press, practiceNow, cancel, snapshot });
}
