# How to Add Your Own Sections to the Library

This guide shows you how to add your own Shopify sections to the library so users can find and use them.

## 📝 Adding a New Section

### Step 1: Open `sections-library.js`

Open the file `sections-library.js` in your code editor.

### Step 2: Add Your Section Object

Add a new object to the `sectionsLibrary` array. Here's the structure:

```javascript
{
    id: "unique-section-id",           // Unique identifier (no spaces)
    title: "Section Title",            // Display name
    description: "What this section does and its features",  // Detailed description
    tags: ["tag1", "tag2", "tag3"],   // Keywords for matching (important!)
    category: "category-name",          // Category (hero, products, content, etc.)
    code: `{% comment %}
  Your complete Shopify Liquid code here
  Include the full section code with schema
{% endcomment %}

<div class="your-section">
  <!-- Your HTML/Liquid code -->
</div>

<style>
  /* Your CSS */
</style>

{% schema %}
{
  "name": "Your Section",
  "settings": [
    // Your schema settings
  ]
}
{% endschema %}`
}
```

### Step 3: Example

Here's a complete example:

```javascript
{
    id: "custom-newsletter",
    title: "Newsletter Signup Form",
    description: "Email subscription form with custom styling, validation, and success message. Includes name and email fields.",
    tags: ["newsletter", "email", "form", "subscription", "signup"],
    category: "marketing",
    code: `{% comment %}
  Newsletter Signup Section
{% endcomment %}

<div class="newsletter-section" style="padding: 60px 20px; background: #f9fafb; text-align: center;">
  <h2 style="font-size: 32px; margin-bottom: 16px;">Subscribe to Our Newsletter</h2>
  <p style="margin-bottom: 24px; color: #6b7280;">Get the latest updates and offers</p>
  
  {% form 'customer' %}
    <div style="max-width: 400px; margin: 0 auto; display: flex; gap: 8px;">
      <input 
        type="email" 
        name="contact[email]" 
        placeholder="Enter your email"
        required
        style="flex: 1; padding: 12px; border: 1px solid #e5e7eb; border-radius: 6px;"
      >
      <button 
        type="submit"
        style="padding: 12px 24px; background: #2563eb; color: white; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;"
      >
        Subscribe
      </button>
    </div>
  {% endform %}
</div>

{% schema %}
{
  "name": "Newsletter Signup",
  "settings": [],
  "presets": [
    {
      "name": "Newsletter Signup"
    }
  ]
}
{% endschema %}`
}
```

## 🏷️ Tips for Better Matching

### Tags Are Important!

The `tags` array is crucial for matching user prompts. Include:

- **Main function:** "hero", "banner", "slider", "grid"
- **Content type:** "products", "testimonials", "images", "text"
- **Features:** "responsive", "animated", "interactive"
- **Use cases:** "marketing", "social-proof", "navigation"

**Example:**
```javascript
tags: ["hero", "banner", "image", "cta", "full-width", "overlay", "responsive"]
```

### Description Matters

Write a detailed description that includes:
- What the section does
- Key features
- What it's best used for

This helps the matching algorithm find the right section.

### Category

Use consistent categories:
- `hero` - Hero banners and landing sections
- `products` - Product displays and grids
- `content` - Text and image content
- `social-proof` - Testimonials, reviews, logos
- `features` - Feature lists and benefits
- `marketing` - CTAs, forms, newsletters
- `navigation` - Menus, headers, footers

## 📋 Section Code Requirements

Your section code must:

1. ✅ Be valid Shopify Liquid code
2. ✅ Include a `{% schema %}` block
3. ✅ Be compatible with Online Store 2.0
4. ✅ Include proper error handling
5. ✅ Be responsive (mobile-friendly)
6. ✅ Include CSS styling (in `<style>` tags)

## 🔍 Testing Your Section

1. **Add the section** to `sections-library.js`
2. **Save the file**
3. **Refresh the app** in your browser
4. **Try searching** for your section using keywords from your tags
5. **Verify** the code appears correctly

## 📚 Best Practices

1. **Use descriptive IDs:** `hero-banner-1` not `section1`
2. **Include many tags:** More tags = better matching
3. **Write clear descriptions:** Help users understand what it does
4. **Test the code:** Make sure it works in Shopify
5. **Add comments:** Help users understand the code
6. **Keep it modular:** Make sections customizable via schema

## 🎯 Quick Checklist

Before adding a section, make sure:

- [ ] Unique `id` (no spaces, use hyphens)
- [ ] Clear, descriptive `title`
- [ ] Detailed `description` with features
- [ ] Multiple relevant `tags` (at least 3-5)
- [ ] Appropriate `category`
- [ ] Complete, working `code` with schema
- [ ] Code is tested and works in Shopify
- [ ] Responsive design included
- [ ] Proper error handling

## 💡 Example: Adding a FAQ Section

```javascript
{
    id: "faq-accordion-1",
    title: "FAQ Accordion",
    description: "Expandable FAQ section with smooth accordion animations. Perfect for answering common questions. Supports multiple FAQ items with questions and answers.",
    tags: ["faq", "accordion", "questions", "answers", "expandable", "help"],
    category: "content",
    code: `{% comment %}
  FAQ Accordion Section
{% endcomment %}

<div class="faq-section" style="padding: 60px 20px; max-width: 800px; margin: 0 auto;">
  {% if section.settings.title %}
    <h2 style="text-align: center; font-size: 32px; margin-bottom: 40px;">
      {{ section.settings.title }}
    </h2>
  {% endif %}
  
  <div class="faq-list">
    {% for block in section.blocks %}
      <div class="faq-item" style="border-bottom: 1px solid #e5e7eb; padding: 20px 0;">
        <button class="faq-question" style="width: 100%; text-align: left; background: none; border: none; font-size: 18px; font-weight: 600; cursor: pointer; padding: 12px 0;">
          {{ block.settings.question }}
          <span style="float: right;">+</span>
        </button>
        <div class="faq-answer" style="padding: 12px 0; color: #6b7280; display: none;">
          {{ block.settings.answer }}
        </div>
      </div>
    {% endfor %}
  </div>
</div>

<style>
  .faq-question:hover {
    color: #2563eb;
  }
</style>

{% schema %}
{
  "name": "FAQ Accordion",
  "settings": [
    {
      "type": "text",
      "id": "title",
      "label": "Section Title",
      "default": "Frequently Asked Questions"
    }
  ],
  "blocks": [
    {
      "type": "faq",
      "name": "FAQ Item",
      "settings": [
        {
          "type": "text",
          "id": "question",
          "label": "Question"
        },
        {
          "type": "richtext",
          "id": "answer",
          "label": "Answer"
        }
      ]
    }
  ],
  "presets": [
    {
      "name": "FAQ Accordion"
    }
  ]
}
{% endschema %}`
}
```

## 🚀 Ready to Add Sections?

1. Open `sections-library.js`
2. Add your section objects to the array
3. Save and refresh the app
4. Test by searching for your sections!

---

**Need help?** Make sure your section code is valid Shopify Liquid and includes all required fields!

