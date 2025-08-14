class FeaturedCollection extends HTMLElement {
  static ANIMATION_TIMING = {
    stagger: 100,
    fadeIn: 300,
    fadeOut: 500,
    scrollStep: 10
  };

  static get observedAttributes() {
    return ['data-section-id'];
  }

  constructor() {
    super();
    this.initialized = false;
    this.sectionId = null;
    this.isExpanded = false;
    this.cleanup = () => {};
  }

  connectedCallback() {
    if (this.initialized) return;
    
    this.initialized = true;
    this.sectionId = this.dataset.sectionId?.replace(/[^a-zA-Z0-9-_]/g, '') || 'default';
    this.initializeDesktopScroll();
    this.initializeMobileToggle();
  }

  disconnectedCallback() {
    this.cleanup();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'data-section-id' && oldValue !== newValue) {
      this.cleanup();
      this.initialized = false;
      this.connectedCallback();
    }
  }

  initializeMobileToggle() {
    const showMoreBtn = this.querySelector(`#show-more-btn-${this.sectionId}`);
    if (!showMoreBtn) return;

    const moreProducts = this.querySelectorAll('.more-products');
    const showText = showMoreBtn.querySelector('.show-text');
    const hideText = showMoreBtn.querySelector('.hide-text');
    
    showMoreBtn.setAttribute('aria-expanded', 'false');
    showMoreBtn.setAttribute('aria-controls', `products-container-${this.sectionId}`);
    
    const container = this.querySelector('.grid');
    if (container) container.id = `products-container-${this.sectionId}`;

    const toggle = (e) => {
      e.preventDefault();
      this.isExpanded = !this.isExpanded;
      showMoreBtn.setAttribute('aria-expanded', this.isExpanded);
      showMoreBtn.setAttribute('aria-live', 'polite');
      
      if (this.isExpanded) {
        moreProducts.forEach((product, index) => {
          product.classList.remove('hidden');
          product.style.transition = `opacity ${FeaturedCollection.ANIMATION_TIMING.fadeIn}ms ease`;
          product.style.transitionDelay = `${index * FeaturedCollection.ANIMATION_TIMING.stagger}ms`;
          requestAnimationFrame(() => {
            product.style.opacity = '1';
          });
        });
        showText?.classList.add('hidden');
        hideText?.classList.remove('hidden');
      } else {
        moreProducts.forEach(product => {
          product.style.opacity = '0';
        });
        setTimeout(() => {
          moreProducts.forEach(product => product.classList.add('hidden'));
        }, FeaturedCollection.ANIMATION_TIMING.fadeOut);
        showText?.classList.remove('hidden');
        hideText?.classList.add('hidden');
        this.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    showMoreBtn.addEventListener('click', toggle);
    
    const previousCleanup = this.cleanup;
    this.cleanup = () => {
      previousCleanup();
      showMoreBtn.removeEventListener('click', toggle);
    };
  }

  initializeDesktopScroll() {
    const scrollview = this.querySelector(`#desktop-scrollview-${this.sectionId}`);
    const scrollbarThumb = this.querySelector(`#scrollbar-thumb-${this.sectionId}`);
    const scrollbarTrack = scrollbarThumb?.parentElement;
    
    if (!scrollview || !scrollbarThumb || !scrollbarTrack) return;

    const thumbWidth = 480;
    scrollbarThumb.style.width = thumbWidth + 'px';
    scrollbarThumb.setAttribute('tabindex', '0');
    scrollbarThumb.setAttribute('role', 'scrollbar');
    scrollbarThumb.setAttribute('aria-orientation', 'horizontal');
    
    const syncThumbPosition = () => {
      const maxScroll = scrollview.scrollWidth - scrollview.clientWidth;
      scrollbarThumb.style.display = 'block';
      const scrollPercent = scrollview.scrollLeft / maxScroll;
      const maxThumbPos = scrollbarTrack.offsetWidth - thumbWidth;
      const thumbPos = scrollPercent * maxThumbPos;
      
      scrollbarThumb.style.transform = `translateY(-50%) translateX(${thumbPos}px)`;
      scrollbarThumb.setAttribute('aria-valuenow', Math.round(scrollPercent * 100));
    };
    
    let rafId = null;
    const handleScroll = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(syncThumbPosition);
    };
    
    scrollview.addEventListener('scroll', handleScroll, { passive: true });
    
    // Keyboard navigation
    const handleKeydown = (e) => {
      const step = e.shiftKey ? scrollview.clientWidth * 0.1 : FeaturedCollection.ANIMATION_TIMING.scrollStep;
      const actions = {
        'ArrowLeft': () => scrollview.scrollLeft -= step,
        'ArrowRight': () => scrollview.scrollLeft += step,
        'Home': () => scrollview.scrollLeft = 0,
        'End': () => scrollview.scrollLeft = scrollview.scrollWidth
      };
      
      if (actions[e.key]) {
        e.preventDefault();
        actions[e.key]();
      }
    };
    
    scrollbarThumb.addEventListener('keydown', handleKeydown);
    
    // Drag handling
    const initDrag = (e) => {
      e.preventDefault();
      const startX = e.clientX;
      const startScrollLeft = scrollview.scrollLeft;
      const trackWidth = scrollbarTrack.offsetWidth - thumbWidth;
      
      const handleDrag = (e) => {
        const deltaX = e.clientX - startX;
        const scrollRatio = deltaX / trackWidth;
        const maxScroll = scrollview.scrollWidth - scrollview.clientWidth;
        scrollview.scrollLeft = startScrollLeft + (scrollRatio * maxScroll);
      };
      
      const stopDrag = () => {
        document.removeEventListener('mousemove', handleDrag);
        document.removeEventListener('mouseup', stopDrag);
      };
      
      document.addEventListener('mousemove', handleDrag);
      document.addEventListener('mouseup', stopDrag);
    };
    
    scrollbarThumb.addEventListener('mousedown', initDrag);
    
    // Track click
    const handleTrackClick = (e) => {
      if (e.target !== scrollbarTrack) return;
      
      const rect = scrollbarTrack.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const scrollPercent = clickX / scrollbarTrack.offsetWidth;
      scrollview.scrollLeft = scrollPercent * (scrollview.scrollWidth - scrollview.clientWidth);
    };
    
    scrollbarTrack.addEventListener('click', handleTrackClick);
    
    // Handle resize
    const handleResize = () => {
      syncThumbPosition();
    };
    
    window.addEventListener('resize', handleResize);
    syncThumbPosition();
    
    const previousCleanup = this.cleanup;
    this.cleanup = () => {
      previousCleanup();
      scrollview.removeEventListener('scroll', handleScroll);
      scrollbarThumb.removeEventListener('keydown', handleKeydown);
      scrollbarThumb.removeEventListener('mousedown', initDrag);
      scrollbarTrack.removeEventListener('click', handleTrackClick);
      window.removeEventListener('resize', handleResize);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }
}

if (!customElements.get('featured-collection')) {
  customElements.define('featured-collection', FeaturedCollection);
}
