// Temporary presentation gate for the coming-soon page. Static hosting cannot protect private content.
const accessForm = document.querySelector('#access-form');
const guestCode = document.querySelector('#guest-code');
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

guestCode.addEventListener('input', () => {
  codeError.hidden = true;
  guestCode.removeAttribute('aria-invalid');
});

accessForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (guestCode.value.trim() === '2319') {
    try {
      sessionStorage.setItem(accessKey, 'granted');
    } catch (_) {
      // Access remains available for the current page view.
    }
    showWeddingWelcome();
    return;
  }

  codeError.hidden = false;
  guestCode.setAttribute('aria-invalid', 'true');
  guestCode.focus();
  guestCode.select();
});
