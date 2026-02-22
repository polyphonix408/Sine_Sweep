/* ============================================
   JAVASCRIPT FOR IMAGE GALLERY FUNCTIONALITY
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
  
  // Initialize the image gallery
  initImageGallery();
  
  function initImageGallery() {
    const thumbnails = document.querySelectorAll('.thumbnail-wrapper');
    const mainImage = document.querySelector('.product-image-main');
    const lightbox = document.querySelector('.image-lightbox');
    const lightboxImage = document.querySelector('.image-lightbox img');
    const closeBtn = document.querySelector('.lightbox-close');
    
    let currentImageIndex = 0;
    let allImages = [];
    
    // Collect all image sources
    thumbnails.forEach((thumb, index) => {
      const img = thumb.querySelector('img');
      if (img) {
        allImages.push({
          src: img.dataset.fullImage || img.src,
          thumb: thumb,
          index: index
        });
      }
    });
    
    // Add click event to thumbnails
    thumbnails.forEach((thumbnail, index) => {
      thumbnail.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Update active state
        thumbnails.forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        
        // Get full image URL
        const img = this.querySelector('img');
        const fullImageSrc = img.dataset.fullImage || img.src;
        
        // Update main image
        if (mainImage) {
          mainImage.src = fullImageSrc;
        }
        
        // Open lightbox with full image
        currentImageIndex = index;
        openLightbox(fullImageSrc);
      });
    });
    
    // Click on main image to open lightbox
    if (mainImage) {
      mainImage.addEventListener('click', function() {
        openLightbox(this.src);
      });
    }
    
    // Lightbox functions
    function openLightbox(imageSrc) {
      if (lightbox && lightboxImage) {
        lightboxImage.src = imageSrc;
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
      }
    }
    
    function closeLightbox() {
      if (lightbox) {
        lightbox.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
      }
    }
    
    // Close lightbox on click
    if (lightbox) {
      lightbox.addEventListener('click', function(e) {
        if (e.target === lightbox || e.target === closeBtn) {
          closeLightbox();
        }
      });
    }
    
    // Close on ESC key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        closeLightbox();
      }
    });
    
    // Navigation arrows (optional)
    const prevBtn = document.querySelector('.lightbox-prev');
    const nextBtn = document.querySelector('.lightbox-next');
    
    if (prevBtn) {
      prevBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        navigateImage(-1);
      });
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        navigateImage(1);
      });
    }
    
    function navigateImage(direction) {
      currentImageIndex += direction;
      
      // Loop around
      if (currentImageIndex < 0) {
        currentImageIndex = allImages.length - 1;
      } else if (currentImageIndex >= allImages.length) {
        currentImageIndex = 0;
      }
      
      // Update lightbox image
      if (lightboxImage && allImages[currentImageIndex]) {
        lightboxImage.src = allImages[currentImageIndex].src;
        
        // Update active thumbnail
        thumbnails.forEach(t => t.classList.remove('active'));
        allImages[currentImageIndex].thumb.classList.add('active');
      }
    }
    
    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
      if (lightbox.classList.contains('active')) {
        if (e.key === 'ArrowLeft') {
          navigateImage(-1);
        } else if (e.key === 'ArrowRight') {
          navigateImage(1);
        }
      }
    });
  }
});

