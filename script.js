const form = document.querySelector('#reply-form');
const inviteesList = document.querySelector('#invitees-list');
const phoneInput = document.querySelector('#guest-phone');
document.querySelector('#submission-id').value = globalThis.crypto?.randomUUID?.()
  || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
let nextInviteeId = 0;

function formatPhoneNumber(value) {
  const digits = value.replace(/\D/g, '');
  const hasUsPrefix = value.trimStart().startsWith('+1') || (digits.length === 11 && digits.startsWith('1'));

  // Preserve international numbers that do not use the US country code.
  if ((value.trimStart().startsWith('+') && !hasUsPrefix) || digits.length > 11 ||
      (digits.length === 11 && !hasUsPrefix)) return value;

  const national = hasUsPrefix ? digits.slice(1) : digits;
  const prefix = hasUsPrefix ? '+1 ' : '';
  if (national.length <= 3) return prefix + national;
  if (national.length <= 6) return `${prefix}(${national.slice(0, 3)}) ${national.slice(3)}`;
  return `${prefix}(${national.slice(0, 3)}) ${national.slice(3, 6)}-${national.slice(6)}`;
}

phoneInput.addEventListener('input', () => {
  const digitsBeforeCaret = phoneInput.value.slice(0, phoneInput.selectionStart ?? phoneInput.value.length)
    .replace(/\D/g, '').length;
  const formatted = formatPhoneNumber(phoneInput.value);
  if (formatted === phoneInput.value) return;

  phoneInput.value = formatted;
  let caret = 0;
  let digitsSeen = 0;
  while (caret < formatted.length && digitsSeen < digitsBeforeCaret) {
    if (/\d/.test(formatted[caret])) digitsSeen += 1;
    caret += 1;
  }
  if (digitsBeforeCaret === 0 && formatted.startsWith('+1 ')) caret = 3;
  phoneInput.setSelectionRange(caret, caret);
});

// Midnight at the start of October 8 in Temecula (Pacific Daylight Time).
const weddingStart = new Date('2027-10-08T00:00:00-07:00').getTime();
const countdownParts = {
  days: document.querySelector('#countdown-days'),
  hours: document.querySelector('#countdown-hours'),
  minutes: document.querySelector('#countdown-minutes'),
  seconds: document.querySelector('#countdown-seconds')
};

function updateCountdown() {
  const remaining = Math.max(0, weddingStart - Date.now());
  const totalSeconds = Math.floor(remaining / 1000);
  countdownParts.days.textContent = Math.floor(totalSeconds / 86400);
  countdownParts.hours.textContent = String(Math.floor(totalSeconds / 3600) % 24).padStart(2, '0');
  countdownParts.minutes.textContent = String(Math.floor(totalSeconds / 60) % 60).padStart(2, '0');
  countdownParts.seconds.textContent = String(totalSeconds % 60).padStart(2, '0');

  if (remaining === 0) {
    document.querySelector('#countdown-finished').hidden = false;
    clearInterval(countdownInterval);
  }
}

const countdownInterval = setInterval(updateCountdown, 1000);
updateCountdown();

function renumberInvitees() {
  inviteesList.querySelectorAll('.invitee-entry').forEach((entry, index) => {
    const number = index + 1;
    entry.setAttribute('aria-label', `Additional invitee ${number}`);
    entry.querySelector('.remove-invitee-button').setAttribute('aria-label', `Remove additional invitee ${number}`);
  });
}

document.querySelector('#add-invitee').addEventListener('click', () => {
  nextInviteeId += 1;
  const entry = document.querySelector('#invitee-template').content.firstElementChild.cloneNode(true);

  for (const [part, className] of [['first', '.invitee-first-name'], ['last', '.invitee-last-name']]) {
    const input = entry.querySelector(className);
    const id = `invitee-${nextInviteeId}-${part}-name`;
    input.id = id;
    input.previousElementSibling.htmlFor = id;
  }

  inviteesList.append(entry);
  renumberInvitees();
  entry.querySelector('.invitee-first-name').focus();
});

inviteesList.addEventListener('click', (event) => {
  if (event.target.closest('.remove-invitee-button')) {
    event.target.closest('.invitee-entry').remove();
    renumberInvitees();
    document.querySelector('#add-invitee').focus();
  }
});

form.addEventListener('submit', (event) => {
  if (!form.getAttribute('action')?.trim()) {
    event.preventDefault();
    const status = document.querySelector('#form-status');
    status.textContent = 'The form is not connected yet. Please contact Neusha and Jacob.';
    status.hidden = false;
  }
});
