//const darkMode = localStorage.getItem("darkMode");
const darkMode = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;

const focusTrapState = {};
const gfn = {
  isBodyScrollable() {
    const app = document.querySelector(".app");
    if (!app) return;
    if (document.body.scrollHeight > window.innerHeight) {
      app.classList.add("is-scrollable");
    } else {
      app.classList.remove("is-scrollable");
    }
  },
  setViewportH() {
    let vh = $(window).height() * 0.01;
    $(":root").css("--vh", vh + "px");
  },
  isEmpty(value) {
    return value == null || (typeof value === "string" && value.trim().length === 0);
  },
  getDeviceType() {
    const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;

    const ua = navigator.userAgent;
    // 모바일/태블릿 기종 패턴
    const isMobileUA = /Android|iPhone|iPad|iPod|Mobile|BlackBerry|IEMobile|Opera Mini/i.test(ua);

    // pointer 미디어 쿼리 체크 (touch: coarse, mouse: fine)
    const isPointerCoarse = window.matchMedia("(pointer: coarse)").matches;
    const isPointerFine = window.matchMedia("(pointer: fine)").matches;
    const canHover = window.matchMedia("(hover: hover)").matches;

    if (isTouch) {
      if (isMobileUA && isPointerCoarse && !canHover) {
        return "mobile or tablet";
      }
      if (!isMobileUA && (isPointerCoarse || isPointerFine) && canHover) {
        return "touch-enabled laptop/desktop monitor";
      }
      // 기타 케이스
      return "unknown touch device";
    }

    // 터치 미지원 - 일반 PC
    return "non-touch PC";
  },
  focusTrap(targetSelector) {
    const target = document.querySelector(targetSelector);
    if (!target) return;

    let focusableElements = target.querySelectorAll(
      'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]'
    );

    focusableElements = Array.prototype.slice.call(focusableElements).filter((el) => el.offsetParent !== null);

    if (focusableElements.length === 0) return;

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    function trapFocus(e) {
      if (e.key === "Tab") {
        if (focusableElements.length === 0) {
          e.preventDefault();
          return;
        }
        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable.focus();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable.focus();
          }
        }
      }
    }

    // 이미 등록된 상태면 먼저 제거
    if (focusTrapState[targetSelector]) {
      document.removeEventListener("keydown", focusTrapState[targetSelector]);
    }

    document.addEventListener("keydown", trapFocus);
    focusTrapState[targetSelector] = trapFocus;

    // 첫 포커싱
    firstFocusable.focus();
  },
  releaseTrap(targetSelector) {
    const trapHandler = focusTrapState[targetSelector];
    if (trapHandler) {
      document.removeEventListener("keydown", trapHandler);
      delete focusTrapState[targetSelector];
    }
  },
};

// DARK MODE (테스트용 - 미디어쿼리 사용 예정)
const gfn_theme = {
  init() {
    if (darkMode === "true") {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  },
  dark() {
    document.documentElement.setAttribute("data-theme", "dark");
    localStorage.setItem("darkMode", true);
  },
  light() {
    document.documentElement.removeAttribute("data-theme");
    localStorage.setItem("darkMode", false);
  },
  //테마를 사용하고 싶지 않을 때(onload에 넣지말고 바로 실행-아니면 깜빡임)
  disable() {
    document.documentElement.classList.add("no-theme");
  },
};

// Z-Index 관리 클래스 (gfn_dim 통합)
class ZIndexManager {
  constructor() {
    this.baseZIndex = 1000;
    this.currentZIndex = this.baseZIndex;
    this.openLayers = [];
  }

  openLayer(layerId, element) {
    this.currentZIndex += 10;
    this.openLayers.push({
      id: layerId,
      element: element,
      zIndex: this.currentZIndex,
    });

    element.style.zIndex = this.currentZIndex;

    // DIM 자동 생성
    this.generateDim(element, this.currentZIndex);

    // 첫 번째 레이어가 열릴 때 body 스크롤 막기
    if (this.openLayers.length === 1) {
      this.lockBodyScroll();
    }

    return this.currentZIndex;
  }

  closeLayer(layerId) {
    const layerIndex = this.openLayers.findIndex((layer) => layer.id === layerId);
    if (layerIndex !== -1) {
      const layer = this.openLayers[layerIndex];

      // DIM 제거
      this.removeDim(layer.element);

      this.openLayers.splice(layerIndex, 1);
    }

    // 모든 레이어가 닫혔을 때 body 스크롤 해제
    if (this.openLayers.length === 0) {
      this.unlockBodyScroll();
      this.reset();
    }
  }

  reset() {
    this.currentZIndex = this.baseZIndex;
    this.openLayers = [];
  }

  getZIndex(layerId) {
    const layer = this.openLayers.find((layer) => layer.id === layerId);
    return layer ? layer.zIndex : this.baseZIndex;
  }

  // DIM 생성
  generateDim(element, zIndex) {
    const dim = document.createElement("div");
    dim.className = "shc-dim";
    dim.style.zIndex = zIndex - 1;
    dim.setAttribute("data-layer-id", element.getAttribute("data-layered-name"));

    element.parentNode.insertBefore(dim, element);
  }

  // DIM 제거
  removeDim(element) {
    const layerName = element.getAttribute("data-layered-name");
    const dim = document.querySelector(`.shc-dim[data-layer-id="${layerName}"]`);
    if (dim) {
      // 페이드 아웃 애니메이션 적용
      dim.classList.add("dim-fade-out");

      // 애니메이션 완료 후 DOM에서 제거
      setTimeout(() => {
        dim.remove();
      }, 200); // 애니메이션 시간과 동일하게 설정
    }
  }

  // 모든 DIM 제거
  removeAllDims() {
    document.querySelectorAll(".shc-dim").forEach((dim) => dim.remove());
  }

  // body 스크롤 막기
  lockBodyScroll() {
    const html = document.documentElement;
    html.classList.add("is-fixed");
    // const body = document.documentElement;
    // const scrollY = window.scrollY;

    // 현재 스크롤 위치 저장
    // body.style.position = "fixed";
    // body.style.top = `-${scrollY}px`;
    // body.style.width = "100%";
    // body.style.height = "100%";
    // body.style.overflow = "hidden";

    // // 스크롤 위치 저장 (나중에 복원용)
    // body.setAttribute("data-scroll-y", scrollY.toString());
  }

  // body 스크롤 해제
  unlockBodyScroll() {
    const html = document.documentElement;
    //html.classList.remove("is-fixed");
    html.removeAttribute("class");
    // const body = document.documentElement;
    // const scrollY = parseInt(body.getAttribute("data-scroll-y") || "0");

    // // 스타일 제거
    // body.style.position = "";
    // body.style.top = "";
    // body.style.width = "";
    // body.style.height = "";
    // body.style.overflow = "";

    // // 스크롤 위치 복원
    // window.scrollTo(0, scrollY);

    // // 저장된 스크롤 위치 제거
    // body.removeAttribute("data-scroll-y");
  }
}
// 전역 인스턴스
const zIndexManager = new ZIndexManager();

// 모달 관리 클래스
class ModalManager {
  constructor() {
    this.currentModalId = null;
  }

  // 모달 생성 및 표시
  show(options = {}) {
    const {
      title = "",
      errorCode = "",
      content = "",
      type = "alert", // 'alert' or 'confirm'
      buttons = [],
      alignCenter = true,
      onClose = null,
    } = options;

    // 기존 모달이 있으면 제거
    this.close();

    // 모달 ID 생성
    this.currentModalId = `modal-${Date.now()}`;
    const layeredName = this.currentModalId;

    // 버튼 HTML 생성
    const buttonsHtml = this.generateButtons(buttons, layeredName);

    // 아이콘 클래스 결정
    const iconClass = this.getIconClass(type);

    // 모달 템플릿 생성
    const modalHtml = this.createModalTemplate({
      layeredName,
      title,
      errorCode,
      content,
      iconClass,
      buttonsHtml,
      alignCenter,
    });

    // DOM에 추가
    document.body.insertAdjacentHTML("beforeend", modalHtml);

    // 버튼 이벤트 바인딩
    this.bindButtonEvents(layeredName);

    // DOM 렌더링 완료 후 모달 열기 (focusTrap을 위해)
    requestAnimationFrame(() => {
      gfn_layered.open(layeredName);

      // 포커스가 제대로 설정되었는지 확인하고 강제 설정
      setTimeout(() => {
        const modal = document.querySelector(`[data-layered-name="${layeredName}"]`);
        if (modal) {
          const firstButton = modal.querySelector("button");
          if (firstButton && document.activeElement !== firstButton) {
            firstButton.focus();
          }
        }
      }, 10);
    });

    // 닫기 콜백 설정
    if (onClose) {
      this.onCloseCallback = onClose;
    }

    return this.currentModalId;
  }

  // 버튼 HTML 생성
  generateButtons(buttons, layeredName) {
    if (buttons.length === 0) {
      // 기본 버튼
      return `
        <button class="shc-btn theme-primary size-lg" type="button" onclick="modalControl.close('${layeredName}')">
          <span class="shc-btn__text">확인</span>
        </button>
      `;
    }

    return buttons
      .map((button, index) => {
        const { text, theme = "primary", size = "lg", callback } = button;
        const buttonId = `btn-${layeredName}-${index}`;

        // 콜백 함수를 전역에 저장하고 참조 ID 생성
        let callbackRef = null;
        if (callback) {
          if (typeof callback === "function") {
            // 함수인 경우 전역에 저장
            callbackRef = `callback_${layeredName}_${index}`;
            window[callbackRef] = callback;
          } else if (typeof callback === "string") {
            // 문자열인 경우 그대로 사용
            callbackRef = callback;
          }
        }

        return `
        <button 
          class="shc-btn theme-${theme} size-${size}" 
          type="button" 
          id="${buttonId}"
          data-callback="${callback ? "true" : "false"}"
          ${callbackRef ? `data-callback-function="${callbackRef}"` : ""}
        >
          <span class="shc-btn__text">${text}</span>
        </button>
      `;
      })
      .join("");
  }

  // 아이콘 클래스 결정
  getIconClass(type) {
    const iconMap = {
      alert: "shc-icon--alert size-56",
      confirm: "shc-icon--question size-56",
      success: "shc-icon--check size-56",
      error: "shc-icon--error size-56",
      warning: "shc-icon--warning size-56",
    };
    return iconMap[type] || "shc-icon size-56";
  }

  // 모달 템플릿 생성
  createModalTemplate({ layeredName, title, errorCode, content, iconClass, buttonsHtml, alignCenter }) {
    const centerClass = alignCenter ? " align-center" : "";
    return `
      <div class="shc-modal${centerClass}" data-layered-name="${layeredName}">
        <span class="${iconClass}"></span>
        ${title ? `<h2 class="shc-modal__title">${title}</h2>` : ""}
        ${errorCode ? `<p class="shc-modal__error-code">${errorCode}</p>` : ""}
        ${content ? `<div class="shc-modal__text">${content}</div>` : ""}
        <div class="shc-btn-group">
          ${buttonsHtml}
        </div>
      </div>
    `;
  }

  // 모달 닫기
  close(modalId = null) {
    const targetId = modalId || this.currentModalId;
    if (targetId) {
      gfn_layered.close(targetId);

      // DOM에서 제거
      const modal = document.querySelector(`[data-layered-name="${targetId}"]`);
      if (modal) {
        // 임시로 저장된 콜백 함수들 정리
        const buttons = modal.querySelectorAll("[data-callback-function]");
        buttons.forEach((button) => {
          const callbackRef = button.dataset.callbackFunction;
          if (callbackRef && callbackRef.startsWith("callback_")) {
            delete window[callbackRef];
          }
        });

        modal.remove();
      }

      // 콜백 실행
      if (this.onCloseCallback) {
        this.onCloseCallback();
        this.onCloseCallback = null;
      }

      if (modalId === this.currentModalId) {
        this.currentModalId = null;
      }
    }
  }

  // 버튼 이벤트 바인딩
  bindButtonEvents(modalId) {
    const modal = document.querySelector(`[data-layered-name="${modalId}"]`);
    if (!modal) return;

    const buttons = modal.querySelectorAll(".shc-btn");
    buttons.forEach((button) => {
      button.addEventListener("click", (e) => {
        e.preventDefault();

        const hasCallback = button.dataset.callback === "true";
        if (hasCallback) {
          // 콜백이 있는 경우 버튼 텍스트로 콜백 함수 찾기
          const buttonText = button.querySelector(".shc-btn__text").textContent;
          this.executeCallback(buttonText, modalId, button);
        } else {
          // 기본 닫기
          this.close(modalId);
        }
      });
    });
  }

  // 콜백 실행
  executeCallback(buttonText, modalId, button) {
    // 버튼에 설정된 콜백 함수 가져오기
    const buttonCallback = button.dataset.callbackFunction;
    let callbackFunction = null;

    // callbackFunction이 문자열인 경우 전역 함수에서 찾기
    if (buttonCallback && typeof window[buttonCallback] === "function") {
      callbackFunction = window[buttonCallback];
    }
    // callbackFunction이 함수인 경우 직접 사용
    else if (buttonCallback && typeof buttonCallback === "function") {
      callbackFunction = buttonCallback;
    }

    if (callbackFunction) {
      try {
        const result = callbackFunction(buttonText, modalId);
        // Promise인 경우 처리
        if (result && typeof result.then === "function") {
          result.then(() => this.close(modalId)).catch(() => this.close(modalId));
        } else {
          this.close(modalId);
        }
      } catch (error) {
        console.error("Callback execution error:", error);
        this.close(modalId);
      }
    } else {
      // 콜백이 없으면 기본 닫기
      this.close(modalId);
    }
  }
}

// 전역 인스턴스
const modalControl = new ModalManager();

//layerd Control
const layeredHistory = [];
const gfn_layered = {
  open(layeredName, event) {
    event?.target?.setAttribute("data-trigger", "here!");
    const targetSelector = `[data-layered-name="${layeredName}"]`;
    const layered = document.querySelector(targetSelector);

    if (layered) {
      //뒤로 가기 버튼 대비
      history.pushState({ popup: layeredName }, "", window.location.href);
      window.addEventListener("popstate", gfn_layered.close);
      layeredHistory.push(layeredName);

      // z-index와 DIM을 함께 관리
      const layerId = `layered-${layeredName}`;
      const zIndex = zIndexManager.openLayer(layerId, layered);

      layered.classList.add("is-active");
      gfn.focusTrap(targetSelector);

      //console.log(`Layer ${layeredName} opened with z-index: ${zIndex}`);
    } else {
      console.log("레이어팝업이 없습니다.");
    }
    $(targetSelector).on("click", ".shc-layered__close", function () {
      gfn_layered.close(layeredName);
    });
  },

  close(layeredName) {
    let targetLayeredName = layeredName;

    // 인수값이 없으면 현재 활성화된 레이어 중 가장 최근 것 닫기
    if (!layeredName) {
      if (zIndexManager.openLayers.length > 0) {
        const lastLayer = zIndexManager.openLayers[zIndexManager.openLayers.length - 1];
        targetLayeredName = lastLayer.id.replace("layered-", "");
      } else {
        console.log("닫을 레이어팝업이 없습니다.");
        return;
      }
    }

    const targetSelector = `[data-layered-name="${targetLayeredName}"]`;
    const layered = document.querySelector(targetSelector);

    if (layered) {
      // z-index와 DIM을 함께 관리
      const layerId = `layered-${targetLayeredName}`;
      zIndexManager.closeLayer(layerId);

      layered.classList.remove("is-active");
      gfn.releaseTrap(targetSelector);
      $("[data-trigger]").focus();
      $("[data-trigger]").removeAttr("data-trigger");

      // 드롭다운 바텀시트인 경우 DOM에서 완전히 제거
      if (targetLayeredName.startsWith("dropdown-bs-") && layered.classList.contains("shc-bottomsheet")) {
        layered.remove();
      }

      //console.log(`Layer ${targetLayeredName} closed`);
    }

    //뒤로 가기 버튼 대비
    const lastLayered = layeredHistory.pop();
    if (layeredHistory.length === 0) {
      window.removeEventListener("popstate", gfn_layered.close);
    }
  },

  // 모든 레이어 닫기
  closeAll() {
    zIndexManager.openLayers.forEach((layer) => {
      const layeredName = layer.id.replace("layered-", "");
      this.close(layeredName);
    });
  },

  // 현재 열린 레이어 수
  getOpenLayerCount() {
    return zIndexManager.openLayers.length;
  },
};

//Switch
const gfn_switchToggle = {
  init: function (selector = ".shc-switch-toggle") {
    this.$root = $(selector);
    if (!this.$root.length) return;

    this.bind();
    this.$root.each(function () {
      gfn_switchToggle.updateLabel($(this));
    });
  },
  bind: function () {
    this.$root.on("change", "input", function () {
      gfn_switchToggle.updateLabel($(this).closest(".shc-switch-toggle"));
    });
  },
  updateLabel: function ($switch) {
    const $switchToggleTxt = $switch.find(".shc-switch-toggle__track");
    const txtOn = $switchToggleTxt.data("on-txt");
    const txtOff = $switchToggleTxt.data("off-txt");
    const $input = $switch.find("input");
    const switchStatus = $input.prop("checked");
    const currentTxt = switchStatus ? txtOn : txtOff;

    // $input.attr("aria-pressed", switchStatus); 접근성이슈로 삭제
    $switchToggleTxt.find(".shc-switch-toggle__label").text(currentTxt);
  },
};

//Segment Switch
const gfn_segmentSwitch = {
  init: function (selector = ".shc-switch-segment") {
    this.$root = $(selector);
    if (!this.$root.length) return;

    this.bind();
    this.$root.each(function () {
      gfn_segmentSwitch.updatePosition($(this));
    });
  },
  bind: function () {
    this.$root.on("change", "input", function () {
      gfn_segmentSwitch.updatePosition($(this).closest(".shc-switch-segment"));
    });
  },
  updatePosition: function ($switch) {
    // jQuery 객체인지 확인
    if (!$switch || !$switch.jquery) {
      console.warn("Invalid jQuery object passed to updatePosition");
      return;
    }

    const $checkedInput = $switch.find("input:checked");

    // 체크된 input이 있는지 확인
    if (!$checkedInput.length) $switch.find(".shc-switch-segment__item input").prop("checked", true);

    const $label = $checkedInput.next("label");
    // label이 있는지 확인
    if (!$label.length || !$label.is(":visible")) console.warn("No label found");

    // DOM 업데이트를 기다린 후 위치 계산
    requestAnimationFrame(() => {
      try {
        const labelPosition = $label.position();
        const labelWidth = $label.outerWidth();

        // position()이 null을 반환할 수 있으므로 확인
        if (labelPosition && typeof labelPosition.left === "number" && typeof labelWidth === "number") {
          //console.log("Label position:", labelPosition.left, "Label width:", labelWidth);
          $switch.addClass("is-ready");
          $switch.css({ "--switch-width": labelWidth + "px", "--switch-position": labelPosition.left + "px" });
          // 여기서 실제 위치 업데이트 로직을 추가하세요
        } else {
          console.warn("Invalid position or width values", { position: labelPosition, width: labelWidth });
        }
      } catch (error) {
        console.error("Error getting label position:", error);
      }
    });
  },
};

//Input
const gfn_input = {
  init: function (selector = ".shc-input") {
    this.$root = $(selector);
    if (!this.$root.length) return;

    this.bind();
    this.$root.each(function (idex, item) {
      gfn_input.validation($(item));
    });
  },
  status(inputId, status, msg) {
    let $input = $("#" + inputId).closest(".shc-input, .shc-dropdown");
    let $form = $("#" + inputId).closest(".shc-form");

    if (status === "error") {
      $("#" + inputId).attr("aria-invalid", true);
      $("#" + inputId).focus();
      if (msg) {
        $("#" + inputId)
          .closest(".shc-form")
          .find(".shc-form__validation")
          .text(msg);
      }
    } else if (status === "disabled") {
      $("#" + inputId).attr("disabled", "disabled");
    } else if (status === "readonly") {
      $("#" + inputId).attr("readonly", "readonly");
    } else {
      $("#" + inputId).removeAttr("readonly disabled aria-invalid");
      status = "";
    }
    if ($input.length) $input.attr("data-status", status);
    if ($form.length) $form.attr("data-status", status);
  },
  focusIn(inputId) {
    $(inputId).closest(".shc-input").attr("data-focus", "true");
  },
  focusOut(inputId) {
    $(inputId).closest(".shc-input").removeAttr("data-focus");
  },
  bind: function () {
    this.$root
      .on("click", "button.shc-icon--clear", function () {
        $(this).siblings("input, textarea").val("");
        $(this).siblings("input, textarea").focus();
      })
      .on("focus", "input, textarea", function () {
        gfn_input.focusIn(this);
      })
      .on("blur", "input, textarea", function () {
        gfn_input.focusOut(this);
      });
  },
  validation: function ($input) {
    //placeholder가 누락되어 에러가 나는 경우방지
    if ($input.find("button.shc-icon--clear").length) {
      if (!$input.find("input").attr("placeholder")) $input.find("input").attr("placeholder", "");
    }
  },
};

//Form
const gfn_form = {
  init: function (selector = ".shc-form") {
    this.$root = $(selector);
    if (!this.$root.length) return;

    let total = this.$root.length;
    this.$root.each(function (idx, item) {
      gfn_form.setMax($(item).find("input, textarea"));
      if (total - 1 === idx) gfn_form.bind();
    });
  },
  bind: function () {
    if (!gfn.isEmpty(this.$root.find("input, textarea").attr("maxlength"))) {
      this.$root.find("input, textarea").on("keyup", function () {
        gfn_form.sliceMax($(this));
      });
    }
  },
  setMax: function ($input) {
    let maxLength = $input.attr("maxlength");
    let $total = $input.closest(".shc-form").find(".shc-form__counter-total");
    if (gfn.isEmpty(maxLength)) {
      $input.attr("maxlength", parseInt($total.text()));
    } else if (!gfn.isEmpty($total.text())) {
      $total.text(maxLength);
    }
  },
  sliceMax: function ($input) {
    let maxLength = $input.attr("maxlength");
    let $counter = $input.closest(".shc-form").find(".shc-form__counter-current");
    if (maxLength !== null && $counter.length > 0) {
      if ($input.val().length > maxLength) {
        $input.val($input.val().slice(0, maxLength));
      }
      $counter.text($input.val().length);
    }
  },
};

//Dropdown
const gfn_dropdown = {
  init() {
    this.initializeSelectedItems();
    this.bind();
  },
  initializeSelectedItems() {
    document.querySelectorAll(".shc-dropdown").forEach((wrapper) => {
      const trigger = wrapper.querySelector(".shc-dropdown__btn");
      const valueSpan = trigger.querySelector(".shc-dropdown__btn-value");
      const activeItem = wrapper.querySelector(".shc-dropdown__option-item.is-active");

      if (activeItem && valueSpan) {
        const textElement = activeItem.querySelector(".shc-dropdown__option-item-text");
        if (textElement) {
          const text = textElement.textContent;
          valueSpan.textContent = text;
        } else {
          // .shc-dropdown__option-item-text가 없는 경우 (input()으로 생성된 경우) 전체 HTML 복사
          const itemContent = activeItem.innerHTML;
          valueSpan.innerHTML = itemContent;
        }
        valueSpan.classList.remove("shc-dropdown__btn-placeholder");
      }
    });
  },
  bind() {
    document.querySelectorAll(".shc-dropdown").forEach((wrapper) => {
      const trigger = wrapper.querySelector(".shc-dropdown__btn");

      if (!trigger || trigger.disabled || trigger.hasAttribute("readonly")) return;

      // 원래 플레이스홀더 텍스트를 data-placeholder에 저장 (최초 한 번만)
      if (!wrapper.hasAttribute("data-placeholder")) {
        const placeholder = wrapper.querySelector(".shc-dropdown__btn-placeholder")?.textContent;
        if (placeholder) {
          wrapper.setAttribute("data-placeholder", placeholder);
        }
      }

      // 버튼 클릭 이벤트만 바인딩 (옵션 이벤트는 드롭다운이 열릴 때 바인딩)
      trigger.addEventListener("click", (e) => {
        e.preventDefault();
        this.handleButtonClick(wrapper, trigger);
      });

      // 키보드 네비게이션
      trigger.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          trigger.click();
        } else if (e.key === "Escape") {
          trigger.setAttribute("aria-expanded", "false");
          wrapper.classList.remove("is-open");
          trigger.focus();
        }
      });

      // 외부 클릭으로 닫기
      document.addEventListener("click", (e) => {
        if (!wrapper.contains(e.target)) {
          trigger.setAttribute("aria-expanded", "false");
          wrapper.classList.remove("is-open");
          this.removeOptionEventListeners(wrapper);
        }
      });
    });
  },
  // 버튼 클릭 처리
  handleButtonClick(wrapper, trigger) {
    const valueSpan = trigger.querySelector(".shc-dropdown__btn-value");
    const items = wrapper.querySelectorAll(".shc-dropdown__option-item");

    // call-bs 클래스가 있으면 바텀시트로 열기
    if (wrapper.dataset.call === "bottomsheet") {
      this.openBottomSheet(wrapper, trigger, valueSpan, items);
      return;
    }

    const isExpanded = trigger.getAttribute("aria-expanded") === "true";

    // Close all other dropdowns
    document.querySelectorAll(".shc-dropdown").forEach((otherWrapper) => {
      if (otherWrapper !== wrapper) {
        const otherTrigger = otherWrapper.querySelector(".shc-dropdown__btn");
        if (otherTrigger) {
          otherTrigger.setAttribute("aria-expanded", "false");
          otherWrapper.classList.remove("is-open");
          this.removeOptionEventListeners(otherWrapper);
        }
      }
    });

    // Toggle current dropdown
    trigger.setAttribute("aria-expanded", !isExpanded);
    if (!isExpanded) {
      wrapper.classList.add("is-open");
      this.bindOptionEvents(wrapper, trigger, valueSpan, items);
    } else {
      wrapper.classList.remove("is-open");
      this.removeOptionEventListeners(wrapper);
    }
  },
  // 옵션 이벤트 바인딩
  bindOptionEvents(wrapper, trigger, valueSpan, items) {
    // 기존 이벤트 리스너 제거
    this.removeOptionEventListeners(wrapper);

    items.forEach((item) => {
      // 클릭 이벤트
      item.addEventListener("click", (e) => {
        e.preventDefault();

        // Update selected state
        items.forEach((i) => {
          i.classList.remove("is-active");
          i.removeAttribute("aria-selected");
        });
        item.classList.add("is-active");
        item.setAttribute("aria-selected", "true");

        // Update trigger content (HTML을 그대로 복사)
        const itemContent = item.innerHTML;
        valueSpan.innerHTML = itemContent;
        valueSpan.classList.remove("shc-dropdown__btn-placeholder");

        // Close dropdown
        trigger.setAttribute("aria-expanded", "false");
        wrapper.classList.remove("is-open");
        this.removeOptionEventListeners(wrapper);
      });

      // 키보드 이벤트
      item.setAttribute("tabindex", "0");
      item.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          item.click();
        }
      });
    });

    // Arrow key navigation within dropdown
    const arrowKeyHandler = (e) => {
      const isOpen = trigger.getAttribute("aria-expanded") === "true";
      if (!isOpen) return;

      const currentIndex = Array.from(items).findIndex((item) => item.classList.contains("is-active"));

      if (e.key === "ArrowDown") {
        e.preventDefault();
        const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        items[nextIndex].focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        items[prevIndex].focus();
      }
    };

    wrapper.addEventListener("keydown", arrowKeyHandler);
    wrapper.setAttribute("data-arrow-key-handler", "true");
  },
  // 옵션 이벤트 리스너 제거
  removeOptionEventListeners(wrapper) {
    const items = wrapper.querySelectorAll(".shc-dropdown__option-item");

    // 기존 이벤트 리스너들을 제거하기 위해 새로운 요소로 교체
    items.forEach((item) => {
      const newItem = item.cloneNode(true);
      item.parentNode.replaceChild(newItem, item);
    });

    // Arrow key handler 제거
    if (wrapper.getAttribute("data-arrow-key-handler")) {
      wrapper.removeEventListener("keydown", wrapper.arrowKeyHandler);
      wrapper.removeAttribute("data-arrow-key-handler");
    }
  },
  // 드랍다운 데이터 입력
  input(btnID, arr, activeIdx, template) {
    // 첫 번째 인자: id로 드롭다운 요소 찾기
    const dropdownBtn = document.getElementById(btnID);
    if (!dropdownBtn) {
      console.error(`Dropdown element with id "${id}" not found`);
      return;
    }

    // 두 번째 인자: arr 배열로 옵션 생성
    if (!Array.isArray(arr) || arr.length === 0) {
      console.error("Invalid or empty array provided for dropdown options");
      return;
    }

    // 옵션 컨테이너 찾기
    const dropdownWrapper = dropdownBtn.closest(".shc-dropdown");
    const optionContainer = dropdownWrapper.querySelector(".shc-dropdown__option");

    if (!optionContainer) {
      console.error(`Option container not found in dropdown with id "${btnID}"`);
      return;
    }

    // 기존 옵션들 제거
    optionContainer.innerHTML = "";

    // 옵션 HTML 생성
    let optionsHtml = "";
    arr.forEach((item, index) => {
      let optionContent = "";

      // 네 번째 인자: template 처리
      if (template) {
        if (typeof template === "function") {
          // template이 함수인 경우 함수를 호출하여 item을 전달
          optionContent = template(item);
        } else if (typeof template === "string") {
          // template이 문자열인 경우 {} 부분을 item으로 치환
          optionContent = template.replace(/\{\}/g, item);
        }
      } else {
        // template이 없으면 기본 텍스트로 표시
        optionContent = item;
      }

      // 세 번째 인자: activeIdx와 일치하는 인덱스에 is-active 클래스 추가
      const isActive = index === activeIdx ? " is-active" : "";
      const ariaSelected = index === activeIdx ? ' aria-selected="true"' : "";

      // data-value 설정 (객체인 경우 JSON으로 변환, 아니면 그대로)
      const dataValue = typeof item === "object" ? JSON.stringify(item) : item;

      optionsHtml += `
        <li class="shc-dropdown__option-item${isActive}" data-value="${dataValue}"${ariaSelected}>
          ${template ? optionContent : `<span class="shc-dropdown__option-item-text">${optionContent}</span>`}
        </li>
      `;
    });

    // 옵션 HTML 삽입
    optionContainer.innerHTML = optionsHtml;

    // 초기 활성화된 옵션이 있으면 드롭다운 버튼의 값도 업데이트
    if (activeIdx !== undefined && activeIdx !== null && activeIdx >= 0 && activeIdx < arr.length) {
      const valueSpan = dropdownBtn.querySelector(".shc-dropdown__btn-value");

      if (valueSpan) {
        let displayContent = "";
        if (template) {
          if (typeof template === "function") {
            // template이 함수인 경우 함수를 호출하여 item을 전달
            displayContent = template(arr[activeIdx]);
          } else if (typeof template === "string") {
            // template이 문자열인 경우 {} 부분을 item으로 치환
            displayContent = template.replace(/\{\}/g, arr[activeIdx]);
          }
        } else {
          displayContent = arr[activeIdx];
        }

        valueSpan.innerHTML = displayContent;
        valueSpan.classList.remove("shc-dropdown__btn-placeholder");
      }
    }
  },
  //커스텀 드랍다운일 경우 값 입력
  setValue(event, dropdownID) {
    const selectedDropdown = document.getElementById(dropdownID);

    // event.target이 span일 수 있으므로 closest로 버튼 찾기
    const button = event.target.closest(".shc-dropdown__option-item");
    if (!button) {
      console.warn("Button element not found");
      return;
    }

    const textElement = button.querySelector(".shc-dropdown__option-item-text");
    if (!textElement) {
      console.warn("Text element not found");
      return;
    }

    const selectedValue = textElement.textContent;

    selectedDropdown.querySelector(".shc-dropdown__btn-value").classList.remove("shc-dropdown__btn-placeholder");
    selectedDropdown.querySelector(".shc-dropdown__btn-value").textContent = selectedValue;

    gfn_layered.closeAll();
  },
  // 바텀시트 열기
  openBottomSheet(wrapper, trigger, valueSpan, items) {
    const layerClass = wrapper.getAttribute("data-class");
    const dropdownId = wrapper.getAttribute("data-dropdown-id") || `dropdown-${Date.now()}`;
    const layeredName = `dropdown-bs-${dropdownId}`;

    // 기존 바텀시트가 있으면 제거
    const existingBs = document.querySelector(`[data-layered-name="${layeredName}"]`);
    if (existingBs) {
      existingBs.remove();
    }

    // 바텀시트 템플릿 생성
    const bsTemplate = this.createBottomSheetTemplate(layeredName, items, valueSpan, layerClass);

    // body에 바텀시트 추가
    document.body.insertAdjacentHTML("beforeend", bsTemplate);

    // 바텀시트 열기
    gfn_layered.open(layeredName, { target: trigger });

    // 바텀시트 내부 아이템 클릭 이벤트 바인딩
    this.bindBottomSheetItems(layeredName, wrapper, trigger, valueSpan);
  },
  // 바텀시트 템플릿 생성
  createBottomSheetTemplate(layeredName, items, valueSpan, layerClass) {
    // shc-dropdown의 data-title 값 또는 원래 플레이스홀더 텍스트 사용
    const wrapper = valueSpan.closest(".shc-dropdown");
    const dataTitle = wrapper?.getAttribute("data-title");
    layerClass = layerClass === null ? "" : layerClass;

    // 원래 플레이스홀더 텍스트를 data 속성에서 가져오거나 직접 찾기
    let placeholder = wrapper?.getAttribute("data-placeholder");
    if (!placeholder) {
      // data-placeholder가 없으면 현재 플레이스홀더 요소에서 가져오기
      placeholder = wrapper?.querySelector(".shc-dropdown__btn-placeholder")?.textContent;
    }

    const title = dataTitle || placeholder || "옵션 선택";

    let itemsHtml = "";
    items.forEach((item, index) => {
      // HTML 내용을 그대로 복사 (텍스트만이 아닌 전체 HTML)
      const itemContent = item.innerHTML;
      const isActive = item.classList.contains("is-active") ? "is-active" : "";
      itemsHtml += `
        <button class="shc-dropdown__option-item ${isActive}" data-index="${index}">
          ${itemContent}
        </button>
      `;
    });

    return `
      <div class="shc-bottomsheet ${layerClass}" data-layered-name="${layeredName}">
        <div class="shc-bottomsheet__header">
          <h2 class="shc-bottomsheet__title">${title}</h2>          
        </div>
        <div class="shc-bottomsheet__content is-full">
          <div class="shc-dropdown__option in-bottomsheet">
            ${itemsHtml}
          </div>
        </div>
        <button class="shc-layered__close shc-icon--close--black"><span class="sr-only">팝업 닫기</span></button>
      </div>
    `;
  },
  // 바텀시트 내부 아이템 클릭 이벤트 바인딩
  bindBottomSheetItems(layeredName, originalWrapper, trigger, valueSpan) {
    const bsElement = document.querySelector(`[data-layered-name="${layeredName}"]`);
    if (!bsElement) return;

    const bsItems = bsElement.querySelectorAll(".shc-dropdown__option-item");

    bsItems.forEach((bsItem, index) => {
      bsItem.addEventListener("click", (e) => {
        e.preventDefault();

        // 원본 드롭다운의 해당 아이템 찾기
        const originalItems = originalWrapper.querySelectorAll(".shc-dropdown__option-item");
        const originalItem = originalItems[index];

        if (originalItem) {
          // 원본 드롭다운의 모든 아이템에서 is-active 제거
          const allOriginalItems = originalWrapper.querySelectorAll(".shc-dropdown__option-item");
          allOriginalItems.forEach((i) => {
            i.classList.remove("is-active");
            i.removeAttribute("aria-selected");
          });

          // 선택된 아이템에 is-active 추가
          originalItem.classList.add("is-active");
          originalItem.setAttribute("aria-selected", "true");

          // 바텀시트의 HTML 내용을 원본 드롭다운의 valueSpan에 복사
          const textElement = bsItem.querySelector(".shc-dropdown__option-item-text");
          let bsItemContent;

          if (textElement) {
            // 기존 구조 (.shc-dropdown__option-item-text가 있는 경우)
            bsItemContent = textElement.innerHTML;
          } else {
            // input()으로 생성된 구조 (전체 HTML을 그대로 복사)
            bsItemContent = bsItem.innerHTML;
          }

          valueSpan.innerHTML = bsItemContent;
          valueSpan.classList.remove("shc-dropdown__btn-placeholder");

          // callback 호출
          const selectedValue = originalItem.getAttribute("data-value") || bsItemContent;
          const selectedText = bsItemContent;
          const dropdownElement = originalWrapper;

          this.callback(selectedValue, selectedText, dropdownElement);
        }

        // 바텀시트 닫기
        gfn_layered.close(layeredName);
      });
    });
  },
  callback: function (selectedValue, selectedText, dropdownElement) {
    console.log("드롭다운 선택됨:", selectedValue, selectedText);
  },
};

//TAB
const gfn_tab = {
  init: function (selector = ".shc-tab") {
    this.$root = $(selector);
    if (!this.$root.length) return;

    this.bind(selector);
    this.$root.each(function () {
      const $tab = $(this);
      if (($tab.hasClass("type-segment") || $tab.hasClass("type-btn")) && !$tab.hasClass("is-scroll")) {
        gfn_tab.updatePosition($tab);
      }
    });
  },
  bind(selector) {
    const tabContainers = document.querySelectorAll(selector);

    tabContainers.forEach((tabContainer) => {
      const isScrollable = tabContainer.classList.contains("is-scroll");
      const tabMenu = tabContainer.querySelector(".shc-tab__menu");

      const handleTabChange = (targetTab) => {
        const btns = tabContainer.querySelectorAll(".shc-tab__btn");
        const panels = tabContainer.querySelectorAll(".shc-tab__panel");

        btns.forEach((b) => {
          b.classList.remove("is-active");
          b.setAttribute("aria-selected", "false");
        });
        panels.forEach((p) => {
          p.classList.remove("is-active");
          p.setAttribute("aria-hidden", "true");
        });

        targetTab.classList.add("is-active");
        targetTab.setAttribute("aria-selected", "true");

        const id = targetTab.getAttribute("aria-controls");
        if (id) {
          const panel = tabContainer.querySelector(`#${id}`);
          if (panel) {
            panel.classList.add("is-active");
            panel.setAttribute("aria-hidden", "false");
          }
        }

        // 탭 위치 업데이트 (type-segment 또는 type-btn인 경우만, is-scroll 제외)
        const $tabContainer = $(tabContainer);
        if (
          ($tabContainer.hasClass("type-segment") || $tabContainer.hasClass("type-btn")) &&
          !$tabContainer.hasClass("is-scroll")
        ) {
          gfn_tab.updatePosition($tabContainer);
        }
      };

      if (isScrollable) {
        // Swiper 구조 만들기
        const swiperWrapper = document.createElement("div");
        swiperWrapper.classList.add("swiper-wrapper");

        tabContainer.querySelectorAll(".shc-tab__btn").forEach((button) => {
          const slide = document.createElement("div");
          slide.classList.add("swiper-slide");
          slide.appendChild(button.cloneNode(true));
          swiperWrapper.appendChild(slide);
        });

        // Prev / Next 버튼 접근성 추가
        const prevBtn = document.createElement("div");
        prevBtn.className = "swiper-button-prev";
        prevBtn.setAttribute("role", "button");
        prevBtn.setAttribute("tabindex", "0");
        prevBtn.setAttribute("aria-label", "이전 탭");

        const nextBtn = document.createElement("div");
        nextBtn.className = "swiper-button-next";
        nextBtn.setAttribute("role", "button");
        nextBtn.setAttribute("tabindex", "0");
        nextBtn.setAttribute("aria-label", "다음 탭");

        tabMenu.innerHTML = "";
        tabMenu.appendChild(swiperWrapper);
        tabMenu.appendChild(prevBtn);
        tabMenu.appendChild(nextBtn);
        tabMenu.classList.add("swiper");

        // Swiper 초기화 (Swiper가 로드된 경우에만)
        let swiperLeft = 0;
        const initSwiper = () => {
          if (typeof Swiper !== "undefined") {
            const swiper = new Swiper(tabMenu, {
              speed: 300,
              slidesPerView: "auto",
              freeMode: false, // 한 칸씩 정확히 이동
              spaceBetween: 20,
              mousewheel: { forceToAxis: true },
              navigation: {
                nextEl: nextBtn,
                prevEl: prevBtn,
              },
              on: {
                slideChangeTransitionEnd: function (swiper) {
                  swiperLeft = swiper.translate;

                  gfn_tab.updatePosition($(tabContainer), swiperLeft);
                },
              },
            });

            const newBtns = tabMenu.querySelectorAll(".shc-tab__btn");
            let currentTabIndex = 0;

            const goToTab = (idx) => {
              if (idx < 0 || idx >= newBtns.length) return;
              currentTabIndex = idx;
              swiper.slideTo(idx, 300);
              handleTabChange(newBtns[idx]);

              // 슬라이드 완료 후 위치 업데이트
              setTimeout(() => {
                gfn_tab.updatePosition($(tabContainer), swiperLeft);
              }, 350); // 슬라이드 애니메이션 시간(300ms) + 여유시간
              //updateNavButtons();
            };

            // 탭 버튼 클릭 / 키보드
            newBtns.forEach((btn, i) => {
              btn.addEventListener("click", (e) => {
                e.preventDefault();
                goToTab(i);
              });
              btn.addEventListener("keydown", (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  goToTab(i);
                } else if (e.key === "ArrowRight") {
                  e.preventDefault();
                  goToTab(i + 1);
                } else if (e.key === "ArrowLeft") {
                  e.preventDefault();
                  goToTab(i - 1);
                }
              });
            });

            // Prev / Next 버튼 클릭 + 키보드
            const handleNavKey = (e, direction) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (direction === "prev") goToTab(currentTabIndex - 1);
                if (direction === "next") goToTab(currentTabIndex + 1);
              }
            };

            prevBtn.addEventListener("click", () => goToTab(currentTabIndex - 1));
            nextBtn.addEventListener("click", () => goToTab(currentTabIndex + 1));

            prevBtn.addEventListener("keydown", (e) => handleNavKey(e, "prev"));
            nextBtn.addEventListener("keydown", (e) => handleNavKey(e, "next"));

            // 초기화
            goToTab(0);

            window.addEventListener("resize", () => swiper.update());
          }
        };

        // Swiper 로드 대기
        if (typeof Swiper !== "undefined") {
          initSwiper();
        } else {
          // Swiper가 로드될 때까지 대기
          const checkSwiper = setInterval(() => {
            if (typeof Swiper !== "undefined") {
              clearInterval(checkSwiper);
              initSwiper();
            }
          }, 100);

          // 5초 후에도 Swiper가 로드되지 않으면 대기 중단
          setTimeout(() => {
            clearInterval(checkSwiper);
            console.warn("Swiper library not loaded. Scroll tabs will not work.");
          }, 5000);
        }
      } else {
        // 일반 탭
        const tabButtons = tabContainer.querySelectorAll(".shc-tab__btn");
        tabButtons.forEach((button) => {
          button.addEventListener("click", (e) => {
            e.preventDefault();
            handleTabChange(button);
          });
          button.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleTabChange(button);
            }
          });
        });
      }
    });
  },

  updatePosition: function ($tab, swiperLeft) {
    // jQuery 객체인지 확인
    if (!$tab || !$tab.jquery) {
      console.warn("Invalid jQuery object passed to updatePosition");
      return;
    }

    const $activeBtn = $tab.find(".shc-tab__btn.is-active");

    // 활성화된 탭 버튼이 있는지 확인
    if (!$activeBtn.length) {
      console.warn("No active tab button found");
      return;
    }

    // 요소가 보이는지 확인
    if (!$activeBtn.is(":visible")) {
      console.warn("Active tab button is not visible");
      return;
    }

    // DOM 업데이트를 기다린 후 위치 계산
    requestAnimationFrame(() => {
      try {
        let btnPosition, btnWidth;

        // 스와이퍼 구조인지 확인 (.swiper-slide가 있는지)
        const $swiperSlide = $activeBtn.closest(".swiper-slide");
        if ($swiperSlide.length) {
          swiperLeft = !swiperLeft ? 0 : swiperLeft;

          btnPosition = $swiperSlide.position();
          btnPosition.left += swiperLeft; // wrapper 이동값 추가
          btnWidth = $swiperSlide.outerWidth();
        } else {
          // 일반 구조: 버튼 자체의 위치와 너비 사용
          btnPosition = $activeBtn.position();
          btnWidth = $activeBtn.outerWidth();
        }

        // position()이 null을 반환할 수 있으므로 확인
        if (btnPosition && typeof btnPosition.left === "number" && typeof btnWidth === "number") {
          // CSS 변수로 위치와 너비 설정
          const $swiperSlide = $activeBtn.closest(".swiper-slide");
          const leftPadding = $swiperSlide.length ? 20 : 0; // leftPadding 값

          $tab.find(".shc-tab__menu").addClass("is-ready");
          $tab.find(".shc-tab__menu").css({
            "--tab-position": btnPosition.left + leftPadding + "px",
            "--tab-width": btnWidth + "px",
          });
        } else {
          console.warn("Invalid position or width values", { position: btnPosition, width: btnWidth });
        }
      } catch (error) {
        console.error("Error getting tab position:", error);
      }
    });
  },
};

//ACCORDION
const gfn_accordion = {
  init: function (selector = ".shc-accordion") {
    this.$root = $(selector);
    if (!this.$root.length) return;

    this.initializeOpenStates();
    this.bind(selector);
  },
  initializeOpenStates() {
    // 최초 상태에서 trigger에 is-active가 있으면 기본적으로 열어줌
    this.$root.each((index, accordion) => {
      const $accordion = $(accordion);
      const $trigger = $accordion.find(".shc-accordion__trigger");
      const $content = $accordion.find(".shc-accordion__content");

      if ($trigger.hasClass("is-active")) {
        $trigger.attr("aria-expanded", "true");
        $content.attr("aria-hidden", "false");
        if ($trigger.closest(".type-terms").length > 0) {
          $trigger.closest(".type-terms").addClass("is-open");
        }
      } else {
        $trigger.attr("aria-expanded", "false");
        $content.attr("aria-hidden", "true");
        if ($trigger.closest(".type-terms").length > 0) {
          $trigger.closest(".type-terms").removeClass("is-open");
        }
      }
    });
  },
  bind(selector) {
    this.$root.on("click", ".shc-accordion__trigger", function (e) {
      e.preventDefault();

      const $trigger = $(this);
      const $accordion = $trigger.closest(".shc-accordion");
      const $content = $accordion.find(".shc-accordion__content");
      const isExpanded = $trigger.attr("aria-expanded") === "true";

      // 현재 상태 토글
      if (isExpanded) {
        // 닫기 - slideUp 애니메이션
        $trigger.attr("aria-expanded", "false");
        $content.attr("aria-hidden", "true");
        $trigger.removeClass("is-active");
        // $content.slideUp(300);
        if ($trigger.closest(".type-terms").length > 0) {
          $trigger.closest(".type-terms").removeClass("is-open");
        }
      } else {
        // 열기 - slideDown 애니메이션
        $trigger.attr("aria-expanded", "true");
        $content.attr("aria-hidden", "false");
        $trigger.addClass("is-active");
        // $content.slideDown(300);
        if ($trigger.closest(".type-terms").length > 0) {
          $trigger.closest(".type-terms").addClass("is-open");
        }
      }
    });
  },
};

// Modal
const gfn_modal = {
  // 알림 모달
  alert: (options) => {
    return modalControl.show({
      type: "alert",
      ...options,
    });
  },

  // 확인 모달
  confirm: (options) => {
    return modalControl.show({
      type: "confirm",
      buttons: [
        { text: "예", theme: "primary", callback: true },
        { text: "아니오", theme: "secondary", callback: true },
      ],
      ...options,
    });
  },

  // 모달 닫기
  close: (modalId) => {
    modalControl.close(modalId);
  },
};

// ESC 키로 레이어 닫기
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    gfn_layered.closeAll();

    // Close all overflow menus and focus back to triggers
    document.querySelectorAll(".shc-overflow-menu.is-active").forEach((menu) => {
      const menuName = menu.getAttribute("data-overflowmenu-name");
      menu.classList.remove("is-active");
      gfn.releaseTrap(`.shc-overflow-menu[data-overflowmenu-name="${menuName}"]`);

      // Find and focus the trigger button for this menu
      const triggerButtons = document.querySelectorAll(`button[onclick*="${menuName}"]`);
      if (triggerButtons.length > 0) {
        // Focus the first trigger button found
        triggerButtons[0].focus();
      }
    });
  }
});

//BREADCRUMB
const gfn_breadcrumb = {
  init() {
    // 개발 모드에서만 실행
    if (process.env.NODE_ENV === "development") {
      if (window.pageBreadcrumb) {
        this.renderBreadcrumb();
      } else {
        const breadcrumb = document.querySelector(".shc-breadcrumb");
        if (breadcrumb) {
          breadcrumb.remove();
        }
      }
    }
  },

  renderBreadcrumb() {
    const breadcrumbNav = document.querySelector(".shc-breadcrumb ol");
    if (!breadcrumbNav) return;

    let breadcrumbHtml = "";

    // 맨 앞에 "홈" 추가
    breadcrumbHtml += `<li><a href="/">홈</a></li>`;

    window.pageBreadcrumb.forEach((item, index) => {
      const isLast = index === window.pageBreadcrumb.length - 1;

      if (isLast) {
        // 마지막 항목은 현재 페이지로 표시
        breadcrumbHtml += `<li aria-current="page">${item.text}</li>`;
      } else {
        // 링크가 있는 경우
        if (item.url) {
          breadcrumbHtml += `<li><a href="${item.url}">${item.text}</a></li>`;
        } else {
          // 링크가 없는 경우
          breadcrumbHtml += `<li>${item.text}</li>`;
        }
      }
    });

    breadcrumbNav.innerHTML = breadcrumbHtml;
  },
};

//Tooltip
const gfn_tooltip = {
  init() {
    // 삽입된 Tippy 기본 스타일 제거
    const styleTag = document.querySelector("style[data-tippy-stylesheet]");
    if (styleTag) styleTag.remove();

    // 모든 툴팁 대상
    const targets = document.querySelectorAll(".shc-tooltip-target");

    targets.forEach((target) => {
      if (target._tippy) return; // 이미 초기화된 경우 스킵

      const originalText = target.getAttribute("data-tippy-content") || "";
      const placement = target.dataset.placement || "right-start"; //top-start top-end bottom-start bottom-end left-start left-end right-start right-end
      const trigger = target.dataset.trigger || "click";

      tippy(target, {
        allowHTML: true,
        interactive: true,
        theme: "sch-tooltip",
        trigger,
        placement,
        hideOnClick: true,
        appendTo: document.body,
        content: document.createElement("div"), // 빈 요소로 시작
        onShow(instance) {
          // 내용과 버튼을 넣음
          const tooltipEl = document.createElement("div");
          tooltipEl.className = "shc-tooltip__content";
          tooltipEl.innerHTML = originalText;

          const closeBtn = document.createElement("button");
          closeBtn.type = "button";
          closeBtn.className = "shc-tooltip__btn";
          closeBtn.setAttribute("aria-label", "닫기");
          // closeBtn.textContent = '×';
          tooltipEl.appendChild(closeBtn);

          // 닫기 버튼 이벤트
          closeBtn.addEventListener("click", () => instance.hide());

          instance.setContent(tooltipEl);
        },
      });
    });
  },
};

//Overflow Menu
const gfn_overflow = {
  call(e, name) {
    let target = e.target;

    // Get the overflow menu element
    const overflowMenu = document.querySelector(`.shc-overflow-menu[data-overflowmenu-name="${name}"]`);
    if (!overflowMenu) {
      console.warn(`Overflow menu with name "${name}" not found`);
      return;
    }

    // Toggle functionality - check if menu is already open
    const isOpen = overflowMenu.classList.contains("is-active");

    if (isOpen) {
      // Close the menu
      overflowMenu.classList.remove("is-active");
      gfn.releaseTrap(`.shc-overflow-menu[data-overflowmenu-name="${name}"]`);
      // Focus back to trigger button
      target.focus();
      return;
    }

    // Close all other overflow menus first
    document.querySelectorAll(".shc-overflow-menu.is-active").forEach((menu) => {
      const menuName = menu.getAttribute("data-overflowmenu-name");
      menu.classList.remove("is-active");
      gfn.releaseTrap(`.shc-overflow-menu[data-overflowmenu-name="${menuName}"]`);

      // Focus back to trigger button for the closed menu
      const triggerButtons = document.querySelectorAll(`button[onclick*="${menuName}"]`);
      if (triggerButtons.length > 0) {
        triggerButtons[0].focus();
      }
    });

    // Get the position of the target element
    const targetRect = target.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Calculate position for the overflow menu
    let left = targetRect.left;
    let top = targetRect.bottom + 4 + window.scrollY; // 4px gap below the button + scroll offset

    // Determine if trigger is on left or right side of viewport
    const viewportCenter = viewportWidth / 2;
    const isTriggerOnLeft = targetRect.left < viewportCenter;

    // Adjust horizontal position based on trigger position
    const menuWidth = overflowMenu.offsetWidth || 200; // fallback width
    if (isTriggerOnLeft) {
      // Left side - use left positioning, align with trigger left edge
      if (left + menuWidth > viewportWidth) {
        left = viewportWidth - menuWidth - 16; // 16px margin from edge
      }
      overflowMenu.style.left = `${left}px`;
      overflowMenu.style.right = "auto";
    } else {
      // Right side - use right positioning, align with trigger right edge
      const right = viewportWidth - targetRect.right;
      if (right + menuWidth > viewportWidth) {
        const adjustedRight = 16; // 16px margin from edge
        overflowMenu.style.right = `${adjustedRight}px`;
        overflowMenu.style.left = "auto";
      } else {
        overflowMenu.style.right = `${right}px`;
        overflowMenu.style.left = "auto";
      }
    }

    // Adjust vertical position if menu would overflow viewport
    const menuHeight = overflowMenu.offsetHeight || 200; // fallback height
    if (top + menuHeight > viewportHeight + window.scrollY) {
      // Position above the button instead
      top = targetRect.top - menuHeight - 8 + window.scrollY; // 8px gap above the button + scroll offset
    }

    // Ensure minimum margins from viewport edges
    if (isTriggerOnLeft) {
      left = Math.max(16, Math.min(left, viewportWidth - menuWidth - 16));
      overflowMenu.style.left = `${left}px`;
    }
    top = Math.max(16 + window.scrollY, Math.min(top, viewportHeight + window.scrollY - menuHeight - 16));

    // Apply position to the overflow menu
    overflowMenu.style.top = `${top}px`;
    overflowMenu.classList.add("is-active");

    // Apply focus trap
    gfn.focusTrap(`.shc-overflow-menu[data-overflowmenu-name="${name}"]`);

    // Add click outside to close functionality
    const closeMenu = (event) => {
      if (!overflowMenu.contains(event.target) && event.target !== target) {
        overflowMenu.classList.remove("is-active");
        gfn.releaseTrap(`.shc-overflow-menu[data-overflowmenu-name="${name}"]`);
        // Focus back to trigger button
        target.focus();
        document.removeEventListener("click", closeMenu);
      }
    };

    // Remove any existing click listeners
    document.removeEventListener("click", closeMenu);

    // Add new click listener with a small delay to prevent immediate closing
    setTimeout(() => {
      document.addEventListener("click", closeMenu);
    }, 10);
  },
};

//on load
$(function () {
  gfn_theme.init();
  gfn_switchToggle.init();
  gfn_segmentSwitch.init();
  gfn_input.init();
  gfn_dropdown.init();
  gfn_form.init();
  gfn_tab.init();
  gfn_accordion.init();
  gfn_breadcrumb.init();
  gfn.getDeviceType();
  gfn.setViewportH();
  gfn.isBodyScrollable();
  gfn_tooltip.init();
});

//on resize
$(window).on("resize", function () {
  gfn.setViewportH();
  gfn.isBodyScrollable();
});

//전역 설정은 파일 맨 아래로 이동
Object.assign(window, {
  gfn,
  gfn_theme,
  gfn_layered,
  gfn_switchToggle,
  gfn_segmentSwitch,
  gfn_tab,
  gfn_input,
  gfn_form,
  gfn_dropdown,
  gfn_modal,
  gfn_overflow,
  modalControl,
  zIndexManager,
});

