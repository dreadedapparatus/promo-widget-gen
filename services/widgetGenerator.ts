
import { Product } from '../types';

/**
 * Generates the self-contained HTML, CSS, and JS for the promotion widget.
 * Includes the fix for logo scaling in the brand filter.
 * @param {Product[]} products - Array of product objects.
 * @returns {{previewHtml: string, embeddableHtml: string}}
 */
export function generateWidgetHtml(products: Product[]): { previewHtml: string; embeddableHtml: string } {
    const escapeHtml = (unsafe: any): string => {
        if (unsafe === null || unsafe === undefined) return '';
        return unsafe.toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };

    const parseBoolean = (v: any): boolean => {
        const s = String(v ?? '').trim().toLowerCase();
        return ['1', 'y', 'yes', 'true', 't', 'x', '✓', '✔', 'flash'].includes(s);
    };
    
    const toYMD = (v: any): string => {
        if (!v || String(v).trim() === '') return '';
        if (typeof v === 'number' && isFinite(v) && v > 20000) { // Simple check to see if it's a likely Excel date number
            const epoch = new Date(Date.UTC(1899, 11, 30));
            const d = new Date(epoch.getTime() + v * 86400000);
            return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
        }
        try {
            const d = new Date(String(v));
            if (!isNaN(d.getTime())) {
                return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            }
        } catch(e) {/* ignore */}
        return String(v).split('T')[0];
    };

    const brands = [...new Map(products.map(p => [p['brand name'], p['brand logo url']])).entries()]
        .filter(([name, url]) => name && url);

    const hasAnyFlash = products.some(p => parseBoolean(p['flash sale']));
    const widgetId = 'promo-widget-' + Date.now() + Math.random().toString(36).substring(2);

    const filterHtml = (brands.length > 1 || hasAnyFlash) ? `
<div class="promo-logo-filter-container" role="tablist" aria-label="Promotion Filters">
    <div class="promo-filter-item active" data-filter="all" tabindex="0" role="tab" aria-selected="true" aria-label="Show All">
        <div class="promo-filter-logo-box all-brands">All</div>
        <span class="promo-filter-name">All</span>
    </div>
    ${hasAnyFlash ? `
    <div class="promo-filter-item flash" data-filter="flash" tabindex="0" role="tab" aria-selected="false" aria-label="Show Flash Sales">
        <div class="promo-filter-logo-box flash">⚡</div>
        <span class="promo-filter-name">Flash Sales</span>
    </div>` : ''}
    ${brands.map(([name, url]) => `
    <div class="promo-filter-item" data-filter="brand" data-value="${escapeHtml(name)}" tabindex="0" role="tab" aria-selected="false" aria-label="Filter by ${escapeHtml(name)}">
        <div class="promo-filter-logo-box">
            <img src="${escapeHtml(url)}" alt="${escapeHtml(name)} Logo" class="promo-filter-logo" loading="lazy">
        </div>
        <span class="promo-filter-name">${escapeHtml(name)}</span>
    </div>`).join('')}
</div>` : '';

    const interactionScript = `
<script>
(function() {
    function parseLocalYMD(ymd) {
        if (!ymd) return null;
        var parts = ymd.split('-');
        if (parts.length === 3) {
            return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        }
        return new Date(ymd); // Fallback
    }

    function isFlashActive(card) {
        if (card.getAttribute('data-flash') !== 'true') return true;
        var startStr = card.getAttribute('data-flash-start');
        var endStr = card.getAttribute('data-flash-end');
        var start = startStr ? parseLocalYMD(startStr) : null;
        var end = endStr ? parseLocalYMD(endStr) : null;
        var now = new Date();
        now.setHours(0, 0, 0, 0);

        if (end) end.setHours(23, 59, 59, 999);

        if (!start && !end) return true;
        if (start && end) return now >= start && now <= end;
        if (start) return now >= start;
        if (end) return now <= end;
        return false;
    }

    function setupPromoWidget(widgetId) {
        var widget = document.getElementById(widgetId);
        if (!widget) return;
        var filterContainer = widget.querySelector('.promo-logo-filter-container');
        var productCards = widget.querySelectorAll('.promo-product-card');

        function applyFilter(type, value) {
            var hasVisibleItems = false;
            productCards.forEach(function(card) {
                var isFlash = card.getAttribute('data-flash') === 'true';
                var brand = card.getAttribute('data-brand') || '';
                var active = isFlashActive(card);
                var show = false;

                if (type === 'all') {
                    show = !isFlash || (isFlash && active);
                } else if (type === 'flash') {
                    show = isFlash && active;
                } else if (type === 'brand') {
                    show = (brand === value) && (!isFlash || (isFlash && active));
                }
                card.style.display = show ? 'flex' : 'none';
                if (show) hasVisibleItems = true;
            });
        }

        if (filterContainer) {
            filterContainer.addEventListener('click', function(e) {
                var filterItem = e.target.closest('.promo-filter-item');
                if (!filterItem) return;
                filterContainer.querySelectorAll('.promo-filter-item').forEach(function(el) {
                    el.classList.remove('active');
                    el.setAttribute('aria-selected', 'false');
                });
                filterItem.classList.add('active');
                filterItem.setAttribute('aria-selected', 'true');
                applyFilter(filterItem.getAttribute('data-filter'), filterItem.getAttribute('data-value'));
            });
            // Initial filter application
            var initialFilter = filterContainer.querySelector('.promo-filter-item.active') || filterContainer.querySelector('[data-filter="all"]');
            if (initialFilter) {
                applyFilter(initialFilter.getAttribute('data-filter'), initialFilter.getAttribute('data-value'));
            }
        }
        
        var container = widget.querySelector('.promo-widget-container');
        if (container) {
            container.addEventListener('click', function(e) {
                if (e.target && e.target.matches('.promo-description-toggle')) {
                    e.preventDefault();
                    var targetId = e.target.getAttribute('data-target');
                    var description = document.getElementById(targetId);
                    if (description) {
                        description.classList.toggle('expanded');
                        e.target.textContent = description.classList.contains('expanded') ? 'See Less' : 'See More';
                    }
                }
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() { setupPromoWidget('${widgetId}'); });
    } else {
        setupPromoWidget('${widgetId}');
    }
})();
<\/script>`;
    
    const cssStyle = `
<style>
  :root { --promo-widget-accent-color: #007bff; }
  .promo-logo-filter-container { display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-start; margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #dee2e6; }
  .promo-filter-item { display: flex; flex-direction: column; align-items: center; gap: 5px; cursor: pointer; text-align: center; padding: 5px; border: 2px solid transparent; border-radius: 8px; transition: all 0.2s ease; }
  .promo-filter-logo-box { width: 100px; height: 60px; display: flex; justify-content: center; align-items: center; background-color: #fff; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); overflow: hidden; font-weight: 700; font-size: 1rem; }
  .promo-filter-logo-box.all-brands { border: 2px dashed #ced4da; }
  .promo-filter-logo-box.flash { background: linear-gradient(135deg, #ff6b6b, #feca57); color: #111; }
  .promo-filter-item:hover { transform: translateY(-2px); }
  .promo-filter-item.active { border-color: var(--promo-widget-accent-color, #007bff); }
  .promo-filter-item.active .promo-filter-name { color: var(--promo-widget-accent-color, #007bff); font-weight: 700; }
  .promo-filter-logo { max-width: 100%; max-height: 100%; object-fit: contain; } /* THIS IS THE FIX FOR LOGO SCALING */
  .promo-filter-name { font-size: 0.8em; font-weight: 500; color: #6c757d; width: 100px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .promo-widget-container { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 25px; font-family: inherit; }
  .promo-product-card { background-color: #fff; border: 1px solid #e9ecef; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.06); transition: transform 0.3s ease, box-shadow 0.3s ease; display: flex; flex-direction: column; position: relative; }
  .promo-product-card:hover { transform: translateY(-5px); box-shadow: 0 8px 25px rgba(0,0,0,0.1); }
  .promo-special-badge { position: absolute; top: 12px; left: -1px; background-color: #dc3545; color: white; padding: 5px 12px; font-size: 0.8em; font-weight: 700; border-radius: 0 5px 5px 0; box-shadow: 0 2px 5px rgba(0,0,0,0.2); z-index: 1; }
  .promo-special-badge.flash { background: linear-gradient(135deg, #ff6b6b, #feca57); color: #111; }
  .promo-image-wrapper { display: flex; justify-content: center; align-items: center; aspect-ratio: 4/3; background-color: #f8f9fa; }
  .promo-product-image { width: 100%; height: 100%; object-fit: contain; display: block; }
  .promo-product-info { padding: 20px; flex-grow: 1; display: flex; flex-direction: column; }
  .promo-product-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 5px; }
  .promo-product-name { font-size: 1.15em; font-weight: 600; color: #333; line-height: 1.3; }
  .promo-brand-logo { width: 50px; height: auto; max-height: 40px; object-fit: contain; flex-shrink: 0; }
  .promo-product-item { font-size: 0.8em; color: #777; margin: 0 0 10px 0; }
  .promo-product-description { font-size: 0.9em; color: #555; margin-bottom: 5px; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
  .promo-product-description.expanded { -webkit-line-clamp: unset; }
  .promo-description-toggle { font-size: 0.85em; font-weight: 600; color: var(--promo-widget-accent-color, #007bff); cursor: pointer; text-decoration: none; margin-bottom: 15px; align-self: flex-start; }
  .promo-product-pricing { margin-bottom: 20px; display: flex; flex-direction: column; gap: 6px; }
  .promo-price-item { display: flex; justify-content: space-between; align-items: baseline; font-size: 0.9em; }
  .promo-price-label { font-weight: 500; color: #666; }
  .promo-price-value { font-weight: 600; color: #333; }
  .promo-price-item.dealer-price .promo-price-value { font-weight: 700; color: #d9534f; font-size: 1.5em; }
  .promo-price-item.elite-price .promo-price-value { font-weight: 700; color: #b58900; }
  .promo-product-cta-container { margin-top: auto; padding-top: 10px; }
  .promo-product-cta { display: block; width: 100%; padding: 12px; background-color: var(--promo-widget-accent-color, #007bff); color: #fff; text-align: center; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 1em; transition: background-color 0.2s; }
  .promo-product-cta:hover { background-color: #0056b3; }
</style>`;

    const productCardsHtml = products.map((row, cardIndex) => {
        const name = escapeHtml(row['product name']);
        const itemNum = escapeHtml(row['item number']);
        const descriptionText = String(row['product description'] || '');
        const brandName = escapeHtml(row['brand name']);
        const brandLogoUrl = escapeHtml(row['brand logo url']);
        const specialPromoText = escapeHtml(row['special promo text']);
        const imgUrl = escapeHtml(row['image url']);
        const productUrl = escapeHtml(row['product url']);
        const getPrice = (v: any) => v ? parseFloat(String(v).replace(/[^0-9.]/g, '')) : NaN;
        const prices = {
            msrp: getPrice(row['msrp']),
            map: getPrice(row['map']),
            dealer: getPrice(row['dealer price']),
            elite: getPrice(row['elite dealer price']),
        };
        const isFlash = parseBoolean(row['flash sale']);
        const flashBadgeText = escapeHtml(row['flash badge text']) || 'FLASH SALE';
        const badgeText = isFlash ? flashBadgeText : specialPromoText;
        const badgeHtml = badgeText ? `<div class="promo-special-badge ${isFlash ? 'flash' : ''}">${badgeText}</div>` : '';
        const descriptionId = `promo-desc-${widgetId}-${cardIndex}`;
        const seeMoreLink = descriptionText.length > 120 ? `<a href="#" class="promo-description-toggle" data-target="${descriptionId}">See More</a>` : '';

        const priceHtml = (label: string, value: number, className: string = '') =>
            !isNaN(value) ? `<div class="promo-price-item ${className}"><span class="promo-price-label">${label}:</span><span class="promo-price-value">$${value.toFixed(2)}</span></div>` : '';

        return `
<div class="promo-product-card" data-brand="${brandName}" data-flash="${isFlash}" data-flash-start="${isFlash ? toYMD(row['flash start date']) : ''}" data-flash-end="${isFlash ? toYMD(row['flash end date']) : ''}">
  ${badgeHtml}
  <div class="promo-image-wrapper">
    <img src="${imgUrl}" alt="${name}" class="promo-product-image" loading="lazy" onerror="this.style.display='none'">
  </div>
  <div class="promo-product-info">
    <div class="promo-product-header">
      <h3 class="promo-product-name">${name}</h3>
      ${brandLogoUrl ? `<img src="${brandLogoUrl}" alt="${brandName} Logo" class="promo-brand-logo" loading="lazy">` : ''}
    </div>
    <p class="promo-product-item"># ${itemNum}</p>
    <p class="promo-product-description" id="${descriptionId}">${escapeHtml(descriptionText)}</p>
    ${seeMoreLink}
    <div class="promo-product-pricing">
      ${priceHtml('MSRP', prices.msrp)}
      ${priceHtml('MAP', prices.map)}
      ${priceHtml('Your Price', prices.dealer, 'dealer-price')}
      ${priceHtml('Elite Price', prices.elite, 'elite-price')}
    </div>
    <div class="promo-product-cta-container">
      <a href="${productUrl}" target="_blank" rel="noopener noreferrer" class="promo-product-cta">View Deal</a>
    </div>
  </div>
</div>`;
    }).join('');

    const previewHtml = `<div id="${widgetId}">${cssStyle}${filterHtml}<div class="promo-widget-container">${productCardsHtml}</div></div>`;
    const embeddableHtml = `<!-- Start of Promotion Widget -->\n${previewHtml}\n${interactionScript}\n<!-- End of Promotion Widget -->`;

    return { previewHtml, embeddableHtml };
}
