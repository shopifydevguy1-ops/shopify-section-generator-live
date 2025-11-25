/**
 * Section Generator Main JavaScript
 * Location: /assets/section-generator.js
 * Purpose: Handles AI section generation via OpenAI API
 */

(function() {
  'use strict';

  // State management
  const state = {
    currentPrompt: '',
    generatedCode: null,
    generatedSchema: null,
    isLoading: false
  };

  // DOM Elements
  const elements = {
    promptInput: null,
    generateBtn: null,
    clearBtn: null,
    previewContainer: null,
    codeContainer: null,
    generatedCode: null,
    loadingOverlay: null,
    downloadBtn: null,
    copyBtn: null,
    rerunBtn: null,
    addToThemeBtn: null,
    toggleCodeBtn: null
  };

  /**
   * Initialize the generator
   */
  function init() {
    // Get section settings
    const sectionElement = document.querySelector('[data-section-type="section-generator"]');
    if (!sectionElement) return;

    // Get API key from section settings (stored in data attributes or fetched from Shopify)
    const apiKey = getApiKey();
    if (!apiKey) {
      console.warn('OpenAI API key not configured. Please set it in theme settings.');
    }

    // Cache DOM elements
    elements.promptInput = document.getElementById('section-prompt');
    elements.generateBtn = document.getElementById('generate-btn');
    elements.clearBtn = document.getElementById('clear-btn');
    elements.previewContainer = document.getElementById('preview-container');
    elements.codeContainer = document.getElementById('code-container');
    elements.generatedCode = document.getElementById('generated-code');
    elements.loadingOverlay = document.getElementById('loading-overlay');
    elements.downloadBtn = document.getElementById('download-btn');
    elements.copyBtn = document.getElementById('copy-btn');
    elements.rerunBtn = document.getElementById('rerun-btn');
    elements.addToThemeBtn = document.getElementById('add-to-theme-btn');
    elements.toggleCodeBtn = document.getElementById('toggle-code-btn');

    // Attach event listeners
    if (elements.generateBtn) {
      elements.generateBtn.addEventListener('click', handleGenerate);
    }
    
    if (elements.clearBtn) {
      elements.clearBtn.addEventListener('click', handleClear);
    }

    if (elements.downloadBtn) {
      elements.downloadBtn.addEventListener('click', handleDownload);
    }

    if (elements.copyBtn) {
      elements.copyBtn.addEventListener('click', handleCopy);
    }

    if (elements.rerunBtn) {
      elements.rerunBtn.addEventListener('click', handleRerun);
    }

    if (elements.addToThemeBtn) {
      elements.addToThemeBtn.addEventListener('click', handleAddToTheme);
    }

    if (elements.toggleCodeBtn) {
      elements.toggleCodeBtn.addEventListener('click', handleToggleCode);
    }

    // Allow Enter key to generate (Ctrl/Cmd + Enter)
    if (elements.promptInput) {
      elements.promptInput.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault();
          handleGenerate();
        }
      });
    }
  }

  /**
   * Get API key from section settings
   * Note: In production, this should be fetched securely from Shopify backend
   */
  function getApiKey() {
    // Try to get from data attribute (set by Liquid)
    const sectionElement = document.querySelector('[data-section-type="section-generator"]');
    if (sectionElement && sectionElement.dataset.apiKey) {
      return sectionElement.dataset.apiKey;
    }
    
    // Fallback: Check if stored in localStorage (for development)
    return localStorage.getItem('openai_api_key') || '';
  }

  /**
   * Get OpenAI model from settings
   */
  function getModel() {
    const sectionElement = document.querySelector('[data-section-type="section-generator"]');
    return sectionElement?.dataset.model || 'gpt-4';
  }

  /**
   * Handle generate button click
   */
  async function handleGenerate() {
    const prompt = elements.promptInput?.value.trim();
    
    if (!prompt) {
      alert('Please enter a description of the section you want to create.');
      return;
    }

    const apiKey = getApiKey();
    if (!apiKey) {
      alert('OpenAI API key is not configured. Please set it in theme settings.');
      return;
    }

    state.currentPrompt = prompt;
    state.isLoading = true;
    
    showLoading(true);
    disableButtons(true);

    try {
      const result = await generateSection(prompt, apiKey);
      
      if (result.success) {
        state.generatedCode = result.code;
        state.generatedSchema = result.schema;
        
        displayGeneratedCode(result.code);
        updatePreview(result.code, result.schema);
        enableActionButtons();
      } else {
        throw new Error(result.error || 'Failed to generate section');
      }
    } catch (error) {
      console.error('Generation error:', error);
      showError('Failed to generate section: ' + error.message);
    } finally {
      state.isLoading = false;
      showLoading(false);
      disableButtons(false);
    }
  }

  /**
   * Generate section using OpenAI API
   */
  async function generateSection(prompt, apiKey) {
    const model = getModel();
    
    const systemPrompt = `You are a Shopify Liquid expert. Generate a complete Shopify section file (.liquid) with a JSON schema.

Requirements:
1. Output valid Shopify Liquid code compatible with Online Store 2.0
2. Include a complete {% schema %} block at the end
3. Use modern, clean code with comments
4. Make the section customizable through schema settings
5. Use semantic HTML and accessible markup
6. Include proper error handling and fallbacks

Format your response as JSON with this structure:
{
  "code": "<!-- Full Liquid code here -->",
  "schema": "<!-- JSON schema here -->"
}`;

    const userPrompt = `Create a Shopify section based on this description: ${prompt}

Make sure to:
- Include all necessary Liquid tags and filters
- Add schema settings for customization
- Use proper Shopify section structure
- Include CSS styling within <style> tags
- Make it responsive and mobile-friendly`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 4000
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '';
      
      // Parse JSON response
      let parsed;
      try {
        // Try to extract JSON from markdown code blocks
        const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[1]);
        } else {
          parsed = JSON.parse(content);
        }
      } catch (e) {
        // If JSON parsing fails, try to extract code directly
        const codeMatch = content.match(/```liquid\s*([\s\S]*?)\s*```/);
        if (codeMatch) {
          parsed = {
            code: codeMatch[1],
            schema: '{}'
          };
        } else {
          throw new Error('Could not parse AI response. Please try again.');
        }
      }

      return {
        success: true,
        code: parsed.code || content,
        schema: parsed.schema || '{}'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Display generated code
   */
  function displayGeneratedCode(code) {
    if (elements.generatedCode) {
      elements.generatedCode.textContent = code;
    }
  }

  /**
   * Update preview container
   */
  function updatePreview(code, schema) {
    if (!elements.previewContainer) return;

    // Clear previous preview
    elements.previewContainer.innerHTML = '';

    // Create preview wrapper
    const previewWrapper = document.createElement('div');
    previewWrapper.className = 'generated-preview';
    previewWrapper.setAttribute('data-code', btoa(unescape(encodeURIComponent(code))));
    previewWrapper.setAttribute('data-schema', btoa(unescape(encodeURIComponent(schema))));
    
    // Add notice
    const notice = document.createElement('div');
    notice.className = 'preview-notice';
    notice.innerHTML = '<strong>Preview:</strong> This is a visual representation. The actual section will render correctly when added to your theme.';
    previewWrapper.appendChild(notice);

    // Add preview content (will be populated by section-preview.js)
    const previewContent = document.createElement('div');
    previewContent.className = 'preview-content';
    previewContent.id = 'preview-content-' + Date.now();
    previewWrapper.appendChild(previewContent);

    elements.previewContainer.appendChild(previewWrapper);

    // Trigger preview rendering
    if (window.SectionPreview) {
      window.SectionPreview.renderPreview(previewContent, code, schema);
    }
  }

  /**
   * Handle clear button
   */
  function handleClear() {
    if (elements.promptInput) {
      elements.promptInput.value = '';
    }
    if (elements.previewContainer) {
      elements.previewContainer.innerHTML = `
        <div class="preview-placeholder">
          <p>Your generated section will appear here</p>
          <p class="preview-hint">Enter a prompt and click "Generate Section" to get started</p>
        </div>
      `;
    }
    if (elements.codeContainer) {
      elements.codeContainer.style.display = 'none';
    }
    if (elements.generatedCode) {
      elements.generatedCode.textContent = '// Generated code will appear here';
    }
    disableActionButtons();
    state.generatedCode = null;
    state.generatedSchema = null;
  }

  /**
   * Handle download button
   */
  function handleDownload() {
    if (!state.generatedCode) return;

    const filename = `section-${Date.now()}.liquid`;
    const blob = new Blob([state.generatedCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Handle copy button
   */
  async function handleCopy() {
    if (!state.generatedCode) return;

    try {
      await navigator.clipboard.writeText(state.generatedCode);
      
      // Show feedback
      const btn = elements.copyBtn;
      const originalText = btn.innerHTML;
      btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polyline points="20 6 9 17 4 12"></polyline></svg>';
      btn.style.color = '#10b981';
      
      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.color = '';
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy to clipboard');
    }
  }

  /**
   * Handle rerun button
   */
  function handleRerun() {
    if (state.currentPrompt) {
      elements.promptInput.value = state.currentPrompt;
      handleGenerate();
    }
  }

  /**
   * Handle add to theme button
   */
  function handleAddToTheme() {
    if (!state.generatedCode) return;

    // Show instructions
    const instructions = `
To add this section to your theme:

1. Go to Shopify Admin → Online Store → Themes
2. Click "Actions" → "Edit code"
3. Navigate to the /sections/ folder
4. Click "Add a new section"
5. Name it (e.g., "custom-section.liquid")
6. Paste the generated code
7. Save the file

The section will then be available in the theme editor!
    `;

    alert(instructions);
    
    // Also copy to clipboard for convenience
    handleCopy();
  }

  /**
   * Handle toggle code button
   */
  function handleToggleCode() {
    if (!elements.codeContainer) return;
    
    const isVisible = elements.codeContainer.style.display !== 'none';
    elements.codeContainer.style.display = isVisible ? 'none' : 'block';
    elements.toggleCodeBtn.textContent = isVisible ? 'Show Code' : 'Hide Code';
  }

  /**
   * Show/hide loading overlay
   */
  function showLoading(show) {
    if (elements.loadingOverlay) {
      elements.loadingOverlay.style.display = show ? 'flex' : 'none';
    }
  }

  /**
   * Show error message
   */
  function showError(message) {
    if (elements.previewContainer) {
      elements.previewContainer.innerHTML = `
        <div class="preview-error">
          <p><strong>Error:</strong> ${message}</p>
          <p>Please try again or contact support if the issue persists.</p>
        </div>
      `;
    }
  }

  /**
   * Enable action buttons
   */
  function enableActionButtons() {
    if (elements.downloadBtn) elements.downloadBtn.disabled = false;
    if (elements.copyBtn) elements.copyBtn.disabled = false;
    if (elements.rerunBtn) elements.rerunBtn.disabled = false;
    if (elements.addToThemeBtn) elements.addToThemeBtn.disabled = false;
  }

  /**
   * Disable action buttons
   */
  function disableActionButtons() {
    if (elements.downloadBtn) elements.downloadBtn.disabled = true;
    if (elements.copyBtn) elements.copyBtn.disabled = true;
    if (elements.rerunBtn) elements.rerunBtn.disabled = true;
    if (elements.addToThemeBtn) elements.addToThemeBtn.disabled = true;
  }

  /**
   * Disable/enable buttons during loading
   */
  function disableButtons(disable) {
    if (elements.generateBtn) elements.generateBtn.disabled = disable;
    if (elements.clearBtn) elements.clearBtn.disabled = disable;
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export for global access
  window.SectionGenerator = {
    generate: handleGenerate,
    clear: handleClear,
    getState: () => ({ ...state })
  };

})();

