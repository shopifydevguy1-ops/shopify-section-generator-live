/**
 * Section Suggestions Engine
 * Location: /assets/section-suggest.js
 * Purpose: Loads section library and suggests relevant sections based on user prompt
 */

(function() {
  'use strict';

  let sectionLibrary = [];
  const suggestionsContainer = document.getElementById('suggestions-container');

  /**
   * Initialize suggestions engine
   */
  async function init() {
    if (!suggestionsContainer) return;

    // Load section library
    // Note: The asset URL will be set by Liquid in the section template
    const libraryElement = document.querySelector('[data-library-url]');
    const libraryUrl = libraryElement ? libraryElement.dataset.libraryUrl : '/assets/section-library.json';
    
    try {
      const response = await fetch(libraryUrl);
      if (response.ok) {
        sectionLibrary = await response.json();
      } else {
        console.warn('Section library not found, using empty array');
        sectionLibrary = [];
      }
    } catch (error) {
      console.error('Failed to load section library:', error);
      sectionLibrary = [];
    }

    // Listen for prompt changes
    const promptInput = document.getElementById('section-prompt');
    if (promptInput) {
      let debounceTimer;
      promptInput.addEventListener('input', function() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          updateSuggestions(this.value);
        }, 300);
      });
    }

    // Show initial suggestions
    updateSuggestions('');
  }

  /**
   * Update suggestions based on prompt
   */
  function updateSuggestions(prompt) {
    if (!suggestionsContainer) return;

    if (sectionLibrary.length === 0) {
      suggestionsContainer.innerHTML = '<div class="suggestions-empty">No suggestions available</div>';
      return;
    }

    // Score and sort sections
    const scoredSections = sectionLibrary.map(section => ({
      ...section,
      score: calculateRelevanceScore(section, prompt)
    }));

    // Sort by score (highest first)
    scoredSections.sort((a, b) => b.score - a.score);

    // Get top 6 suggestions
    const topSuggestions = scoredSections.slice(0, 6);

    // Render suggestions
    renderSuggestions(topSuggestions);
  }

  /**
   * Calculate relevance score for a section based on prompt
   */
  function calculateRelevanceScore(section, prompt) {
    if (!prompt || prompt.trim() === '') {
      // If no prompt, return equal scores
      return 0.5;
    }

    const promptLower = prompt.toLowerCase();
    const promptWords = promptLower.split(/\s+/);
    
    let score = 0;

    // Check title match
    const titleLower = section.title.toLowerCase();
    promptWords.forEach(word => {
      if (titleLower.includes(word)) {
        score += 2;
      }
    });

    // Check description match
    const descLower = (section.description || '').toLowerCase();
    promptWords.forEach(word => {
      if (descLower.includes(word)) {
        score += 1;
      }
    });

    // Check tag matches
    const tags = section.tags || [];
    promptWords.forEach(word => {
      if (tags.some(tag => tag.toLowerCase().includes(word))) {
        score += 1.5;
      }
    });

    // Check category match
    const categoryLower = (section.category || '').toLowerCase();
    promptWords.forEach(word => {
      if (categoryLower.includes(word)) {
        score += 1;
      }
    });

    // Exact phrase matches get bonus
    if (titleLower.includes(promptLower) || descLower.includes(promptLower)) {
      score += 3;
    }

    return score;
  }

  /**
   * Render suggestions to DOM
   */
  function renderSuggestions(suggestions) {
    if (!suggestionsContainer) return;

    if (suggestions.length === 0) {
      suggestionsContainer.innerHTML = '<div class="suggestions-empty">No matching sections found</div>';
      return;
    }

    const html = suggestions.map(section => {
      const previewImage = section.preview_image 
        ? `<img src="{{ '${section.preview_image}' | asset_url }}" alt="${escapeHtml(section.title)}" class="suggestion-image" onerror="this.style.display='none'">`
        : '<div class="suggestion-placeholder">No Preview</div>';

      return `
        <div class="suggestion-card" data-section-id="${section.id}">
          <div class="suggestion-image-wrapper">
            ${previewImage}
          </div>
          <div class="suggestion-content">
            <h4 class="suggestion-title">${escapeHtml(section.title)}</h4>
            <p class="suggestion-description">${escapeHtml(section.description || '')}</p>
            <div class="suggestion-tags">
              ${(section.tags || []).slice(0, 3).map(tag => 
                `<span class="suggestion-tag">${escapeHtml(tag)}</span>`
              ).join('')}
            </div>
            <button class="suggestion-use-btn" data-section-id="${section.id}">
              Use This Template
            </button>
          </div>
        </div>
      `;
    }).join('');

    suggestionsContainer.innerHTML = html;

    // Attach click handlers
    suggestionsContainer.querySelectorAll('.suggestion-use-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const sectionId = this.dataset.sectionId;
        useSuggestion(sectionId);
      });
    });
  }

  /**
   * Use a suggested section template
   */
  function useSuggestion(sectionId) {
    const section = sectionLibrary.find(s => s.id === sectionId);
    if (!section) return;

    const promptInput = document.getElementById('section-prompt');
    if (!promptInput) return;

    // Generate a prompt based on the section
    const prompt = `Create a ${section.title.toLowerCase()}. ${section.description}`;
    
    promptInput.value = prompt;
    promptInput.focus();

    // Scroll to prompt input
    promptInput.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Optionally auto-generate
    // Uncomment the line below if you want to auto-generate when clicking a suggestion
    // if (window.SectionGenerator) {
    //   setTimeout(() => window.SectionGenerator.generate(), 500);
    // }
  }

  /**
   * Escape HTML to prevent XSS
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export for global access
  window.SectionSuggest = {
    updateSuggestions,
    useSuggestion
  };

})();

