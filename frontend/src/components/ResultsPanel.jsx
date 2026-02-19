import { Download, Archive, TrendingDown, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';

/**
 * Display processing results with before/after comparison and download options
 */
export const ResultsPanel = ({ results, errors, onDownloadAll }) => {
  if (!results.length && !errors.length) return null;

  const formatSize = (bytes) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleSingleDownload = (result) => {
    if (result.blob) {
      const url = URL.createObjectURL(result.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.processedName;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const a = document.createElement('a');
      a.href = result.downloadUrl;
      a.download = result.processedName;
      a.click();
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <h2 className="font-semibold text-gray-100">
            Results <span className="text-gray-500 font-normal text-sm">({results.length} processed)</span>
          </h2>
        </div>
        {results.length > 1 && (
          <button
            onClick={onDownloadAll}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700
              border border-gray-700 rounded-xl text-sm font-medium text-gray-300
              hover:text-white transition-all"
          >
            <Archive className="w-4 h-4" />
            Download All (.zip)
          </button>
        )}
      </div>

      {/* Results Cards */}
      {results.map((result, i) => {
        const saved = result.originalSize - result.processedSize;
        const didShrink = saved > 0;
        const ratio = parseFloat(result.compressionRatio);

        return (
          <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            {/* Before/After Image Preview */}
            <div className="grid grid-cols-2 gap-px bg-gray-800">
              {/* Before */}
              <div className="bg-gray-900 p-3">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Before</p>
                <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
                  {/* We show the processed image as 'before' comparison isn't practical without storing originals */}
                  <img
                    src={result.downloadUrl}
                    alt="before"
                    className="max-w-full max-h-full object-contain opacity-60 grayscale"
                  />
                </div>
                <div className="mt-2 space-y-0.5">
                  <p className="text-xs text-gray-400">{result.originalName}</p>
                  <p className="text-xs text-gray-500">
                    {result.originalDimensions?.width}×{result.originalDimensions?.height} •
                    {' '}{result.originalFormat?.toUpperCase()} •
                    {' '}<span className="font-medium text-gray-300">{formatSize(result.originalSize)}</span>
                  </p>
                </div>
              </div>

              {/* After */}
              <div className="bg-gray-900 p-3">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">After</p>
                <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
                  <img
                    src={result.downloadUrl}
                    alt="after"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <div className="mt-2 space-y-0.5">
                  <p className="text-xs text-gray-400">{result.processedName}</p>
                  <p className="text-xs text-gray-500">
                    {result.processedDimensions?.width}×{result.processedDimensions?.height} •
                    {' '}{result.processedFormat?.toUpperCase()} •
                    {' '}<span className="font-medium text-gray-300">{formatSize(result.processedSize)}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Stats + Download */}
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {didShrink ? (
                  <TrendingDown className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingUp className="w-4 h-4 text-yellow-500" />
                )}
                <span className={`text-sm font-semibold ${didShrink ? 'text-green-400' : 'text-yellow-400'}`}>
                  {didShrink ? `${Math.abs(ratio)}% smaller` : `${Math.abs(ratio)}% larger`}
                </span>
                <span className="text-xs text-gray-600">
                  ({didShrink ? '-' : '+'}{formatSize(Math.abs(saved))})
                </span>
              </div>

              <button
                onClick={() => handleSingleDownload(result)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-500 hover:bg-brand-600
                  rounded-lg text-xs font-semibold text-white transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </button>
            </div>
          </div>
        );
      })}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="space-y-2">
          {errors.map((err, i) => (
            <div key={i} className="flex items-start gap-3 bg-red-950/40 border border-red-900/50 rounded-xl p-4">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-300">{err.file}</p>
                <p className="text-xs text-red-400/80 mt-0.5">{err.error}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};