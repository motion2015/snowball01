/**
 * ==========================================
 * 신한카드 공통 스와이퍼 초기화 헬퍼 (Common Swiper Helper)
 * - 접근성 가이드라인 (a11y: false, custom pagination)이 적용되었습니다.
 * ==========================================
 * * 이 함수는 공통 JS파일에 1회만 정의합니다.
 * * @param {string} selector - 스와이퍼를 적용할 CSS 선택자 (예: '.gift-card-bridge')
 * @param {object} customOptions - 이 스와이퍼에만 적용할 커스텀 옵션
 */
function initShinhanSwiper(selector, customOptions = {}) {

    // 1. 선택자에 해당하는 DOM 요소를 찾습니다.
    const swiperElement = document.querySelector(selector);
    if (!swiperElement) {
        // 스와이퍼가 없는 페이지에서는 조용히 종료
        return null;
    }

    // 2. [자동화] 스와이퍼 내부의 페이지네이션 요소를 자동으로 찾습니다.
    const paginationEl = swiperElement.querySelector('.shc-slide__control .swiper-pagination');

    // 3. [공통 기본값] 모든 스와이퍼에 공통으로 들어갈 기본 옵션을 정의합니다.
    const defaultOptions = {
        observer: true,
        observeParents: true,
        // [접근성 1] Swiper의 내장 접근성 기능을 비활성화 (가이드 반영)
        a11y: {
            enabled: false,
        },
    };

    // 4. [페이지네이션 기본값] 
    //    paginationEl이 발견되었을 때 적용될 기본 페이지네이션 옵션입니다.
    //    (접근성 가이드 포함)
    let defaultPaginationOptions = {};
    if (paginationEl) {
        defaultPaginationOptions = {
            el: paginationEl,
            clickable: true,

            // [접근성 2] 인디케이터(Pagination)의 스크린 리더 안내 텍스트 (가이드 반영)
            ariaLabel: '슬라이드 인디케이터',

            // [접근성 3] 인디케이터를 1, 2, 3... 숫자로 표시 (가이드 반영)
            renderBullet: function (index, className) {
                return '<span class="' + className + '">' + (index + 1) + '</span>';
            }
        };
    }

    // 5. [핵심] 최종 옵션 병합

    // 5a. 사용자가 넘긴 customOptions에서 pagination 설정만 따로 분리합니다.
    //     (예: { slidesPerView: 1, pagination: { clickable: false } })
    const { pagination: customPagination, ...otherCustomOptions } = customOptions;

    // 5b. 기본 옵션과 나머지 커스텀 옵션을 합칩니다.
    const finalOptions = {
        ...defaultOptions,       // 1순위: 공통 기본값 (observer, a11y)
        ...otherCustomOptions    // 2순위: 커스텀 옵션 (slidesPerView 등)
    };

    // 5c. 페이지네이션 객체만 '깊은 병합(Deep Merge)'을 수행합니다.
    //     만약 paginationEl이 있다면,
    if (paginationEl) {
        finalOptions.pagination = {
            ...defaultPaginationOptions, // 1순위: 헬퍼의 기본값 (el, ariaLabel, renderBullet)
            ...customPagination          // 2순위: 사용자가 넘긴 값 (여기서 renderBullet 등을 덮어쓸 수 있음)
        };
    } else if (customPagination) {
        // (참고) paginationEl이 없는데 사용자가 pagination 옵션을 넘긴 경우
        finalOptions.pagination = customPagination;
    }

    // 6. 스와이퍼 인스턴스를 생성하여 반환합니다.
    try {
        return new Swiper(swiperElement, finalOptions);
    } catch (e) {
        console.error(`Failed to initialize Swiper for ${selector}:`, e);
        return null;
    }
}