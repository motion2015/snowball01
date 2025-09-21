document.addEventListener('DOMContentLoaded', () => {
  // Initialize Swiper for the AI recommendation section
  const aiSwiper = new Swiper('.ai-swiper', {
    //slidesPerView: 'auto',
    slidesPerView: 3,
    slidesPerGroup: 3,
    spaceBetween: 10,
    //centeredSlides: true,//활성화된 슬라이드를 항상 컨테이너의 가운데에 오도록 강제
    loop: false,
    // autoplay: {
    //   //delay: 3000,
    //   //disableOnInteraction: false,
    // },
    pagination: {
      el: '.ai-swiper-pagination',
      clickable: true,
    },
    observer: true,
    observeParents: true,
    breakpoints: {
      // 640px 이하 화면에서는 1개씩 보이도록 설정
      320: {
        slidesPerView: 1,
        slidesPerGroup: 1,
        spaceBetween: 10
      },
      // 768px 이상 화면에서는 2개씩 보이도록 설정
      768: {
        slidesPerView: 2,
        slidesPerGroup: 2,
        spaceBetween: 10
      },
      // 1024px 이상 화면에서는 3개씩 보이도록 설정
      1024: {
        slidesPerView: 3,
        slidesPerGroup: 3,
        spaceBetween: 10
      }
    }
  });

  // --- Tab Functionality ---
  const tabs = document.querySelectorAll('.tab-button');
  const panels = document.querySelectorAll('.tab-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      const targetTab = e.target;
      const targetPanelId = targetTab.getAttribute('aria-controls');
      const targetPanel = document.getElementById(targetPanelId);

      // Deactivate all tabs and panels
      tabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
        t.setAttribute('tabindex', '-1');
      });
      panels.forEach(p => {
        p.classList.remove('active');
        p.setAttribute('hidden', '');
      });

      // Activate the clicked tab and its corresponding panel
      targetTab.classList.add('active');
      targetTab.setAttribute('aria-selected', 'true');
      targetTab.setAttribute('tabindex', '0');
      targetPanel.classList.add('active');
      targetPanel.removeAttribute('hidden');
      targetPanel.focus(); // Good for accessibility
    });

    // Add keyboard navigation (optional but good practice)
    tab.addEventListener('keydown', (e) => {
      let index = Array.from(tabs).indexOf(e.target);
      console.log(e.key);

      switch (e.key) {
        case 'ArrowLeft':
          index = (index - 1 + tabs.length) % tabs.length;
          tabs[index].focus();
          break;
        case 'ArrowRight':
          index = (index + 1) % tabs.length;
          tabs[index].focus();
          break;
        case 'Home':
          tabs[0].focus();
          break;
        case 'End':
          tabs[tabs.length - 1].focus();
          break;
      }
    });
  });

  // --- Increment/Decrement Functionality ---
  const rateControls = document.querySelectorAll('.rate-control');

  rateControls.forEach(control => {
    const minusBtn = control.querySelector('.minus');
    const plusBtn = control.querySelector('.plus');
    const rateValueSpan = control.querySelector('.rate-value');
    const itemCard = control.closest('.item-card');

    minusBtn.addEventListener('click', () => {
      console.log("마이너스 클릭");

      let currentValue = parseInt(rateValueSpan.textContent);
      if (currentValue > 0) {
        currentValue--;
        rateValueSpan.textContent = `${currentValue}%`;
      }
      // Add a class to the card if its rate is not 0
      if (currentValue > 0) {
        itemCard.classList.add('is-active');
      } else {
        itemCard.classList.remove('is-active');
      }
    });

    plusBtn.addEventListener('click', () => {
      console.log("플러스 클릭");
      let currentValue = parseInt(rateValueSpan.textContent);
      if (currentValue < 5) { // Assuming a max of 5% based on the prompt
        currentValue++;
        rateValueSpan.textContent = `${currentValue}%`;
      }
      // Add a class to the card if its rate is not 0
      if (currentValue > 0) {
        itemCard.classList.add('is-active');
      } else {
        itemCard.classList.remove('is-active');
      }
    });
  });

  // --- Initialize first card as active if the image shows it ---
  const initialActiveCard = document.querySelector('.item-card:nth-of-type(5)');
  if (initialActiveCard) {
    initialActiveCard.classList.add('is-active');
    const rateValue = initialActiveCard.querySelector('.rate-value');
    if (rateValue) {
      rateValue.textContent = '4%';
    }
  }
  const initialActiveCard2 = document.querySelector('.item-card:nth-of-type(6)');
  if (initialActiveCard2) {
    initialActiveCard2.classList.add('is-active');
    const rateValue = initialActiveCard2.querySelector('.rate-value');
    if (rateValue) {
      rateValue.textContent = '4%';
    }
  }
});