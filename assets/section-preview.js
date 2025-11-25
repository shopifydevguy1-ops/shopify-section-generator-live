/**
 * Section Preview Engine
 * Location: /assets/section-preview.js
 * Purpose: Renders a mock preview of generated sections
 */

(function() {
  'use strict';

  /**
   * Render preview based on generated code and schema
   */
  function renderPreview(container, code, schema) {
    if (!container) return;

    try {
      // Parse schema to get default values
      const schemaData = parseSchema(schema);
      
      // Extract key information from code
      const codeInfo = extractCodeInfo(code);
      
      // Generate mock preview
      const preview = generateMockPreview(codeInfo, schemaData);
      
      container.innerHTML = preview;
    } catch (error) {
      console.error('Preview rendering error:', error);
      container.innerHTML = `
        <div class="preview-error">
          <p>Could not generate preview. The code is valid and will work when added to your theme.</p>
        </div>
      `;
    }
  }

  /**
   * Parse JSON schema
   */
  function parseSchema(schemaString) {
    try {
      if (typeof schemaString === 'string') {
        return JSON.parse(schemaString);
      }
      return schemaString || {};
    } catch (e) {
      return {};
    }
  }

  /**
   * Extract key information from Liquid code
   */
  function extractCodeInfo(code) {
    const info = {
      hasImage: /{%\s*if\s+.*image|img|picture/i.test(code),
      hasText: /{%\s*if\s+.*text|heading|title|content/i.test(code),
      hasButton: /button|cta|link.*href/i.test(code),
      hasVideo: /video|youtube|vimeo/i.test(code),
      hasProducts: /product|collection|for.*product/i.test(code),
      hasSlider: /slider|swiper|carousel/i.test(code),
      hasForm: /form|input|textarea/i.test(code),
      sectionType: 'custom'
    };

    // Detect section type
    if (info.hasProducts) {
      info.sectionType = 'products';
    } else if (info.hasSlider) {
      info.sectionType = 'slider';
    } else if (info.hasVideo) {
      info.sectionType = 'video';
    } else if (info.hasForm) {
      info.sectionType = 'form';
    } else if (info.hasImage && info.hasText) {
      info.sectionType = 'image-text';
    } else if (info.hasImage) {
      info.sectionType = 'image';
    }

    return info;
  }

  /**
   * Generate mock preview HTML
   */
  function generateMockPreview(codeInfo, schemaData) {
    const { sectionType, hasImage, hasText, hasButton, hasVideo, hasProducts, hasSlider, hasForm } = codeInfo;
    
    let preview = '<div class="mock-preview">';

    switch (sectionType) {
      case 'products':
        preview += generateProductGridPreview(schemaData);
        break;
      case 'slider':
        preview += generateSliderPreview(schemaData);
        break;
      case 'video':
        preview += generateVideoPreview(schemaData);
        break;
      case 'form':
        preview += generateFormPreview(schemaData);
        break;
      case 'image-text':
        preview += generateImageTextPreview(schemaData);
        break;
      case 'image':
        preview += generateImagePreview(schemaData);
        break;
      default:
        preview += generateGenericPreview(codeInfo, schemaData);
    }

    preview += '</div>';
    return preview;
  }

  /**
   * Generate product grid preview
   */
  function generateProductGridPreview(schema) {
    return `
      <div class="mock-product-grid">
        <div class="mock-product-item">
          <div class="mock-product-image"></div>
          <div class="mock-product-title"></div>
          <div class="mock-product-price"></div>
        </div>
        <div class="mock-product-item">
          <div class="mock-product-image"></div>
          <div class="mock-product-title"></div>
          <div class="mock-product-price"></div>
        </div>
        <div class="mock-product-item">
          <div class="mock-product-image"></div>
          <div class="mock-product-title"></div>
          <div class="mock-product-price"></div>
        </div>
      </div>
    `;
  }

  /**
   * Generate slider preview
   */
  function generateSliderPreview(schema) {
    return `
      <div class="mock-slider">
        <div class="mock-slide active">
          <div class="mock-slide-content"></div>
        </div>
        <div class="mock-slider-dots">
          <span class="dot active"></span>
          <span class="dot"></span>
          <span class="dot"></span>
        </div>
      </div>
    `;
  }

  /**
   * Generate video preview
   */
  function generateVideoPreview(schema) {
    return `
      <div class="mock-video">
        <div class="mock-video-thumbnail">
          <div class="mock-play-button">▶</div>
        </div>
      </div>
    `;
  }

  /**
   * Generate form preview
   */
  function generateFormPreview(schema) {
    return `
      <div class="mock-form">
        <div class="mock-input"></div>
        <div class="mock-input"></div>
        <div class="mock-button"></div>
      </div>
    `;
  }

  /**
   * Generate image-text preview
   */
  function generateImageTextPreview(schema) {
    return `
      <div class="mock-image-text">
        <div class="mock-image"></div>
        <div class="mock-text-content">
          <div class="mock-heading"></div>
          <div class="mock-paragraph"></div>
          <div class="mock-button"></div>
        </div>
      </div>
    `;
  }

  /**
   * Generate image preview
   */
  function generateImagePreview(schema) {
    return `
      <div class="mock-image-banner">
        <div class="mock-image"></div>
        <div class="mock-overlay-text">
          <div class="mock-heading"></div>
          <div class="mock-button"></div>
        </div>
      </div>
    `;
  }

  /**
   * Generate generic preview
   */
  function generateGenericPreview(codeInfo, schema) {
    let html = '<div class="mock-generic">';
    
    if (codeInfo.hasImage) {
      html += '<div class="mock-image"></div>';
    }
    
    if (codeInfo.hasText) {
      html += '<div class="mock-text"><div class="mock-heading"></div><div class="mock-paragraph"></div></div>';
    }
    
    if (codeInfo.hasButton) {
      html += '<div class="mock-button"></div>';
    }
    
    html += '</div>';
    return html;
  }

  // Export for global access
  window.SectionPreview = {
    renderPreview
  };

})();

