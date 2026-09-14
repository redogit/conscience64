import assert from 'node:assert/strict';
import { createReactionTrial, sampleDelay } from './timing-runtime.mjs';

assert.equal(sampleDelay(900, 2700, () => 0), 900);
assert.equal(sampleDelay(900, 2700, () => 0.5), 1800);
assert.ok(sampleDelay(900, 2700, () => 0.999999) < 2700);
assert.throws(() => sampleDelay(900, 2700, () => 1), /\[0,1\)/);

let now = 1000;
let timer = null;
let cleared = false;
let signaled = 0;
const schedule = (fn, delay) => { timer = { fn, delay }; return 7; };
const clear = id => { assert.equal(id, 7); cleared = true; };
let trial = createReactionTrial({ minDelayMs:900, maxDelayMs:2700, now:() => now, random:() => 0.5, setTimer:schedule, clearTimer:clear, onSignal:() => signaled++ });
assert.equal(trial.delayMs, 1800);
assert.equal(timer.delay, 1800);
assert.equal(trial.snapshot().status, 'waiting');
assert.deepEqual(trial.press(), { status:'false-start', delayMs:1800 });
assert.equal(cleared, true);
assert.equal(signaled, 0);

now = 5000; timer = null; cleared = false; signaled = 0;
trial = createReactionTrial({ minDelayMs:900, maxDelayMs:2700, now:() => now, random:() => 0, setTimer:schedule, clearTimer:clear, onSignal:() => signaled++ });
assert.equal(timer.delay, 900);
timer.fn();
assert.equal(signaled, 1);
assert.equal(trial.snapshot().status, 'ready');
now = 5237.4;
const reaction = trial.press();
assert.equal(reaction.status, 'reaction');
assert.ok(Math.abs(reaction.reactionMs - 237.4) < 1e-9);
assert.equal(trial.snapshot().status, 'finished');

now = 8000; timer = null; cleared = false; signaled = 0;
trial = createReactionTrial({ minDelayMs:900, maxDelayMs:2700, now:() => now, random:() => 0.25, setTimer:schedule, clearTimer:clear, onSignal:() => signaled++ });
const practice = trial.practiceNow();
assert.equal(cleared, true);
assert.equal(practice.status, 'ready');
assert.equal(signaled, 1);
now = 8050;
assert.equal(trial.press().reactionMs, 50);

now = 9000; timer = null; cleared = false;
trial = createReactionTrial({ minDelayMs:900, maxDelayMs:2700, now:() => now, random:() => 0.75, setTimer:schedule, clearTimer:clear });
assert.equal(trial.cancel().status, 'cancelled');
assert.equal(cleared, true);
assert.equal(trial.press().status, 'cancelled');

console.log('PASS timing runtime: source wait range, false start, monotonic reaction measurement, practice signal, cancellation.');
