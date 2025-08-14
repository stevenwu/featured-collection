class FeaturedCollection extends HTMLElement {
  constructor() {
    super();
    this.sectionId = this.dataset.sectionId;
    this.initializeDesktopScroll();
    this.initializeMobileToggle();
  }

  connectedCallback() {
    // Initialize when element is added to DOM
    this.initializeDesktopScroll();
    this.initializeMobileToggle();
  }

  initializeMobileToggle() {
    const showMoreBtn = this.querySelector(`#show-more-btn-${this.sectionId}`);
    if (!showMoreBtn) return;

    const moreProducts = this.querySelectorAll('.more-products');
    const showText = showMoreBtn.querySelector('.show-text');
    const hideText = showMoreBtn.querySelector('.hide-text');
    let isExpanded = false;

    showMoreBtn.addEventListener('click', () => {
      isExpanded = !isExpanded;
      
      if (isExpanded) {
        // Show products with staggered animation
        moreProducts.forEach((product, index) => {
          setTimeout(() => {
            product.classList.remove('hidden');
            setTimeout(() => {
              product.style.opacity = '1';
              product.style.transform = 'translateY(0)';
            }, 50);
          }, index * 100); // Stagger by 100ms
        });
        
        // Toggle button text
        showText.classList.add('hidden');
        hideText.classList.remove('hidden');
        hideText.classList.add('show');
      } else {
        // Hide products
        moreProducts.forEach((product) => {
          product.style.opacity = '0';
          product.style.transform = 'translateY(10px)';
          setTimeout(() => {
            product.classList.add('hidden');
          }, 500); // Wait for fade animation
        });
        
        // Toggle button text
        showText.classList.remove('hidden');
        hideText.classList.add('hidden');
        hideText.classList.remove('show');
        
        // Smooth scroll to section
        this.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  }

  initializeDesktopScroll() {
    const scrollview = this.querySelector(`#desktop-scrollview-${this.sectionId}`);
    const scrollbarThumb = this.querySelector(`#scrollbar-thumb-${this.sectionId}`);
    const scrollbarTrack = scrollbarThumb?.parentElement;
    
    if (!scrollview || !scrollbarThumb || !scrollbarTrack) return;

    // Fixed values
    const THUMB_WIDTH = 480;
    
    // State
    let isDragging = false;
    let rafId = null;
    
    // Set thumb width once
    scrollbarThumb.style.width = THUMB_WIDTH + 'px';
    
    function syncThumbPosition() {
      const maxScroll = scrollview.scrollWidth - scrollview.clientWidth;
      if (maxScroll <= 0) {
        scrollbarThumb.style.display = 'none';
        return;
      }
      
      scrollbarThumb.style.display = 'block';
      const scrollPercent = scrollview.scrollLeft / maxScroll;
      const trackWidth = scrollbarTrack.offsetWidth;
      const maxThumbPos = trackWidth - THUMB_WIDTH;
      const thumbPos = Math.max(0, Math.min(scrollPercent * maxThumbPos, maxThumbPos));
      
      scrollbarThumb.style.transform = `translateY(-50%) translateX(${thumbPos}px)`;
    }
    
    let ticking = false;
    scrollview.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          syncThumbPosition();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
    
    // Drag handling
    scrollbarThumb.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      isDragging = true;
      
      const startX = e.clientX;
      const thumbRect = scrollbarThumb.getBoundingClientRect();
      const trackRect = scrollbarTrack.getBoundingClientRect();
      const startThumbLeft = thumbRect.left - trackRect.left;
      
      function onMouseMove(e) {
        if (!isDragging) return;
        
        const deltaX = e.clientX - startX;
        const newThumbLeft = startThumbLeft + deltaX;
        
        const trackWidth = scrollbarTrack.offsetWidth;
        const maxThumbPos = trackWidth - THUMB_WIDTH;
        
        // Constrain thumb position
        const constrainedLeft = Math.max(0, Math.min(newThumbLeft, maxThumbPos));
        
        // Calculate scroll position from thumb position
        const scrollPercent = constrainedLeft / maxThumbPos;
        const maxScroll = scrollview.scrollWidth - scrollview.clientWidth;
        const newScrollLeft = scrollPercent * maxScroll;
        
        // Update scroll position directly (thumb will follow via scroll event)
        scrollview.scrollLeft = newScrollLeft;
      }
      
      function onMouseUp() {
        isDragging = false;
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      }
      
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
    
    // Click on track to jump
    scrollbarTrack.addEventListener('click', (e) => {
      // Only process clicks on the track itself, not the thumb
      if (e.target !== scrollbarTrack) return;
      
      const rect = scrollbarTrack.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const trackWidth = scrollbarTrack.offsetWidth;
      const scrollWidth = scrollview.scrollWidth - scrollview.clientWidth;
      
      // Center thumb on click position
      let thumbX = clickX - (THUMB_WIDTH / 2);
      thumbX = Math.max(0, Math.min(thumbX, trackWidth - THUMB_WIDTH));
      
      const scrollPercent = thumbX / (trackWidth - THUMB_WIDTH);
      scrollview.scrollLeft = scrollPercent * scrollWidth;
    });
    
    // Keyboard navigation
    scrollbarThumb.addEventListener('keydown', (e) => {
      const step = scrollview.clientWidth * 0.1; // 10% of viewport
      
      switch(e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          scrollview.scrollLeft -= step;
          break;
        case 'ArrowRight':
          e.preventDefault();
          scrollview.scrollLeft += step;
          break;
        case 'Home':
          e.preventDefault();
          scrollview.scrollLeft = 0;
          break;
        case 'End':
          e.preventDefault();
          scrollview.scrollLeft = scrollview.scrollWidth;
          break;
      }
    });
    
    // Initialize position
    syncThumbPosition();
    
    // Handle resize
    window.addEventListener('resize', syncThumbPosition);
    
    // Clean up on disconnect
    this.cleanupDesktopScroll = () => {
      window.removeEventListener('resize', syncThumbPosition);
    };
  }

  disconnectedCallback() {
    if (this.cleanupDesktopScroll) {
      this.cleanupDesktopScroll();
    }
  }
}

// Register the custom element
if (!customElements.get('featured-collection')) {
  customElements.define('featured-collection', FeaturedCollection);
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.featured-collection').forEach(section => {
      if (!section.classList.contains('featured-collection--initialized')) {
        section.classList.add('featured-collection--initialized');
      }
    });
  });
} else {
  document.querySelectorAll('.featured-collection').forEach(section => {
    if (!section.classList.contains('featured-collection--initialized')) {
      section.classList.add('featured-collection--initialized');
    }
  });
}