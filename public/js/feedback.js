const feedbackBtn = document.getElementById('feedbackBtn');
const feedbackModal = document.getElementById('feedbackModal');
const closeFeedbackBtn = document.getElementById('closeFeedbackBtn');
const submitFeedbackBtn = document.getElementById('submitFeedbackBtn');
const feedbackMessage = document.getElementById('feedbackMessage');
const feedbackContact = document.getElementById('feedbackContact');
const feedbackStatus = document.getElementById('feedbackStatus');

export function initFeedbackUI() {
  feedbackBtn.addEventListener('click', function () {
    feedbackStatus.textContent = '';
    feedbackMessage.value = '';
    feedbackContact.value = '';
    submitFeedbackBtn.disabled = false;
    feedbackModal.classList.remove('hidden');
  });

  closeFeedbackBtn.addEventListener('click', function () {
    feedbackModal.classList.add('hidden');
  });

  submitFeedbackBtn.addEventListener('click', function () {
    const message = feedbackMessage.value.trim();
    if (!message) { feedbackStatus.textContent = '문의 내용을 입력해주세요'; return; }

    submitFeedbackBtn.disabled = true;
    feedbackStatus.textContent = '전송 중...';
    fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: message, contact: feedbackContact.value.trim() })
    }).then(function (r) {
      if (!r.ok) throw new Error('bad response');
      return r.json();
    }).then(function () {
      feedbackStatus.textContent = '전송 완료! 감사합니다.';
      feedbackMessage.value = '';
      feedbackContact.value = '';
    }).catch(function () {
      feedbackStatus.textContent = '전송 실패 - 다시 시도해주세요';
      submitFeedbackBtn.disabled = false;
    });
  });
}
