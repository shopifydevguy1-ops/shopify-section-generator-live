/**
 * Section Suggestions Engine
 * Loads and displays suggested section templates
 * Uses the same library as the main generator
 */

let sectionLibrary = [];
    {
        id: "hero-banner-1",
        title: "Hero Banner",
        tags: ["hero", "banner", "image", "cta"],
        description: "Full-width hero with background image, headline, and CTA button"
    },
    {
        id: "product-grid-1",
        title: "Product Grid",
        tags: ["products", "grid", "collection"],
        description: "Responsive product grid with hover effects"
    },
    {
        id: "testimonials-1",
        title: "Testimonials Slider",
        tags: ["slider", "reviews", "testimonials"],
        description: "Swiper-based testimonial carousel with customer reviews"
    },
    {
        id: "image-text-1",
        title: "Image with Text",
        tags: ["image", "text", "two-column"],
        description: "Two-column layout with image and text content"
    },
    {
        id: "feature-columns-1",
        title: "Feature Columns",
        tags: ["features", "columns", "icons"],
        description: "Three-column feature section with icons and descriptions"
    },
    {
        id: "newsletter-1",
        title: "Newsletter Signup",
        tags: ["newsletter", "email", "form"],
        description: "Email subscription form with custom styling"
    },
    {
        id: "faq-1",
        title: "FAQ Accordion",
        tags: ["faq", "accordion", "questions"],
        description: "Expandable FAQ section with smooth animations"
    },
    {
        id: "video-1",
        title: "Video Section",
        tags: ["video", "media", "youtube"],
        description: "Embedded video player with custom controls"
    },
    {
        id: "countdown-1",
        title: "Countdown Timer",
        tags: ["timer", "countdown", "sale"],
        description: "Animated countdown timer for sales and promotions"
    },
    {
        id: "logo-bar-1",
        title: "Logo Bar",
        tags: ["logos", "brands", "carousel"],
        description: "Scrolling logo carousel showcasing partner brands"
    }
];

function initSuggestions() {
    const container = document.getElementById('suggestions-container');
    if (!container) return;

    // Load from sections-library.js
    if (typeof sectionsLibrary !== 'undefined') {
        sectionLibrary = sectionsLibrary;
    }
    
    renderSuggestions(sectionLibrary);

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
}

function updateSuggestions(prompt) {
    if (!prompt || prompt.trim() === '') {
        renderSuggestions(sectionLibrary);
        return;
    }

    const promptLower = prompt.toLowerCase();
    const promptWords = promptLower.split(/\s+/);
    
    const scored = sectionLibrary.map(section => ({
        ...section,
        score: calculateRelevanceScore(section, promptWords, promptLower)
    }));

    scored.sort((a, b) => b.score - a.score);
    const topSuggestions = scored.slice(0, 6);
    
    renderSuggestions(topSuggestions);
}

function calculateRelevanceScore(section, promptWords, promptLower) {
    let score = 0;

    // Title match
    const titleLower = section.title.toLowerCase();
    promptWords.forEach(word => {
        if (titleLower.includes(word)) score += 2;
    });

    // Description match
    const descLower = (section.description || '').toLowerCase();
    promptWords.forEach(word => {
        if (descLower.includes(word)) score += 1;
    });

    // Tag matches
    const tags = section.tags || [];
    promptWords.forEach(word => {
        if (tags.some(tag => tag.toLowerCase().includes(word))) {
            score += 1.5;
        }
    });

    // Exact phrase matches
    if (titleLower.includes(promptLower) || descLower.includes(promptLower)) {
        score += 3;
    }

    return score;
}

function renderSuggestions(suggestions) {
    const container = document.getElementById('suggestions-container');
    if (!container) return;

    if (suggestions.length === 0) {
        container.innerHTML = '<div class="suggestion-loading">No suggestions found</div>';
        return;
    }

    const html = suggestions.map(section => `
        <div class="suggestion-card" data-section-id="${section.id}">
            <h4 class="suggestion-title">${escapeHtml(section.title)}</h4>
            <p class="suggestion-description">${escapeHtml(section.description)}</p>
            <div class="suggestion-tags">
                ${(section.tags || []).slice(0, 3).map(tag => 
                    `<span class="suggestion-tag">${escapeHtml(tag)}</span>`
                ).join('')}
            </div>
            <button class="suggestion-use-btn" data-section-id="${section.id}">
                Use This Template
            </button>
        </div>
    `).join('');

    container.innerHTML = html;

    // Attach click handlers
    container.querySelectorAll('.suggestion-use-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const sectionId = this.dataset.sectionId;
            useSuggestion(sectionId);
        });
    });
}

function useSuggestion(sectionId) {
    const section = sectionLibrary.find(s => s.id === sectionId);
    if (!section) return;

    const promptInput = document.getElementById('section-prompt');
    if (!promptInput) return;

    const prompt = `Create a ${section.title.toLowerCase()}. ${section.description}`;
    promptInput.value = prompt;
    promptInput.focus();

    // Scroll to input
    promptInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSuggestions);
} else {
    initSuggestions();
}

