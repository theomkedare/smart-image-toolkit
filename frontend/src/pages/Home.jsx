import { DropZone } from '../components/DropZone';
import { ProcessingPanel } from '../components/ProcessingPanel';
import { ResultsPanel } from '../components/ResultsPanel';
import { useImageProcessor } from '../hooks/useImageProcessor';
import { Trash2 } from 'lucide-react';

export const Home = () => {
  const {
    files,
    settings,
    results,
    errors,
    isProcessing,
    uploadProgress,
    hasProcessed,
    addFiles,
    removeFile,
    clearAll,
    updateSetting,
    process,
    downloadAllZip,
  } = useImageProcessor();

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3">
          Resize, compress &amp;{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-sky-400">
            convert images
          </span>
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto">
          Lightning-fast image processing. No watermarks. No signup required.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Upload + Results (spans 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-100">Upload Images</h2>
              {files.length > 0 && (
                <button
                  onClick={clearAll}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear all
                </button>
              )}
            </div>
            <DropZone files={files} onAdd={addFiles} onRemove={removeFile} />
          </div>

          {(results.length > 0 || errors.length > 0) && (
            <ResultsPanel
              results={results}
              errors={errors}
              onDownloadAll={downloadAllZip}
            />
          )}
        </div>

        {/* Right: Settings Panel */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <ProcessingPanel
              settings={settings}
              onChange={updateSetting}
              onProcess={process}
              isProcessing={isProcessing}
              hasFiles={files.length > 0}
              uploadProgress={uploadProgress}
            />

            {/* Stats / Tips */}
            <div className="mt-4 bg-gray-900/50 border border-gray-800 rounded-2xl p-4 space-y-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Tips</p>
              <ul className="space-y-2">
                {[
                  'WebP is 25–34% smaller than JPEG',
                  'AVIF offers best compression, less browser support',
                  'Quality 70–85 is unnoticeable to most users',
                  'Enable aspect ratio to prevent image distortion',
                ].map((tip) => (
                  <li key={tip} className="text-xs text-gray-500 flex gap-2">
                    <span className="text-brand-500 mt-0.5">›</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};