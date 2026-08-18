function post(path) {
  fetch(path, { method: 'POST' }).catch(function () {});
}

export function sendVisit() {
  post('/api/stats/visit');
}

export function sendPlay() {
  post('/api/stats/play');
}
