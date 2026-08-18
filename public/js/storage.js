const KEY = 'skywarrior_settings_v1';

export function loadSettings() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

export function saveSettings(partial) {
  try {
    const current = loadSettings();
    localStorage.setItem(KEY, JSON.stringify(Object.assign({}, current, partial)));
  } catch (e) {
    // localStorage unavailable (private browsing, etc.) - settings just won't persist
  }
}
