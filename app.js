/**
 * Shopify Section Generator - Main Application
 * Standalone web app for generating Shopify sections
 * Uses local section library instead of AI API
 */

class SectionGenerator {
    constructor() {
        this.currentPrompt = '';
        this.generatedCode = null;
        this.sectionsLibrary = [];
        
        this.init();
    }

    init() {
        this.loadSectionLibrary();
        this.setupEventListeners();
    }
    
    loadSectionLibrary() {
        // Load from sections-library.js file
        if (typeof sectionsLibrary !== 'undefined') {
            this.sectionsLibrary = sectionsLibrary;
        } else {
            console.warn('Section library not loaded. Make sure sections-library.js is included.');
            this.sectionsLibrary = [];
        }
    }

    setupEventListeners() {
        // Generate button
        document.getElementById('generate-btn').addEventListener('click', () => this.handleGenerate());
        
        // Clear button
        document.getElementById('clear-btn').addEventListener('click', () => this.handleClear());
        
        // Copy code button
        document.getElementById('copy-code-btn').addEventListener('click', () => this.handleCopy());
        
        // Download button
        document.getElementById('download-btn').addEventListener('click', () => this.handleDownload());
        
        // Re-run button
        document.getElementById('rerun-btn').addEventListener('click', () => this.handleRerun());
        
        // Settings button - now shows library info
        document.getElementById('settings-btn').addEventListener('click', () => this.showLibraryInfo());
        
        // Keyboard shortcuts
        const promptInput = document.getElementById('section-prompt');
        promptInput.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                this.handleGenerate();
            }
        });
    }

    showLibraryInfo() {
        const count = this.sectionsLibrary.length;
        const message = `📚 Section Library: ${count} sections available\n\nAdd more sections to sections-library.js file to expand your library.`;
        alert(message);
    }

    async handleGenerate() {
        const promptInput = document.getElementById('section-prompt');
        const prompt = promptInput.value.trim();
        
        if (!prompt) {
            this.showToast('Please enter a description of the section you want to create', 'error');
            return;
        }

        if (this.sectionsLibrary.length === 0) {
            this.showToast('No sections available in library. Please add sections to sections-library.js', 'error');
            return;
        }

        this.currentPrompt = prompt;
        this.setLoading(true);

        try {
            // Find best matching section from library
            const result = this.findBestMatch(prompt);
            
            if (result) {
                this.generatedCode = result.code;
                this.displayCode(result.code);
                this.enableActions();
                this.showToast(`✅ Found matching section: "${result.title}"`, 'success');
            } else {
                this.showToast('No matching section found. Try different keywords or add more sections to the library.', 'warning');
            }
        } catch (error) {
            console.error('Generation error:', error);
            this.showToast(`❌ Error: ${error.message}`, 'error');
        } finally {
            this.setLoading(false);
        }
    }
    
    findBestMatch(prompt) {
        if (!prompt || this.sectionsLibrary.length === 0) return null;
        
        const promptLower = prompt.toLowerCase();
        const promptWords = promptLower.split(/\s+/).filter(w => w.length > 2);
        
        // Score each section
        const scored = this.sectionsLibrary.map(section => {
            let score = 0;
            
            // Title match (highest weight)
            const titleLower = section.title.toLowerCase();
            promptWords.forEach(word => {
                if (titleLower.includes(word)) score += 5;
            });
            
            // Description match
            const descLower = (section.description || '').toLowerCase();
            promptWords.forEach(word => {
                if (descLower.includes(word)) score += 3;
            });
            
            // Tag matches (high weight)
            const tags = section.tags || [];
            promptWords.forEach(word => {
                if (tags.some(tag => tag.toLowerCase().includes(word))) {
                    score += 4;
                }
            });
            
            // Category match
            const categoryLower = (section.category || '').toLowerCase();
            promptWords.forEach(word => {
                if (categoryLower.includes(word)) score += 2;
            });
            
            // Exact phrase matches (bonus)
            if (titleLower.includes(promptLower) || descLower.includes(promptLower)) {
                score += 10;
            }
            
            // Partial word matches
            promptWords.forEach(word => {
                if (titleLower.includes(word.substring(0, 3))) score += 1;
            });
            
            return { ...section, score };
        });
        
        // Sort by score and return best match
        scored.sort((a, b) => b.score - a.score);
        
        // Return best match if score is above threshold
        const bestMatch = scored[0];
        return bestMatch && bestMatch.score > 0 ? bestMatch : null;
    }


    displayCode(code) {
        const container = document.getElementById('code-container');
        container.innerHTML = `<pre class="generated-code"><code>${this.escapeHtml(code)}</code></pre>`;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    handleClear() {
        document.getElementById('section-prompt').value = '';
        document.getElementById('code-container').innerHTML = `
            <div class="code-placeholder">
                <p>Your generated Shopify section code will appear here</p>
                <p class="placeholder-hint">Enter a prompt above and click "Generate Section" to get started</p>
            </div>
        `;
        this.disableActions();
        this.generatedCode = null;
        this.currentPrompt = '';
    }

    async handleCopy() {
        if (!this.generatedCode) return;

        try {
            await navigator.clipboard.writeText(this.generatedCode);
            this.showToast('✅ Code copied to clipboard!', 'success');
            
            // Visual feedback
            const btn = document.getElementById('copy-code-btn');
            const originalHTML = btn.innerHTML;
            btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polyline points="20 6 9 17 4 12"></polyline></svg>';
            btn.style.color = '#10b981';
            
            setTimeout(() => {
                btn.innerHTML = originalHTML;
                btn.style.color = '';
            }, 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
            this.showToast('❌ Failed to copy to clipboard', 'error');
        }
    }

    handleDownload() {
        if (!this.generatedCode) return;

        const filename = `shopify-section-${Date.now()}.liquid`;
        const blob = new Blob([this.generatedCode], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('✅ File downloaded!', 'success');
    }

    handleRerun() {
        if (this.currentPrompt) {
            document.getElementById('section-prompt').value = this.currentPrompt;
            this.handleGenerate();
        }
    }


    setLoading(loading) {
        const btn = document.getElementById('generate-btn');
        const btnText = btn.querySelector('.btn-text');
        const btnLoader = btn.querySelector('.btn-loader');
        
        btn.disabled = loading;
        
        if (loading) {
            btnText.style.display = 'none';
            btnLoader.style.display = 'block';
        } else {
            btnText.style.display = 'inline';
            btnLoader.style.display = 'none';
        }
    }

    enableActions() {
        document.getElementById('copy-code-btn').disabled = false;
        document.getElementById('download-btn').disabled = false;
        document.getElementById('rerun-btn').disabled = false;
    }

    disableActions() {
        document.getElementById('copy-code-btn').disabled = true;
        document.getElementById('download-btn').disabled = true;
        document.getElementById('rerun-btn').disabled = true;
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toast-message');
        
        toastMessage.textContent = message;
        toast.style.display = 'block';
        
        // Set color based on type
        if (type === 'success') {
            toast.style.background = '#10b981';
        } else if (type === 'error') {
            toast.style.background = '#ef4444';
        } else if (type === 'warning') {
            toast.style.background = '#f59e0b';
        } else {
            toast.style.background = '#111827';
        }
        
        setTimeout(() => {
            toast.style.display = 'none';
        }, 3000);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.generator = new SectionGenerator();
});

