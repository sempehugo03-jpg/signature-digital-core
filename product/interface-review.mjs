const frame = document.querySelector('#review-frame');
document.querySelectorAll('[data-width]').forEach(button => button.addEventListener('click', () => {
  frame.style.width = button.dataset.width + 'px';
  document.querySelectorAll('[data-width]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  frame.title = `Interface Fabrya à ${button.dataset.width} pixels`;
}));
