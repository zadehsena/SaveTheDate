// Temporary presentation gate for the coming-soon page. Static hosting cannot protect private content.
const accessForm = document.querySelector('#access-form');
const codeDigits = [...document.querySelectorAll('.code-digit')];
const codeError = document.querySelector('#code-error');
const accessKey = 'neusha-jacob-guest-access';

function showWeddingWelcome() {
  document.querySelector('#gate-locked').hidden = true;
  document.querySelector('#gate-unlocked').hidden = false;
  document.querySelector('#welcome-title').focus();
}

try {
  if (sessionStorage.getItem(accessKey) === 'granted') showWeddingWelcome();
} catch (_) {
  // The page still works when browser storage is disabled.
}

function clearCodeError() {
  codeError.hidden = true;
  codeDigits.forEach((digit) => digit.removeAttribute('aria-invalid'));
}

codeDigits.forEach((digit, index) => {
  digit.addEventListener('focus', () => digit.select());
  digit.addEventListener('input', () => {
    digit.value = digit.value.replace(/\D/g, '').slice(-1);
    clearCodeError();
    if (digit.value && index < codeDigits.length - 1) codeDigits[index + 1].focus();
  });
  digit.addEventListener('paste', (event) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '');
    if (!pasted) return;
    const start = pasted.length >= codeDigits.length ? 0 : index;
    const characters = pasted.slice(0, codeDigits.length - start);
    [...characters].forEach((character, offset) => {
      codeDigits[start + offset].value = character;
    });
    clearCodeError();
    codeDigits[Math.min(start + characters.length, codeDigits.length - 1)].focus();
  });
  digit.addEventListener('keydown', (event) => {
    if (event.key === 'Backspace' && !digit.value && index > 0) {
      event.preventDefault();
      codeDigits[index - 1].value = '';
      codeDigits[index - 1].focus();
      clearCodeError();
    } else if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      codeDigits[index - 1].focus();
    } else if (event.key === 'ArrowRight' && index < codeDigits.length - 1) {
      event.preventDefault();
      codeDigits[index + 1].focus();
    }
  });
});

accessForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (codeDigits.map((digit) => digit.value).join('') === '2319') {
    try {
      sessionStorage.setItem(accessKey, 'granted');
    } catch (_) {
      // Access remains available for the current page view.
    }
    showWeddingWelcome();
    return;
  }

  codeError.hidden = false;
  codeDigits.forEach((digit) => digit.setAttribute('aria-invalid', 'true'));
  codeDigits[0].focus();
});
