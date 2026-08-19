const DEADZONE = 0.3;

function bindFireButton(keys) {
  const el = document.getElementById('fireBtn');
  if (!el) return;
  const on = function (ev) { ev.preventDefault(); keys.fire = true; };
  const off = function (ev) { ev.preventDefault(); keys.fire = false; };
  el.addEventListener('touchstart', on, { passive: false });
  el.addEventListener('touchend', off, { passive: false });
  el.addEventListener('touchcancel', off, { passive: false });
  el.addEventListener('mousedown', on);
  el.addEventListener('mouseup', off);
  el.addEventListener('mouseleave', off);
}

function bindJoystick(keys) {
  const base = document.getElementById('joystickBase');
  const knob = document.getElementById('joystickKnob');
  if (!base || !knob) return;

  const radius = base.clientWidth / 2;
  let activePointerId = null;
  let centerX = 0, centerY = 0;

  function applyVector(nx, ny) {
    keys.left = nx < -DEADZONE;
    keys.right = nx > DEADZONE;
    keys.up = ny < -DEADZONE;
    keys.down = ny > DEADZONE;
  }

  function resetStick() {
    knob.style.transform = 'translate(-50%, -50%)';
    keys.left = keys.right = keys.up = keys.down = false;
  }

  base.addEventListener('pointerdown', function (ev) {
    if (activePointerId !== null) return;
    ev.preventDefault();
    activePointerId = ev.pointerId;
    base.setPointerCapture(activePointerId);
    const rect = base.getBoundingClientRect();
    centerX = rect.left + rect.width / 2;
    centerY = rect.top + rect.height / 2;
  });

  base.addEventListener('pointermove', function (ev) {
    if (ev.pointerId !== activePointerId) return;
    ev.preventDefault();
    let dx = ev.clientX - centerX;
    let dy = ev.clientY - centerY;
    const dist = Math.hypot(dx, dy);
    if (dist > radius) {
      dx = (dx / dist) * radius;
      dy = (dy / dist) * radius;
    }
    knob.style.transform = 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px))';
    applyVector(dx / radius, dy / radius);
  });

  function end(ev) {
    if (ev.pointerId !== activePointerId) return;
    activePointerId = null;
    resetStick();
  }
  base.addEventListener('pointerup', end);
  base.addEventListener('pointercancel', end);
}

export function initTouchControls(keys) {
  bindJoystick(keys);
  bindFireButton(keys);
}
