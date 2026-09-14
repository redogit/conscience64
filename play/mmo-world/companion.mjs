'use strict';

export const DU_BT_SERVICE = 'd3a00001-7e4f-4d55-9b3e-434f4e534336';
const bluetoothButton = document.getElementById('bluetooth-connect');
const bluetoothStatus = document.getElementById('bluetooth-status');
const gamepadStatus = document.getElementById('gamepad-status');
let bluetoothDevice = null;

function setStatus(el, text) { if (el) el.textContent = text; }

export async function requestBluetoothCompanion() {
  if (!globalThis.isSecureContext) {
    setStatus(bluetoothStatus, 'Bluetooth requires a secure HTTPS context. No device request was made.');
    return { ok: false, reason: 'INSECURE_CONTEXT' };
  }
  if (!navigator.bluetooth?.requestDevice) {
    setStatus(bluetoothStatus, 'Web Bluetooth is not available in this browser. The game remains fully playable without it.');
    return { ok: false, reason: 'WEB_BLUETOOTH_UNAVAILABLE' };
  }
  try {
    const device = await navigator.bluetooth.requestDevice({ acceptAllDevices: true, optionalServices: [DU_BT_SERVICE, 'battery_service'] });
    bluetoothDevice = device;
    const label = device.name || 'selected device';
    setStatus(bluetoothStatus, `Bluetooth: ${label} selected; connecting…`);
    device.addEventListener('gattserverdisconnected', () => setStatus(bluetoothStatus, `Bluetooth: ${label} disconnected. Reconnect only when you choose.`));
    if (!device.gatt) {
      setStatus(bluetoothStatus, `Bluetooth: ${label} selected, but this browser exposed no GATT connection.`);
      return { ok: false, reason: 'NO_GATT', device };
    }
    const server = await device.gatt.connect();
    setStatus(bluetoothStatus, `Bluetooth: connected to ${label}. DU-BT/1 does not read or write characteristics until a compatible companion explicitly exposes the protocol service.`);
    return { ok: Boolean(server.connected), device, server };
  } catch (error) {
    const cancelled = error?.name === 'NotFoundError';
    setStatus(bluetoothStatus, cancelled ? 'Bluetooth chooser closed; nothing connected.' : `Bluetooth connection failed: ${error?.name || 'unknown error'}.`);
    return { ok: false, reason: cancelled ? 'USER_CANCELLED' : 'CONNECT_FAILED' };
  }
}

if (bluetoothButton) bluetoothButton.addEventListener('click', requestBluetoothCompanion);

const activeKeys = new Set();
const previousButtons = new Map();
const gamepadKeyMap = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };
function emitKey(type, key) { window.dispatchEvent(new KeyboardEvent(type, { key, bubbles: true, cancelable: true })); }
function setMove(direction, active) {
  const key = gamepadKeyMap[direction];
  if (active && !activeKeys.has(key)) { activeKeys.add(key); emitKey('keydown', key); }
  if (!active && activeKeys.has(key)) { activeKeys.delete(key); emitKey('keyup', key); }
}
function releaseAll() { for (const key of [...activeKeys]) { activeKeys.delete(key); emitKey('keyup', key); } }
function pollGamepads() {
  const pads = navigator.getGamepads?.() || [];
  const pad = [...pads].find(Boolean);
  if (!pad) { releaseAll(); requestAnimationFrame(pollGamepads); return; }
  const x = pad.axes?.[0] || 0, y = pad.axes?.[1] || 0, deadzone = 0.42;
  setMove('left', x < -deadzone); setMove('right', x > deadzone); setMove('up', y < -deadzone); setMove('down', y > deadzone);
  for (const [index, key] of [[0, ' '], [2, 'e'], [9, 'p']]) {
    const pressed = Boolean(pad.buttons?.[index]?.pressed), before = previousButtons.get(index) || false;
    if (pressed && !before) { emitKey('keydown', key); emitKey('keyup', key); }
    previousButtons.set(index, pressed);
  }
  requestAnimationFrame(pollGamepads);
}
addEventListener('gamepadconnected', event => setStatus(gamepadStatus, `Gamepad: ${event.gamepad.id || 'controller'} connected. Movement, pulse, interact, and pause are mapped.`));
addEventListener('gamepaddisconnected', () => { releaseAll(); setStatus(gamepadStatus, 'Gamepad disconnected. Keyboard and touch remain available.'); });
requestAnimationFrame(pollGamepads);
export function bluetoothState() { return { selected: Boolean(bluetoothDevice), name: bluetoothDevice?.name || null, gattConnected: Boolean(bluetoothDevice?.gatt?.connected) }; }
