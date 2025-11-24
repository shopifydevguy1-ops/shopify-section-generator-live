/**
 * Sections Library
 * Add your Shopify sections here
 * The generator will match user prompts to these sections
 */

const sectionsLibrary = [
    {
        id: "hero-banner-1",
        title: "Hero Banner with Image",
        description: "Full-width hero banner with background image, centered headline text, subheadline, and call-to-action button. Fully responsive with overlay text.",
        tags: ["hero", "banner", "image", "cta", "full-width", "overlay"],
        category: "hero",
        code: `{% comment %}
  Hero Banner Section
  A full-width hero banner with background image and text overlay
{% endcomment %}

<div class="hero-banner" style="position: relative; min-height: 500px; display: flex; align-items: center; justify-content: center; background: {{ section.settings.background_color | default: '#1e293b' }};">
  {% if section.settings.background_image %}
    <img 
      src="{{ section.settings.background_image | image_url: width: 1920 }}"
      alt="{{ section.settings.background_image.alt | default: section.settings.headline }}"
      class="hero-background"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; z-index: 1;"
      loading="eager"
    >
  {% endif %}
  
  <div class="hero-overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, {{ section.settings.overlay_opacity | default: 0.4 }}); z-index: 2;"></div>
  
  <div class="hero-content" style="position: relative; z-index: 3; text-align: center; color: {{ section.settings.text_color | default: '#ffffff' }}; padding: 40px 20px; max-width: 800px;">
    {% if section.settings.headline %}
      <h1 class="hero-headline" style="font-size: {{ section.settings.headline_size | default: 48 }}px; font-weight: 700; margin-bottom: 20px; line-height: 1.2;">
        {{ section.settings.headline }}
      </h1>
    {% endif %}
    
    {% if section.settings.subheadline %}
      <p class="hero-subheadline" style="font-size: {{ section.settings.subheadline_size | default: 20 }}px; margin-bottom: 30px; opacity: 0.9;">
        {{ section.settings.subheadline }}
      </p>
    {% endif %}
    
    {% if section.settings.button_text %}
      <a href="{{ section.settings.button_link | default: '#' }}" class="hero-button" style="display: inline-block; padding: 14px 32px; background: {{ section.settings.button_color | default: '#2563eb' }}; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; transition: transform 0.2s;">
        {{ section.settings.button_text }}
      </a>
    {% endif %}
  </div>
</div>

<style>
  .hero-banner {
    overflow: hidden;
  }
  
  .hero-button:hover {
    transform: translateY(-2px);
  }
  
  @media (max-width: 768px) {
    .hero-headline {
      font-size: 32px !important;
    }
    
    .hero-subheadline {
      font-size: 18px !important;
    }
  }
</style>

{% schema %}
{
  "name": "Hero Banner",
  "settings": [
    {
      "type": "image_picker",
      "id": "background_image",
      "label": "Background Image"
    },
    {
      "type": "color",
      "id": "background_color",
      "label": "Background Color",
      "default": "#1e293b"
    },
    {
      "type": "range",
      "id": "overlay_opacity",
      "label": "Overlay Opacity",
      "min": 0,
      "max": 1,
      "step": 0.1,
      "default": 0.4
    },
    {
      "type": "text",
      "id": "headline",
      "label": "Headline",
      "default": "Welcome to Our Store"
    },
    {
      "type": "range",
      "id": "headline_size",
      "label": "Headline Size",
      "min": 24,
      "max": 72,
      "step": 2,
      "default": 48
    },
    {
      "type": "textarea",
      "id": "subheadline",
      "label": "Subheadline",
      "default": "Discover amazing products"
    },
    {
      "type": "range",
      "id": "subheadline_size",
      "label": "Subheadline Size",
      "min": 14,
      "max": 32,
      "step": 2,
      "default": 20
    },
    {
      "type": "text",
      "id": "button_text",
      "label": "Button Text",
      "default": "Shop Now"
    },
    {
      "type": "url",
      "id": "button_link",
      "label": "Button Link"
    },
    {
      "type": "color",
      "id": "button_color",
      "label": "Button Color",
      "default": "#2563eb"
    },
    {
      "type": "color",
      "id": "text_color",
      "label": "Text Color",
      "default": "#ffffff"
    }
  ],
  "presets": [
    {
      "name": "Hero Banner"
    }
  ]
}
{% endschema %}`
    },
    {
        id: "product-grid-1",
        title: "Product Grid",
        description: "Responsive product grid displaying products from a collection. Features hover effects, product images, titles, prices, and quick view functionality.",
        tags: ["products", "grid", "collection", "shop", "responsive"],
        category: "products",
        code: `{% comment %}
  Product Grid Section
  Displays products from a selected collection in a responsive grid
{% endcomment %}

{% assign collection = collections[section.settings.collection] %}

<div class="product-grid-section" style="padding: {{ section.settings.padding_top }}px 20px {{ section.settings.padding_bottom }}px;">
  <div class="container" style="max-width: 1200px; margin: 0 auto;">
    {% if section.settings.title %}
      <h2 class="section-title" style="text-align: center; font-size: {{ section.settings.title_size }}px; margin-bottom: 40px; font-weight: 700;">
        {{ section.settings.title }}
      </h2>
    {% endif %}
    
    {% if collection and collection.products.size > 0 %}
      <div class="product-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 24px;">
        {% for product in collection.products limit: section.settings.product_limit %}
          <div class="product-card" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; transition: transform 0.2s, box-shadow 0.2s;">
            <a href="{{ product.url }}" style="text-decoration: none; color: inherit;">
              <div class="product-image-wrapper" style="position: relative; padding-top: 100%; background: #f9fafb; overflow: hidden;">
                {% if product.featured_image %}
                  <img 
                    src="{{ product.featured_image | image_url: width: 500 }}"
                    alt="{{ product.featured_image.alt | default: product.title }}"
                    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s;"
                    loading="lazy"
                  >
                {% else %}
                  <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #9ca3af;">
                    No Image
                  </div>
                {% endif %}
              </div>
              
              <div class="product-info" style="padding: 16px;">
                <h3 class="product-title" style="font-size: 16px; font-weight: 600; margin-bottom: 8px; color: #111827;">
                  {{ product.title }}
                </h3>
                
                <div class="product-price" style="font-size: 18px; font-weight: 700; color: #2563eb;">
                  {{ product.price | money }}
                  {% if product.compare_at_price > product.price %}
                    <span style="font-size: 14px; color: #6b7280; text-decoration: line-through; margin-left: 8px;">
                      {{ product.compare_at_price | money }}
                    </span>
                  {% endif %}
                </div>
              </div>
            </a>
          </div>
        {% endfor %}
      </div>
    {% else %}
      <p style="text-align: center; color: #6b7280; padding: 40px;">
        No products found. Please select a collection in the theme editor.
      </p>
    {% endif %}
  </div>
</div>

<style>
  .product-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  }
  
  .product-card:hover .product-image-wrapper img {
    transform: scale(1.05);
  }
  
  @media (max-width: 768px) {
    .product-grid {
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)) !important;
      gap: 16px !important;
    }
  }
</style>

{% schema %}
{
  "name": "Product Grid",
  "settings": [
    {
      "type": "text",
      "id": "title",
      "label": "Section Title",
      "default": "Featured Products"
    },
    {
      "type": "range",
      "id": "title_size",
      "label": "Title Size",
      "min": 24,
      "max": 48,
      "step": 2,
      "default": 32
    },
    {
      "type": "collection",
      "id": "collection",
      "label": "Collection"
    },
    {
      "type": "range",
      "id": "product_limit",
      "label": "Products to Show",
      "min": 4,
      "max": 24,
      "step": 2,
      "default": 8
    },
    {
      "type": "range",
      "id": "padding_top",
      "label": "Padding Top",
      "min": 0,
      "max": 100,
      "step": 10,
      "default": 60
    },
    {
      "type": "range",
      "id": "padding_bottom",
      "label": "Padding Bottom",
      "min": 0,
      "max": 100,
      "step": 10,
      "default": 60
    }
  ],
  "presets": [
    {
      "name": "Product Grid"
    }
  ]
}
{% endschema %}`
    },
    {
        id: "image-text-1",
        title: "Image with Text",
        description: "Two-column layout with image on one side and text content on the other. Supports left/right image placement and customizable text styling.",
        tags: ["image", "text", "two-column", "content", "layout"],
        category: "content",
        code: `{% comment %}
  Image with Text Section
  Two-column layout with image and text content
{% endcomment %}

<div class="image-text-section" style="padding: {{ section.settings.padding_top }}px 20px {{ section.settings.padding_bottom }}px; background: {{ section.settings.background_color | default: '#ffffff' }};">
  <div class="container" style="max-width: 1200px; margin: 0 auto;">
    <div class="image-text-wrapper" style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: center;">
      {% assign image_first = section.settings.image_position == 'left' %}
      
      {% if image_first %}
        <div class="image-column">
          {% if section.settings.image %}
            <img 
              src="{{ section.settings.image | image_url: width: 800 }}"
              alt="{{ section.settings.image.alt | default: section.settings.heading }}"
              style="width: 100%; height: auto; border-radius: 8px;"
              loading="lazy"
            >
          {% else %}
            <div style="width: 100%; padding-top: 75%; background: #f3f4f6; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #9ca3af;">
              Add an image in theme settings
            </div>
          {% endif %}
        </div>
      {% endif %}
      
      <div class="text-column" style="color: {{ section.settings.text_color | default: '#111827' }};">
        {% if section.settings.heading %}
          <h2 class="section-heading" style="font-size: {{ section.settings.heading_size }}px; font-weight: 700; margin-bottom: 20px; line-height: 1.2;">
            {{ section.settings.heading }}
          </h2>
        {% endif %}
        
        {% if section.settings.text %}
          <div class="section-text" style="font-size: {{ section.settings.text_size }}px; line-height: 1.6; margin-bottom: 24px; color: {{ section.settings.text_color | default: '#374151' }};">
            {{ section.settings.text }}
          </div>
        {% endif %}
        
        {% if section.settings.button_text %}
          <a href="{{ section.settings.button_link | default: '#' }}" class="section-button" style="display: inline-block; padding: 12px 28px; background: {{ section.settings.button_color | default: '#2563eb' }}; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; transition: transform 0.2s;">
            {{ section.settings.button_text }}
          </a>
        {% endif %}
      </div>
      
      {% unless image_first %}
        <div class="image-column">
          {% if section.settings.image %}
            <img 
              src="{{ section.settings.image | image_url: width: 800 }}"
              alt="{{ section.settings.image.alt | default: section.settings.heading }}"
              style="width: 100%; height: auto; border-radius: 8px;"
              loading="lazy"
            >
          {% else %}
            <div style="width: 100%; padding-top: 75%; background: #f3f4f6; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #9ca3af;">
              Add an image in theme settings
            </div>
          {% endif %}
        </div>
      {% endunless %}
    </div>
  </div>
</div>

<style>
  .section-button:hover {
    transform: translateY(-2px);
  }
  
  @media (max-width: 768px) {
    .image-text-wrapper {
      grid-template-columns: 1fr !important;
      gap: 24px !important;
    }
  }
</style>

{% schema %}
{
  "name": "Image with Text",
  "settings": [
    {
      "type": "image_picker",
      "id": "image",
      "label": "Image"
    },
    {
      "type": "select",
      "id": "image_position",
      "label": "Image Position",
      "options": [
        { "value": "left", "label": "Left" },
        { "value": "right", "label": "Right" }
      ],
      "default": "left"
    },
    {
      "type": "text",
      "id": "heading",
      "label": "Heading",
      "default": "Heading Text"
    },
    {
      "type": "range",
      "id": "heading_size",
      "label": "Heading Size",
      "min": 24,
      "max": 48,
      "step": 2,
      "default": 36
    },
    {
      "type": "richtext",
      "id": "text",
      "label": "Text",
      "default": "<p>Add your text content here.</p>"
    },
    {
      "type": "range",
      "id": "text_size",
      "label": "Text Size",
      "min": 14,
      "max": 20,
      "step": 1,
      "default": 16
    },
    {
      "type": "text",
      "id": "button_text",
      "label": "Button Text"
    },
    {
      "type": "url",
      "id": "button_link",
      "label": "Button Link"
    },
    {
      "type": "color",
      "id": "button_color",
      "label": "Button Color",
      "default": "#2563eb"
    },
    {
      "type": "color",
      "id": "background_color",
      "label": "Background Color",
      "default": "#ffffff"
    },
    {
      "type": "color",
      "id": "text_color",
      "label": "Text Color",
      "default": "#111827"
    },
    {
      "type": "range",
      "id": "padding_top",
      "label": "Padding Top",
      "min": 0,
      "max": 100,
      "step": 10,
      "default": 60
    },
    {
      "type": "range",
      "id": "padding_bottom",
      "label": "Padding Bottom",
      "min": 0,
      "max": 100,
      "step": 10,
      "default": 60
    }
  ],
  "presets": [
    {
      "name": "Image with Text"
    }
  ]
}
{% endschema %}`
    },
    {
        id: "testimonials-1",
        title: "Testimonials Slider",
        description: "Customer testimonials displayed in a carousel slider. Features customer names, photos, ratings, and review text with smooth animations.",
        tags: ["testimonials", "slider", "reviews", "carousel", "social-proof"],
        category: "social-proof",
        code: `{% comment %}
  Testimonials Slider Section
  Customer reviews and testimonials in a carousel
{% endcomment %}

<div class="testimonials-section" style="padding: {{ section.settings.padding_top }}px 20px {{ section.settings.padding_bottom }}px; background: {{ section.settings.background_color | default: '#f9fafb' }};">
  <div class="container" style="max-width: 1200px; margin: 0 auto;">
    {% if section.settings.title %}
      <h2 class="section-title" style="text-align: center; font-size: {{ section.settings.title_size }}px; margin-bottom: 50px; font-weight: 700;">
        {{ section.settings.title }}
      </h2>
    {% endif %}
    
    <div class="testimonials-slider" style="position: relative;">
      <div class="testimonials-wrapper" style="display: flex; gap: 24px; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; -ms-overflow-style: none;">
        {% for block in section.blocks %}
          <div class="testimonial-card" style="min-width: 350px; background: white; padding: 32px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); scroll-snap-align: start;">
            {% if block.settings.rating %}
              <div class="testimonial-rating" style="margin-bottom: 16px; color: #fbbf24;">
                {% assign rating = block.settings.rating | times: 1 %}
                {% for i in (1..5) %}
                  {% if i <= rating %}
                    ★
                  {% else %}
                    ☆
                  {% endif %}
                {% endfor %}
              </div>
            {% endif %}
            
            {% if block.settings.text %}
              <p class="testimonial-text" style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 20px; font-style: italic;">
                "{{ block.settings.text }}"
              </p>
            {% endif %}
            
            <div class="testimonial-author" style="display: flex; align-items: center; gap: 12px;">
              {% if block.settings.author_image %}
                <img 
                  src="{{ block.settings.author_image | image_url: width: 60 }}"
                  alt="{{ block.settings.author_name }}"
                  style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover;"
                  loading="lazy"
                >
              {% endif %}
              <div>
                {% if block.settings.author_name %}
                  <div class="author-name" style="font-weight: 600; color: #111827;">
                    {{ block.settings.author_name }}
                  </div>
                {% endif %}
                {% if block.settings.author_title %}
                  <div class="author-title" style="font-size: 14px; color: #6b7280;">
                    {{ block.settings.author_title }}
                  </div>
                {% endif %}
              </div>
            </div>
          </div>
        {% endfor %}
      </div>
    </div>
    
    {% if section.blocks.size == 0 %}
      <p style="text-align: center; color: #6b7280; padding: 40px;">
        No testimonials yet. Add testimonials in the theme editor.
      </p>
    {% endif %}
  </div>
</div>

<style>
  .testimonials-wrapper::-webkit-scrollbar {
    display: none;
  }
  
  .testimonial-card {
    transition: transform 0.2s, box-shadow 0.2s;
  }
  
  .testimonial-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  }
  
  @media (max-width: 768px) {
    .testimonial-card {
      min-width: 280px !important;
    }
  }
</style>

{% schema %}
{
  "name": "Testimonials Slider",
  "settings": [
    {
      "type": "text",
      "id": "title",
      "label": "Section Title",
      "default": "What Our Customers Say"
    },
    {
      "type": "range",
      "id": "title_size",
      "label": "Title Size",
      "min": 24,
      "max": 48,
      "step": 2,
      "default": 32
    },
    {
      "type": "color",
      "id": "background_color",
      "label": "Background Color",
      "default": "#f9fafb"
    },
    {
      "type": "range",
      "id": "padding_top",
      "label": "Padding Top",
      "min": 0,
      "max": 100,
      "step": 10,
      "default": 60
    },
    {
      "type": "range",
      "id": "padding_bottom",
      "label": "Padding Bottom",
      "min": 0,
      "max": 100,
      "step": 10,
      "default": 60
    }
  ],
  "blocks": [
    {
      "type": "testimonial",
      "name": "Testimonial",
      "settings": [
        {
          "type": "range",
          "id": "rating",
          "label": "Rating",
          "min": 1,
          "max": 5,
          "step": 1,
          "default": 5
        },
        {
          "type": "textarea",
          "id": "text",
          "label": "Testimonial Text",
          "default": "This is an amazing product!"
        },
        {
          "type": "text",
          "id": "author_name",
          "label": "Author Name",
          "default": "John Doe"
        },
        {
          "type": "text",
          "id": "author_title",
          "label": "Author Title",
          "default": "Customer"
        },
        {
          "type": "image_picker",
          "id": "author_image",
          "label": "Author Image"
        }
      ]
    }
  ],
  "presets": [
    {
      "name": "Testimonials Slider",
      "blocks": [
        {
          "type": "testimonial"
        },
        {
          "type": "testimonial"
        },
        {
          "type": "testimonial"
        }
      ]
    }
  ]
}
{% endschema %}`
    },
    {
        id: "feature-columns-1",
        title: "Feature Columns",
        description: "Three-column feature section with icons, titles, and descriptions. Perfect for showcasing benefits, features, or services.",
        tags: ["features", "columns", "icons", "benefits", "three-column"],
        category: "features",
        code: `{% comment %}
  Feature Columns Section
  Three-column layout showcasing features or benefits
{% endcomment %}

<div class="feature-columns-section" style="padding: {{ section.settings.padding_top }}px 20px {{ section.settings.padding_bottom }}px; background: {{ section.settings.background_color | default: '#ffffff' }};">
  <div class="container" style="max-width: 1200px; margin: 0 auto;">
    {% if section.settings.title %}
      <h2 class="section-title" style="text-align: center; font-size: {{ section.settings.title_size }}px; margin-bottom: 50px; font-weight: 700;">
        {{ section.settings.title }}
      </h2>
    {% endif %}
    
    <div class="features-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 32px;">
      {% for block in section.blocks %}
        <div class="feature-item" style="text-align: center;">
          {% if block.settings.icon %}
            <div class="feature-icon" style="font-size: 48px; margin-bottom: 20px;">
              {{ block.settings.icon }}
            </div>
          {% elsif block.settings.icon_image %}
            <img 
              src="{{ block.settings.icon_image | image_url: width: 80 }}"
              alt="{{ block.settings.title }}"
              style="width: 80px; height: 80px; margin: 0 auto 20px; display: block;"
              loading="lazy"
            >
          {% endif %}
          
          {% if block.settings.title %}
            <h3 class="feature-title" style="font-size: 20px; font-weight: 600; margin-bottom: 12px; color: #111827;">
              {{ block.settings.title }}
            </h3>
          {% endif %}
          
          {% if block.settings.description %}
            <p class="feature-description" style="font-size: 16px; line-height: 1.6; color: #6b7280;">
              {{ block.settings.description }}
            </p>
          {% endif %}
        </div>
      {% endfor %}
    </div>
    
    {% if section.blocks.size == 0 %}
      <p style="text-align: center; color: #6b7280; padding: 40px;">
        No features yet. Add feature blocks in the theme editor.
      </p>
    {% endif %}
  </div>
</div>

<style>
  .feature-item {
    transition: transform 0.2s;
  }
  
  .feature-item:hover {
    transform: translateY(-4px);
  }
  
  @media (max-width: 768px) {
    .features-grid {
      grid-template-columns: 1fr !important;
      gap: 24px !important;
    }
  }
</style>

{% schema %}
{
  "name": "Feature Columns",
  "settings": [
    {
      "type": "text",
      "id": "title",
      "label": "Section Title",
      "default": "Why Choose Us"
    },
    {
      "type": "range",
      "id": "title_size",
      "label": "Title Size",
      "min": 24,
      "max": 48,
      "step": 2,
      "default": 32
    },
    {
      "type": "color",
      "id": "background_color",
      "label": "Background Color",
      "default": "#ffffff"
    },
    {
      "type": "range",
      "id": "padding_top",
      "label": "Padding Top",
      "min": 0,
      "max": 100,
      "step": 10,
      "default": 60
    },
    {
      "type": "range",
      "id": "padding_bottom",
      "label": "Padding Bottom",
      "min": 0,
      "max": 100,
      "step": 10,
      "default": 60
    }
  ],
  "blocks": [
    {
      "type": "feature",
      "name": "Feature",
      "settings": [
        {
          "type": "text",
          "id": "icon",
          "label": "Icon (Emoji or Symbol)",
          "default": "⭐"
        },
        {
          "type": "image_picker",
          "id": "icon_image",
          "label": "Or Icon Image"
        },
        {
          "type": "text",
          "id": "title",
          "label": "Feature Title",
          "default": "Feature Title"
        },
        {
          "type": "textarea",
          "id": "description",
          "label": "Description",
          "default": "Feature description goes here."
        }
      ]
    }
  ],
  "presets": [
    {
      "name": "Feature Columns",
      "blocks": [
        {
          "type": "feature"
        },
        {
          "type": "feature"
        },
        {
          "type": "feature"
        }
      ]
    }
  ]
}
{% endschema %}`
    }
];

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = sectionsLibrary;
}

