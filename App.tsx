import React, { useState, useCallback, useRef } from 'react';
import { Step } from './components/Step';
import { Note } from './components/Note';
import { Product } from './types';
import { processSpreadsheet } from './services/spreadsheetService';
import { downloadTemplate } from './services/templateService';
import { generateWidgetHtml } from './services/widgetGenerator';

type Feedback = {
  message: string;
  type: 'success' | 'error';
};

const App: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [embeddableHtml, setEmbeddableHtml] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const htmlCodeTextareaRef = useRef<HTMLTextAreaElement>(null);

  const resetUI = useCallback(() => {
    setProducts([]);
    setPreviewHtml('');
    setEmbeddableHtml('');
    setFeedback(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    resetUI();
    setIsLoading(true);
    setFeedback(null);

    try {
      const productData = await processSpreadsheet(file);
      setProducts(productData);
      const { previewHtml, embeddableHtml } = generateWidgetHtml(productData);
      setPreviewHtml(previewHtml);
      setEmbeddableHtml(embeddableHtml);
      setFeedback({ message: 'Successfully generated widget!', type: 'success' });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      console.error("File processing error:", error);
      setFeedback({ message: errorMessage, type: 'error' });
      resetUI();
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = (type: 'xlsx' | 'csv') => {
     downloadTemplate(type).catch(err => {
        setFeedback({ message: `Failed to download ${type.toUpperCase()} template.`, type: 'error' });
     });
  };

  const copyCodeToClipboard = () => {
    if (!htmlCodeTextareaRef.current) return;
    htmlCodeTextareaRef.current.select();
    navigator.clipboard.writeText(htmlCodeTextareaRef.current.value).then(() => {
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      setFeedback({ message: 'Failed to copy code to clipboard.', type: 'error' });
    });
  };

  return (
    <div className="min-h-screen flex items-start justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl w-full mx-auto bg-white p-6 sm:p-10 rounded-2xl shadow-lg border border-gray-200/80">
        <header className="text-center border-b border-gray-200 pb-6 mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 tracking-tight flex items-center justify-center gap-3">
            <span role="img" aria-label="shopping bags">🛍️</span>
            Promotion Widget Generator
          </h1>
          <p className="text-base sm:text-lg text-gray-500 mt-2">
            Upload monthly promos (and optional weekly ⚡ Flash Sales) to get a beautiful, embeddable widget.
          </p>
        </header>

        <main className="space-y-8">
          <Step title="Step 1: Get the Template">
            <p className="text-gray-600 mb-4">Download a template to ensure your data is formatted correctly. Fill it out with your product information.</p>
            <div className="flex flex-wrap gap-4">
               <button onClick={() => handleDownload('xlsx')} className="inline-block bg-blue-600 text-white font-semibold py-2 px-5 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all transform hover:-translate-y-0.5">Download .xlsx Template</button>
               <button onClick={() => handleDownload('csv')} className="inline-block bg-gray-600 text-white font-semibold py-2 px-5 rounded-lg shadow-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all transform hover:-translate-y-0.5">Download .csv Template</button>
            </div>
             <Note>
                <strong>About Flash Sales:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>New optional columns: <code>Flash Sale</code>, <code>Flash Start Date</code>, <code>Flash End Date</code>, <code>Flash Badge Text</code>.</li>
                    <li>Set <code>Flash Sale</code> to <em>Yes/True/1/Y</em> to mark an item as a weekly flash sale.</li>
                    <li>The widget auto-updates each week based on the visitor's local time.</li>
                </ul>
            </Note>
          </Step>

          <Step title="Step 2: Upload Your File">
            <p className="text-gray-600 mb-4">Upload the completed <code>.xlsx</code> or <code>.csv</code> file.</p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border-2 border-dashed border-gray-300 rounded-lg p-4 transition-colors hover:border-blue-500"
              accept=".csv, .xls, .xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            />
            {isLoading && (
              <div className="flex justify-center mt-4">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
              </div>
            )}
            {feedback && (
              <div className={`mt-4 p-4 rounded-md font-medium text-sm ${feedback.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
                {feedback.message}
              </div>
            )}
            <Note>
                <strong>Tips:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Flash dates are inclusive. If you only set a start date, it shows from that day onward.</li>
                    <li>To highlight copy for flash deals, set <code>Flash Badge Text</code> (e.g., “Ends Sunday”).</li>
                </ul>
            </Note>
          </Step>
          
          {previewHtml && (
            <Step title="Step 3: Preview Your Widget">
              <p className="text-gray-600 mb-4">The preview mirrors the embed. Try the filters: <strong>All</strong>, <strong>⚡ Flash Sales</strong>, and the brand logos.</p>
              <div className="border border-gray-300 p-5 rounded-lg bg-gray-50 mt-5" dangerouslySetInnerHTML={{ __html: previewHtml }} />
            </Step>
          )}

          {embeddableHtml && (
            <Step title="Step 4: Get the Embed Code">
                <p className="text-gray-600 mb-4">Copy the code below and paste it into your website’s HTML where you want the widget to appear.</p>
                 <Note>
                    <strong>Theme & Behavior:</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>The widget inherits your site’s font. Set the accent color by defining <code>--promo-widget-accent-color</code> in your CSS.</li>
                        <li>Flash items automatically show/hide by date on each visitor’s device.</li>
                    </ul>
                </Note>
                <textarea
                    ref={htmlCodeTextareaRef}
                    value={embeddableHtml}
                    readOnly
                    className="w-full min-h-[250px] font-mono bg-gray-800 text-gray-200 border border-gray-600 rounded-md p-4 box-border resize-vertical mt-4 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    aria-label="Embeddable HTML code"
                />
                <div className="mt-4 flex items-center gap-4">
                    <button onClick={copyCodeToClipboard} className="inline-block bg-blue-600 text-white font-semibold py-2 px-5 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all transform hover:-translate-y-0.5">
                        📋 Copy Code
                    </button>
                    {copyFeedback && <span className="text-green-600 font-bold transition-opacity">Copied!</span>}
                </div>
            </Step>
          )}

        </main>
        
        <footer className="text-center mt-12 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">Built with ❤️ and React</p>
        </footer>
      </div>
    </div>
  );
};

export default App;