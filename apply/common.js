document.querySelectorAll('.agreement__toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const parent = btn.closest('.agreement__item');
    const isActive = parent.classList.contains('agreement__item--active');

    // 다른 아코디언 닫기 (필요시)
    document.querySelectorAll('.agreement__item--accordion').forEach(item => {
      item.classList.remove('agreement__item--active');
    });

    // 현재 아코디언만 토글
    if (!isActive) parent.classList.add('agreement__item--active');
  });
});