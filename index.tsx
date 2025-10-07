/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Fix: Add useEffect to the React import.
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
// Fix: Removed incorrect import as all functions are defined in this file.

// Assume SheetJS is loaded globally from a script in index.html
declare var XLSX: any;

// --- TYPE DEFINITIONS ---
export interface Product {
  'Product name': string;
  'Item number': string;
  'Product description'?: string;
  'Brand Name'?: string;
  'Brand Logo URL'?: string;
  'Special Promo Text'?: string;
  'MSRP'?: number | string;
  'MAP'?: number | string;
  'Dealer Price'?: number | string;
  'Elite Dealer Price'?: number | string;
  'Image URL'?: string;
  'Product URL'?: string;
  'Flash Sale'?: string;
  'Flash Start Date'?: string | number;
  'Flash End Date'?: string | number;
  'Flash Badge Text'?: string;
  [key: string]: any; // Allow for dynamic keys after normalization
}


interface GeneratedCode {
    embed: string;
}

// --- REACT COMPONENTS ---

const Step: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <section className="step">
        <h2>{title}</h2>
        {children}
    </section>
);

const FeedbackBox: React.FC<{ message: string; type: 'success' | 'error' }> = ({ message, type }) => (
    <div className={`feedback-box ${type}-box`} role="alert">
        {message}
    </div>
);

const Header = () => (
    <header>
        <h1>🛍️ Promotion Widget Generator</h1>
        <p>Upload monthly promos (and optional weekly ⚡ Flash Sales) to get a beautiful, embeddable widget.</p>
    </header>
);

const TemplateDownloader = () => {
    const [isDisabled, setIsDisabled] = useState(false);

    const handleDownload = async (type: 'xlsx' | 'csv') => {
        setIsDisabled(true);
        await downloadTemplate(type);
        setTimeout(() => setIsDisabled(false), 350);
    };

    return (
        <Step title="Step 1: Get the Template">
            <p>Download a template to ensure your data is formatted correctly. Fill it out with your product information.</p>
            <div className="button-group">
                <button type="button" onClick={() => handleDownload('xlsx')} className="btn btn-primary" disabled={isDisabled}>Download .xlsx Template</button>
                <button type="button" onClick={() => handleDownload('csv')} className="btn btn-secondary" disabled={isDisabled}>Download .csv Template</button>
            </div>
             <div className="note">
              <strong>About Flash Sales:</strong>
              <ul style={{ margin: '8px 0 0 18px' }}>
                <li>New optional columns: <code>Flash Sale</code>, <code>Flash Start Date</code>, <code>Flash End Date</code>, <code>Flash Badge Text</code>.</li>
                <li>Set <code>Flash Sale</code> to <em>Yes/True/1/Y</em> to mark an item as a weekly flash sale.</li>
                <li>Use <code>YYYY-MM-DD</code> for dates. The embed uses the visitor’s <em>local time</em> to decide what’s active.</li>
              </ul>
            </div>
        </Step>
    );
};

const FileUploader: React.FC<{ onProcessFile: (products: Product[]) => void; onError: (message: string) => void; clearFeedback: () => void; }> = ({ onProcessFile, onError, clearFeedback }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        clearFeedback();

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                if (!XLSX) {
                    throw new Error("Spreadsheet library (SheetJS) not loaded.");
                }
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });

                const EXPECTED_COLUMNS = ['Product name','Item number','Product description','Brand Name','Brand Logo URL'];
                const LOWERCASE_EXPECTED_COLUMNS = EXPECTED_COLUMNS.map(c => c.toLowerCase());
                
                let processed = false;
                for (const sheetName of workbook.SheetNames) {
                    const worksheet = workbook.Sheets[sheetName];
                    if (!worksheet) continue;

                    const sheetDataAsArray = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
                    let headerRowIndex = -1;

                    for (let i = 0; i < Math.min(10, sheetDataAsArray.length); i++) {
                        const row = sheetDataAsArray[i].map((h: any) => String(h).trim().toLowerCase());
                        const foundCols = LOWERCASE_EXPECTED_COLUMNS.filter(col => row.includes(col));
                        if (foundCols.length >= 3) { headerRowIndex = i; break; }
                    }

                    if (headerRowIndex !== -1) {
                        const jsonData = XLSX.utils.sheet_to_json(worksheet, { range: headerRowIndex });
                        if (jsonData.length === 0) continue;

                        const normalizedData = jsonData.map((row: any) => {
                            const normalized: { [key: string]: any } = {};
                            for (const key in row) {
                                if (Object.prototype.hasOwnProperty.call(row, key)) {
                                    normalized[key.trim().toLowerCase()] = row[key];
                                }
                            }
                            return normalized;
                        });
                        
                        onProcessFile(normalizedData as Product[]);
                        processed = true;
                        break;
                    }
                }
                if (!processed) {
                    throw new Error(`Could not find required columns on any sheet. Please ensure your file includes headers like: ${EXPECTED_COLUMNS.join(', ')}`);
                }

            } catch (error: any) {
                onError(error.message);
            } finally {
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.onerror = () => {
            onError('Failed to read the file.');
        };
        reader.readAsArrayBuffer(file);
    };

    return (
        <form>
            <label htmlFor="file-input" id="file-input-label">Click or drag to upload .xlsx or .csv</label>
            <input
                ref={fileInputRef}
                aria-label="Upload spreadsheet"
                type="file"
                id="file-input"
                name="file"
                required
                accept=".csv, .xls, .xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                onChange={handleFileChange}
            />
        </form>
    );
};

interface AppearanceOptions {
    accentColor: string;
    columns: string;
    theme: string;
    cornerRadius: string;
    showItemNumber: boolean;
}

const AppearanceCustomizer: React.FC<{
    options: AppearanceOptions;
    setOptions: React.Dispatch<React.SetStateAction<AppearanceOptions>>;
}> = ({ options, setOptions }) => {
    
    const setOption = <K extends keyof AppearanceOptions>(key: K, value: AppearanceOptions[K]) => {
        setOptions(prev => ({...prev, [key]: value}));
    }

    return (
        <div className="customizer-grid">
            <div className="customizer-group">
                <label htmlFor="accent-color">Accent Color</label>
                <input id="accent-color" type="color" value={options.accentColor} onChange={(e) => setOption('accentColor', e.target.value)} title="Select accent color"/>
            </div>
             <div className="customizer-group">
                <label htmlFor="theme-select">Theme</label>
                <div className="btn-toggle-group">
                    <button onClick={() => setOption('theme', 'light')} className={options.theme === 'light' ? 'active' : ''}>Light</button>
                    <button onClick={() => setOption('theme', 'dark')} className={options.theme === 'dark' ? 'active' : ''}>Dark</button>
                </div>
            </div>
            <div className="customizer-group">
                <label htmlFor="columns-select">Columns</label>
                <select id="columns-select" value={options.columns} onChange={(e) => setOption('columns', e.target.value)}>
                    <option value="auto">Auto</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                </select>
            </div>
            <div className="customizer-group">
                <label htmlFor="corner-style-select">Corner Style</label>
                <div className="btn-toggle-group">
                    <button onClick={() => setOption('cornerRadius', 'rounded')} className={options.cornerRadius === 'rounded' ? 'active' : ''}>Rounded</button>
                    <button onClick={() => setOption('cornerRadius', 'sharp')} className={options.cornerRadius === 'sharp' ? 'active' : ''}>Sharp</button>
                </div>
            </div>
            <div className="customizer-group checkbox-group">
                <input id="show-item-number" type="checkbox" checked={options.showItemNumber} onChange={(e) => setOption('showItemNumber', e.target.checked)} />
                <label htmlFor="show-item-number">Show Item #</label>
            </div>
        </div>
    );
};

const CodeOutput: React.FC<{ code: string }> = ({ code }) => {
    const [copied, setCopied] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleCopy = () => {
        if (textareaRef.current) {
            textareaRef.current.select();
            navigator.clipboard.writeText(code).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            });
        }
    };

    return (
        <>
            <textarea id="html-code" ref={textareaRef} value={code} readOnly aria-label="Embeddable HTML code"></textarea>
            <div className="button-group">
                <button type="button" id="copy-button" className="btn btn-primary" onClick={handleCopy}>
                    📋 Copy Code
                </button>
                {copied && <span id="copy-feedback">Copied!</span>}
            </div>
        </>
    );
};

// --- WIDGET PREVIEW COMPONENTS ---

const ProductCard: React.FC<{ product: Product; widgetId: string; idx: number; showItemNumber: boolean; }> = ({ product, widgetId, idx, showItemNumber }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    const name = escapeHtml(product['product name']);
    const itemNum = escapeHtml(product['item number']);
    const descriptionText = String(product['product description'] || '');
    const descriptionHtml = escapeHtml(descriptionText);
    const brandName = escapeHtml(product['brand name']);
    const brandLogoUrl = escapeHtml(product['brand logo url']);
    const specialPromoText = escapeHtml(product['special promo text']);
    const imgUrl = escapeHtml(product['image url']);
    const productUrl = escapeHtml(product['product url']);
    const getPrice = (value: any) => { const s = String(value || '').trim(); if (!s) return null; const num = parseFloat(s.replace(/[^0-9.]/g, '')); return isNaN(num) ? null : num; };
    const msrp = getPrice(product['msrp']);
    const map = getPrice(product['map']);
    const dealerPrice = getPrice(product['dealer price']);
    const elitePrice = getPrice(product['elite dealer price']);
    const isFlash = parseBoolean(product['flash sale']);
    const flashBadgeText = escapeHtml(product['flash badge text']) || 'FLASH SALE';
    const badgeText = specialPromoText || (isFlash ? flashBadgeText : '');
    const badgeHtml = badgeText ? <div className={`promo-special-badge ${isFlash ? 'flash' : ''}`}>{badgeText}</div> : null;
    const descriptionId = `promo-desc-${widgetId}-${idx}`;
    const seeMoreLink = descriptionText.length > 120 ? <a href="#" className="promo-description-toggle" onClick={e => { e.preventDefault(); setIsExpanded(!isExpanded); }}>{isExpanded ? 'See Less' : 'See More'}</a> : null;
    const msrpHtml = msrp !== null ? <div className="promo-price-item"><span className="promo-price-label">MSRP:</span><span className="promo-price-value">${msrp.toFixed(2)}</span></div> : null;
    const mapHtml = map !== null ? <div className="promo-price-item"><span className="promo-price-label">MAP:</span><span className="promo-price-value">${map.toFixed(2)}</span></div> : null;
    const dealerHtml = dealerPrice !== null ? <div className="promo-price-item dealer-price"><span className="promo-price-label">Your Price:</span><span className="promo-price-value">${dealerPrice.toFixed(2)}</span></div> : null;
    const eliteHtml = elitePrice !== null ? <div className="promo-price-item elite-price"><span className="promo-price-label">Elite Price:</span><span className="promo-price-value">${elitePrice.toFixed(2)}</span></div> : null;

    return (
        <div className="promo-product-card" data-brand={brandName}>
            {badgeHtml}
            <div className="promo-image-wrapper"><img src={imgUrl} alt={name} className="promo-product-image" loading="lazy" /></div>
            <div className="promo-product-info">
                <div className="promo-product-header">
                    <h3 className="promo-product-name">{name}</h3>
                    {brandLogoUrl ? <img src={brandLogoUrl} alt={`${brandName} Logo`} className="promo-brand-logo" loading="lazy" /> : ''}
                </div>
                {showItemNumber && <p className="promo-product-item">Item #: {itemNum}</p>}
                <p className={`promo-product-description ${isExpanded ? 'expanded' : ''}`} id={descriptionId}>{descriptionHtml}</p>
                {seeMoreLink}
                <div className="promo-product-pricing">{msrpHtml}{mapHtml}{dealerHtml}{eliteHtml}</div>
                <div className="promo-product-cta-container"><a href={productUrl} target="_blank" rel="noopener noreferrer" className="promo-product-cta">View Deal</a></div>
            </div>
        </div>
    );
};

interface Filter { type: 'all' | 'flash' | 'brand'; value?: string; }
const FilterBar: React.FC<{ brands: [string, string][]; hasAnyFlash: boolean; activeFilter: Filter; onFilterChange: (filter: Filter) => void; }> = ({ brands, hasAnyFlash, activeFilter, onFilterChange }) => {
    const showFilterBar = (brands.length > 1) || hasAnyFlash;
    if (!showFilterBar) return null;

    return (
        <div className="promo-logo-filter-container" role="tablist" aria-label="Promotion Filters">
            <div className={`promo-filter-item ${activeFilter.type === 'all' ? 'active' : ''}`} onClick={() => onFilterChange({ type: 'all' })} tabIndex={0} role="tab" aria-selected={activeFilter.type === 'all'}>
                <div className="promo-filter-logo-box all-brands">All</div>
                <span className="promo-filter-name">All</span>
            </div>
            {hasAnyFlash && (
                <div className={`promo-filter-item flash ${activeFilter.type === 'flash' ? 'active' : ''}`} onClick={() => onFilterChange({ type: 'flash' })} tabIndex={0} role="tab" aria-selected={activeFilter.type === 'flash'}>
                    <div className="promo-filter-logo-box flash">⚡</div>
                    <span className="promo-filter-name">Flash Sales</span>
                </div>
            )}
            {brands.map(([name, url]) => (
                <div key={name} className={`promo-filter-item ${activeFilter.type === 'brand' && activeFilter.value === name ? 'active' : ''}`} onClick={() => onFilterChange({ type: 'brand', value: name })} tabIndex={0} role="tab" aria-selected={activeFilter.type === 'brand' && activeFilter.value === name} aria-label={`Filter by ${name}`}>
                    <div className="promo-filter-logo-box">
                        <img src={url} alt={name} className="promo-filter-logo" loading="lazy" />
                    </div>
                    <span className="promo-filter-name">{name}</span>
                </div>
            ))}
        </div>
    );
};

const WidgetPreview: React.FC<{ products: Product[]; options: AppearanceOptions }> = ({ products, options }) => {
    const [activeFilter, setActiveFilter] = useState<Filter>({ type: 'all' });
    const widgetId = useMemo(() => 'promo-widget-preview-' + Date.now(), []);

    const brands = useMemo(() => [...new Map(products.map(p => [p['brand name'], p['brand logo url']])).entries()]
        .filter(([name, url]) => name && url) as [string, string][], [products]);
    
    const hasAnyFlash = useMemo(() => products.some(p => parseBoolean(p['flash sale'])), [products]);

    const filteredProducts = useMemo(() => {
        const now = new Date();
    
        const isCurrentlyActiveFlash = (product: Product): boolean => {
            const isFlash = parseBoolean(product['flash sale']);
            if (!isFlash) return false;
    
            const startDate = toYMD(product['flash start date']);
            const endDate = toYMD(product['flash end date']);
            const start = startDate ? parseLocalYMD(startDate) : null;
            const end = endDate ? parseLocalYMD(endDate) : null;
            
            if (end) {
                // Make end date inclusive by setting time to the end of the day.
                end.setHours(23, 59, 59, 999);
            }
    
            if (!start && !end) return true; // No dates, always active.
            if (start && end) return now >= start && now <= end;
            if (start) return now >= start;
            if (end) return now <= end;
            
            return false; // Safe fallback
        };
    
        return products.filter(product => {
            const isFlash = parseBoolean(product['flash sale']);
            const brand = product['brand name'] || '';
    
            switch (activeFilter.type) {
                case 'all':
                    return true;
                case 'flash':
                    return isFlash && isCurrentlyActiveFlash(product);
                case 'brand':
                    return brand === activeFilter.value;
                default:
                    return true;
            }
        });
    }, [products, activeFilter]);

    return (
        <div 
            style={{ '--promo-widget-accent-color': options.accentColor } as React.CSSProperties} 
            data-theme={options.theme} 
            data-corners={options.cornerRadius}
            data-columns={options.columns}
        >
            <style dangerouslySetInnerHTML={{ __html: WIDGET_CSS }} />
            <FilterBar brands={brands} hasAnyFlash={hasAnyFlash} activeFilter={activeFilter} onFilterChange={setActiveFilter} />
            <div className="promo-widget-container">
                {filteredProducts.map((p, i) => <ProductCard key={p['Item number'] || i} product={p} widgetId={widgetId} idx={i} showItemNumber={options.showItemNumber} />)}
            </div>
        </div>
    );
};


// --- MAIN APP COMPONENT ---

const App = () => {
    const [products, setProducts] = useState<Product[] | null>(null);
    const [generatedCode, setGeneratedCode] = useState<GeneratedCode | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [appearanceOptions, setAppearanceOptions] = useState<AppearanceOptions>({
        accentColor: '#007bff',
        columns: 'auto',
        theme: 'light',
        cornerRadius: 'rounded',
        showItemNumber: true
    });
    
    useEffect(() => {
        if (products) {
            setIsLoading(true);
            setFeedback(null);
            setTimeout(() => { // Simulate processing time for UX feedback
                try {
                    const code = generateWidgetEmbedCode(products, appearanceOptions);
                    setGeneratedCode(code);
                    setFeedback({ message: 'Successfully generated widget!', type: 'success' });
                } catch (e: any) {
                    setFeedback({ message: e.message, type: 'error' });
                } finally {
                    setIsLoading(false);
                }
            }, 300);
        }
    }, [products, appearanceOptions]);

    const handleFileProcessing = (newProducts: Product[]) => {
        setProducts(newProducts);
    }
    
    const handleError = (message: string) => {
        setFeedback({ message, type: 'error' });
        setIsLoading(false);
        setGeneratedCode(null);
        setProducts(null);
    };

    const clearFeedback = () => {
        setFeedback(null);
        setIsLoading(true);
    }

    return (
        <div className="container">
            <Header />
            <main>
                <TemplateDownloader />

                <Step title="Step 2: Upload & Customize">
                     <p>Upload the completed <code>.xlsx</code> or <code>.csv</code> file, then customize the widget's appearance.</p>
                    <FileUploader onProcessFile={handleFileProcessing} onError={handleError} clearFeedback={clearFeedback} />
                    <h3 className="customizer-heading">Appearance</h3>
                    <AppearanceCustomizer options={appearanceOptions} setOptions={setAppearanceOptions} />

                    {isLoading && <div className="loader" aria-busy="true"></div>}
                    {feedback && <FeedbackBox message={feedback.message} type={feedback.type} />}
                </Step>

                {products && generatedCode && (
                    <>
                        <Step title="Step 3: Preview Your Widget">
                            <p>The preview mirrors the embed and updates with your theme choices. Try the filters!</p>
                            <div id="preview-container">
                                <WidgetPreview products={products} options={appearanceOptions} />
                            </div>
                        </Step>
                        <Step title="Step 4: Get the Embed Code">
                            <p>Copy the code below and paste it into your website’s HTML where you want the widget to appear.</p>
                             <div className="note">
                                <strong>Theme & Behavior:</strong>
                                <ul style={{margin: '8px 0 0 18px'}}>
                                    <li>The widget inherits your site’s font. All your appearance choices are now embedded in the code.</li>
                                    <li>Flash items automatically show/hide by date on each visitor’s device.</li>
                                </ul>
                            </div>
                            <CodeOutput code={generatedCode.embed} />
                        </Step>
                    </>
                )}
            </main>
            <footer>
                <p>Built with ❤️ and React</p>
            </footer>
        </div>
    );
};

// --- RENDER THE APP ---
const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// --- UTILITY & GENERATOR FUNCTIONS ---

function escapeHtml(unsafe: any): string {
  if (unsafe === null || unsafe === undefined) return '';
  return unsafe.toString()
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function parseBoolean(v: any): boolean {
  const s = String(v ?? '').trim().toLowerCase();
  return ['1', 'y', 'yes', 'true', 't', 'x', '✓', '✔', 'flash'].includes(s);
}

function toYMD(v: any): string {
  if (v === null || v === undefined || String(v).trim() === '') return '';
  if (typeof v === 'number' && isFinite(v)) {
    const epoch = new Date(Date.UTC(1899, 11, 30));
    const d = new Date(epoch.getTime() + v * 86400000);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
  }
  const str = String(v).trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str);
  if (m) return str;
  const d = new Date(str);
  if (!isNaN(d.valueOf())) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  return '';
}

function parseLocalYMD(ymd: string): Date | null {
    if (!ymd) return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
    // Note: Treats date string as local time zone by constructing with numbers
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    const d = new Date(ymd); // Fallback for other date formats
    return isNaN(d.valueOf()) ? null : d;
}

const WIDGET_CSS = `
  :root {
    --card-bg: #fff;
    --card-border: #ddd;
    --card-shadow: 0 4px 15px rgba(0,0,0,0.08);
    --card-shadow-hover: 0 12px 25px rgba(0,0,0,0.12);
    --text-primary: #333;
    --text-secondary: #555;
    --text-muted: #777;
    --text-label: #666;
    --filter-border: #dee2e6;
    --filter-logo-bg: #fff;
    --filter-name-color: #6c757d;
    --image-bg: #f0f0f0;
    --dealer-price-color: #d9534f;
    --elite-price-color: #b58900;
  }
  [data-theme="dark"] {
    --card-bg: #2d3748;
    --card-border: #4a5568;
    --card-shadow: 0 4px 15px rgba(0,0,0,0.2);
    --card-shadow-hover: 0 12px 25px rgba(0,0,0,0.3);
    --text-primary: #edf2f7;
    --text-secondary: #e2e8f0;
    --text-muted: #a0aec0;
    --text-label: #a0aec0;
    --filter-border: #4a5568;
    --filter-logo-bg: #4a5568;
    --filter-name-color: #a0aec0;
    --image-bg: #4a5568;
    --dealer-price-color: #e53e3e;
    --elite-price-color: #d69e2e;
  }
  [data-corners="sharp"] .promo-product-card, 
  [data-corners="sharp"] .promo-filter-logo-box,
  [data-corners="sharp"] .promo-product-cta,
  [data-corners="sharp"] .promo-filter-item,
  [data-corners="sharp"] .promo-special-badge { border-radius: 4px; }
  [data-columns="2"] .promo-widget-container { grid-template-columns: repeat(2, 1fr); }
  [data-columns="3"] .promo-widget-container { grid-template-columns: repeat(3, 1fr); }
  [data-columns="4"] .promo-widget-container { grid-template-columns: repeat(4, 1fr); }
  @media (max-width: 800px) {
    [data-columns="4"] .promo-widget-container,
    [data-columns="3"] .promo-widget-container { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 500px) {
    [data-columns="4"] .promo-widget-container,
    [data-columns="3"] .promo-widget-container,
    [data-columns="2"] .promo-widget-container { grid-template-columns: 1fr; }
  }
  @keyframes pulse { 0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0, 123, 255, 0.7); } 70% { transform: scale(1.02); box-shadow: 0 0 0 10px rgba(0, 123, 255, 0); } 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0, 123, 255, 0); } }
  @media (prefers-reduced-motion: reduce) { .promo-product-cta { animation: none !important; } }
  .promo-logo-filter-container { display: flex; flex-wrap: wrap; gap: 20px; align-items: flex-start; margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid var(--filter-border); }
  .promo-filter-item { display: flex; flex-direction: column; align-items: center; gap: 5px; cursor: pointer; text-align: center; padding: 5px; border: 2px solid transparent; border-radius: 8px; transition: all 0.2s ease; }
  .promo-filter-logo-box { width: 100px; height: 60px; display: flex; justify-content: center; align-items: center; background-color: var(--filter-logo-bg); border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); overflow: hidden; font-weight: 700; font-size: 1rem; }
  .promo-filter-logo { max-width: 100%; max-height: 100%; width: auto; height: auto; object-fit: contain; display: block; }
  .promo-filter-logo-box.all-brands { font-weight: 600; border: 2px dashed #ced4da; }
  .promo-filter-logo-box.flash { background: linear-gradient(135deg, #ff6b6b, #feca57); color: #111; }
  .promo-filter-item:hover { transform: scale(1.05); }
  .promo-filter-item.active { border-color: var(--promo-widget-accent-color); }
  .promo-filter-item.active .promo-filter-name { color: var(--promo-widget-accent-color); font-weight: 700; }
  .promo-filter-name { font-size: 0.8em; font-weight: 500; color: var(--filter-name-color); width: 100px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .promo-widget-container { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 25px; font-family: inherit; padding-top: 15px; }
  .promo-product-card { background-color: var(--card-bg); border: 1px solid var(--card-border); border-radius: 12px; overflow: hidden; box-shadow: var(--card-shadow); transition: transform 0.3s ease, box-shadow 0.3s ease; display: flex; flex-direction: column; position: relative; }
  .promo-product-card:hover { transform: translateY(-8px); box-shadow: var(--card-shadow-hover); }
  .promo-special-badge { position: absolute; top: 12px; left: -1px; background-color: #dc3545; color: white; padding: 5px 12px; font-size: 0.8em; font-weight: 700; border-radius: 0 5px 5px 0; box-shadow: 0 2px 5px rgba(0,0,0,0.2); z-index: 1; }
  .promo-special-badge.flash { background: linear-gradient(135deg, #ff6b6b, #feca57); color: #111; }
  .promo-image-wrapper { display: flex; justify-content: center; align-items: center; min-height: 180px; background-color: var(--image-bg); }
  .promo-product-image { width: auto; max-width: 100%; max-height: 180px; object-fit: contain; display: block; }
  .promo-product-info { padding: 20px; flex-grow: 1; display: flex; flex-direction: column; }
  .promo-product-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 5px; }
  .promo-product-name { font-size: 1.2em; font-weight: 600; color: var(--text-primary); line-height: 1.3; flex-grow: 1; }
  .promo-brand-logo { width: 50px; height: 50px; object-fit: contain; flex-shrink: 0; }
  .promo-product-item { font-size: 0.8em; color: var(--text-muted); margin: 0 0 10px 0; }
  .promo-product-description { font-size: 0.9em; color: var(--text-secondary); margin: 0 0 5px 0; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 2.7em; }
  .promo-product-description.expanded { -webkit-line-clamp: unset; min-height: auto; }
  .promo-description-toggle { font-size: 0.85em; font-weight: 600; color: var(--promo-widget-accent-color, #007bff); cursor: pointer; text-decoration: none; margin-bottom: 15px; align-self: flex-start; }
  .promo-product-pricing { margin-bottom: 20px; display: flex; flex-direction: column; gap: 6px; }
  .promo-price-item { display: flex; justify-content: space-between; align-items: baseline; font-size: 0.9em; color: var(--text-secondary); }
  .promo-price-label { font-weight: 500; color: var(--text-label); }
  .promo-price-value { font-weight: 600; color: var(--text-primary); }
  .promo-price-item.dealer-price .promo-price-value { font-weight: 800; color: var(--dealer-price-color); font-size: 1.6em; }
  .promo-price-item.elite-price .promo-price-value { font-weight: 700; color: var(--elite-price-color); font-size: 1.05em; }
  .promo-product-cta-container { margin-top: auto; }
  .promo-product-cta { display: block; width: 100%; padding: 14px; background-color: var(--promo-widget-accent-color); color: #fff; text-align: center; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 1.1em; transition: filter 0.2s, transform 0.2s; box-sizing: border-box; animation: pulse 2s infinite; }
  .promo-product-cta:hover { filter: brightness(90%); transform: scale(1.03); animation: none; }
`;

export function generateWidgetEmbedCode(products: Product[], options: AppearanceOptions): GeneratedCode {
    const { accentColor, columns, theme, cornerRadius, showItemNumber } = options;
    const brands = [...new Map(products.map(p => [p['brand name'], p['brand logo url']])).entries()]
        .filter(([name, url]) => name && url);
    const hasAnyFlash = products.some(p => parseBoolean(p['flash sale']));
    const widgetId = 'promo-widget-' + Date.now() + Math.random().toString(36).substring(2);

    const showFilterBar = (brands.length > 1) || hasAnyFlash;
    const filterHtml = showFilterBar ? `
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
        <img src="${escapeHtml(url)}" alt="${escapeHtml(name)}" class="promo-filter-logo" loading="lazy">
      </div>
      <span class="promo-filter-name">${escapeHtml(name)}</span>
    </div>
  `).join('')}
</div>` : '';

    const interactionScript = `
<script>
  (function() {
    function parseLocalYMD(ymd) {
      if (!ymd) return null;
      var m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(ymd);
      if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 0, 0, 0);
      var d = new Date(ymd); return isNaN(d) ? null : d;
    }
    function isCurrentlyActiveFlash(card, now) {
      if (card.dataset.flash !== 'true') return false;
      var start = parseLocalYMD(card.dataset.flashStart);
      var end = parseLocalYMD(card.dataset.flashEnd);
      if (end) {
        end.setHours(23, 59, 59, 999);
      }
      var t = now || new Date();
      if (!start && !end) return true;
      if (start && end) return t >= start && t <= end;
      if (start) return t >= start;
      if (end) return t <= end;
      return false;
    }
    function setupPromoWidget(widget) {
      var filterContainer = widget.querySelector('.promo-logo-filter-container');
      var productCards = widget.querySelectorAll('.promo-product-card');
      function applyFilter(type, value) {
        var now = new Date();
        productCards.forEach(function(card) {
          var isFlash = card.dataset.flash === 'true';
          var brand = card.dataset.brand || '';
          var isActive = isCurrentlyActiveFlash(card, now);
          var show = false;
          if (type === 'all') { show = true; }
          else if (type === 'flash') { show = isFlash && isActive; }
          else if (type === 'brand') { show = brand === (value || ''); }
          else { show = true; }
          card.style.display = show ? 'flex' : 'none';
        });
      }
      if (filterContainer) {
        filterContainer.addEventListener('click', function(e) {
          var filterItem = e.target.closest('.promo-filter-item');
          if (!filterItem) return;
          filterContainer.querySelectorAll('.promo-filter-item').forEach(function(el){ el.classList.remove('active'); el.setAttribute('aria-selected','false'); });
          filterItem.classList.add('active');
          filterItem.setAttribute('aria-selected','true');
          applyFilter(filterItem.dataset.filter || 'all', filterItem.dataset.value || null);
        });
        var initial = filterContainer.querySelector('[data-filter="all"]');
        if (initial) applyFilter(initial.dataset.filter || 'all', initial.dataset.value || null);
      }
      var container = widget.querySelector('.promo-widget-container');
      if(container) {
        container.addEventListener('click', function(e) {
          var toggle = e.target.closest('.promo-description-toggle');
          if (toggle) {
            e.preventDefault();
            var targetId = toggle.getAttribute('data-target');
            var description = document.getElementById(targetId);
            if (description) {
              description.classList.toggle('expanded');
              toggle.textContent = description.classList.contains('expanded') ? 'See Less' : 'See More';
            }
          }
        });
      }
    }
    
    function findAndInit() {
      var widget = document.getElementById('${widgetId}');
      if (widget) {
        setupPromoWidget(widget);
      } else {
        window.requestAnimationFrame(findAndInit);
      }
    }
    window.requestAnimationFrame(findAndInit);
  })();
<\/script>`;

    const cssStyle = `<style>:root { --promo-widget-accent-color: ${escapeHtml(accentColor)}; } ${WIDGET_CSS}</style>`;

    let productCardsHtml = "";
    let idx = 0;
    products.forEach(row => {
      const name = escapeHtml(row['product name']);
      const itemNum = escapeHtml(row['item number']);
      const descriptionText = String(row['product description'] || '');
      const descriptionHtml = escapeHtml(descriptionText);
      const brandName = escapeHtml(row['brand name']);
      const brandLogoUrl = escapeHtml(row['brand logo url']);
      const specialPromoText = escapeHtml(row['special promo text']);
      const imgUrl = escapeHtml(row['image url']);
      const productUrl = escapeHtml(row['product url']);
      const getPrice = (value: any) => { const s = String(value || '').trim(); if (!s) return null; const num = parseFloat(s.replace(/[^0-9.]/g, '')); return isNaN(num) ? null : num; };
      const msrp = getPrice(row['msrp']);
      const map = getPrice(row['map']);
      const dealerPrice = getPrice(row['dealer price']);
      const elitePrice = getPrice(row['elite dealer price']);
      const isFlash = parseBoolean(row['flash sale']);
      const flashStart = toYMD(row['flash start date']);
      const flashEnd = toYMD(row['flash end date']);
      const flashBadgeText = escapeHtml(row['flash badge text']) || 'FLASH SALE';
      const badgeText = specialPromoText || (isFlash ? flashBadgeText : '');
      const badgeHtml = badgeText ? `<div class="promo-special-badge ${isFlash ? 'flash' : ''}">${badgeText}</div>` : '';
      const descriptionId = `promo-desc-${widgetId}-${idx}`;
      const seeMoreLink = descriptionText.length > 120 ? `<a href="#" class="promo-description-toggle" data-target="${descriptionId}">See More</a>` : '';
      const msrpHtml = msrp !== null ? `<div class="promo-price-item"><span class="promo-price-label">MSRP:</span><span class="promo-price-value">$${msrp.toFixed(2)}</span></div>` : '';
      const mapHtml = map !== null ? `<div class="promo-price-item"><span class="promo-price-label">MAP:</span><span class="promo-price-value">$${map.toFixed(2)}</span></div>` : '';
      const dealerHtml = dealerPrice !== null ? `<div class="promo-price-item dealer-price"><span class="promo-price-label">Your Price:</span><span class="promo-price-value">$${dealerPrice.toFixed(2)}</span></div>` : '';
      const eliteHtml = elitePrice !== null ? `<div class="promo-price-item elite-price"><span class="promo-price-label">Elite Price:</span><span class="promo-price-value">$${elitePrice.toFixed(2)}</span></div>` : '';

      productCardsHtml += `
<div class="promo-product-card" data-brand="${brandName}" data-flash="${isFlash ? 'true' : 'false'}" ${isFlash && flashStart ? `data-flash-start="${flashStart}"` : ''} ${isFlash && flashEnd ? `data-flash-end="${flashEnd}"` : ''}>
  ${badgeHtml}
  <div class="promo-image-wrapper"><img src="${imgUrl}" alt="${name}" class="promo-product-image" loading="lazy"></div>
  <div class="promo-product-info">
    <div class="promo-product-header">
      <h3 class="promo-product-name">${name}</h3>
      ${brandLogoUrl ? `<img src="${brandLogoUrl}" alt="${brandName} Logo" class="promo-brand-logo" loading="lazy">` : ''}
    </div>
    ${showItemNumber ? `<p class="promo-product-item">Item #: ${itemNum}</p>` : ''}
    <p class="promo-product-description" id="${descriptionId}">${descriptionHtml}</p>
    ${seeMoreLink}
    <div class="promo-product-pricing">${msrpHtml}${mapHtml}${dealerHtml}${eliteHtml}</div>
    <div class="promo-product-cta-container"><a href="${productUrl}" target="_blank" rel="noopener noreferrer" class="promo-product-cta">View Deal</a></div>
  </div>
</div>`;
      idx++;
    });

    const embeddableHtml = `<!-- Start of Promotion Widget -->\n${cssStyle}\n<div id="${widgetId}" data-theme="${theme}" data-corners="${cornerRadius}" data-columns="${columns}">${filterHtml}<div class="promo-widget-container">${productCardsHtml}</div></div>\n${interactionScript}\n<!-- End of Promotion Widget -->`;
    
    return { embed: embeddableHtml };
}

/**
 * Generates a date string in YYYY-MM-DD format.
 * @param offsetDays The number of days to offset from today.
 */
function getFormattedDate(offsetDays: number): string {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export const templateData: Product[] = [
    { 'Product name': "Performance Widget", 'Item number': "W-001", 'Product description': "Experience unparalleled performance and reliability with our next-generation widget, designed for professionals.", 'Brand Name': "Acme Corp", 'Brand Logo URL': "https://placehold.co/120x60/cccccc/000000?text=ACME", 'Special Promo Text': '20% OFF!', 'MSRP': 199.99, 'MAP': 179.99, 'Dealer Price': 149.99, 'Elite Dealer Price': 139.99, 'Image URL': "https://placehold.co/400x300/007bff/white?text=Product+1", 'Product URL': "https://example.com/product1", 'Flash Sale': '', 'Flash Start Date': '', 'Flash End Date': '', 'Flash Badge Text': '' },
    { 'Product name': "Synergy Gadget", 'Item number': "G-002", 'Product description': "Seamlessly integrates with your workflow, boosting productivity and collaboration.", 'Brand Name': "Globex Inc", 'Brand Logo URL': "https://placehold.co/120x60/28a745/ffffff?text=GLOBEX", 'Special Promo Text': '', 'MSRP': 249.99, 'MAP': 229.99, 'Dealer Price': 199.99, 'Elite Dealer Price': '', 'Image URL': "https://placehold.co/400x300/28a745/white?text=Product+2", 'Product URL': "https://example.com/product2", 'Flash Sale': 'Yes', 'Flash Start Date': getFormattedDate(-1), 'Flash End Date': getFormattedDate(6), 'Flash Badge Text': '⚡ Weekly Flash' },
];

function generateCsv(rows: Product[]): string {
    const cols = Object.keys(rows[0]);
    const esc = (v: any) => { if (v === null || v === undefined) return ''; const s = String(v).replace(/"/g, '""'); return /[",\n]/.test(s) ? `"${s}"` : s; };
    const lines = [cols.join(','), ...rows.map(r => cols.map(c => esc(r[c as keyof Product] ?? '')).join(','))];
    return lines.join('\r\n');
}

export async function downloadTemplate(type: 'xlsx' | 'csv') {
    if (type === 'csv') {
        const csv = generateCsv(templateData);
        const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8' });
        downloadBlob(blob, 'product_template.csv');
        return;
    }
    if (XLSX) {
        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Products");
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        downloadBlob(blob, 'product_template.xlsx');
    } else {
        console.error("XLSX library not found for template download.");
    }
}

function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 100);
}