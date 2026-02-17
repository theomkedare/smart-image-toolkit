import { Settings, ArrowRight } from 'lucide-react';

const FORMAT_OPTIONS = [
  { value: 'jpeg', label: 'JPG' },
  { value: 'png', label: 'PNG' },
  { value: 'webp', label: 'WebP' },
  { value: 'avif', label: 'AVIF' },
];

/**
 * Settings panel: resize, quality, format controls
 */
export const ProcessingPanel = ({ settings, onChange, onProcess, isProcessing, hasFiles, uploadProgress }) => {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Settings className="w-5 h-5 text-brand-500" />
        <h2 className="font-semibold text-gray-100">Processing Settings</h2>
      </div>

      {/* Format */}
      <div>
        <label className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3 block">
          Output Format
        </label>
        <div className="grid grid-cols-4 gap-2">
          {FORMAT_OPTIONS.map((f) => (
            <button
              key={f.value}
              onClick={() => onChange('format', f.value)}
              className={`py-2 rounded-xl text-sm font-medium transition-all border
                ${settings.format === f.value
                  ? 'bg-brand-500 border-brand-500 text-white shadow-lg shadow-brand-500/20'
                  : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quality Slider */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Quality
          </label>
          <span className="text-sm font-bold text-brand-500">{settings.quality}%</span>
        </div>
        <input
          type="range"
          min={1}
          max={100}
          value={settings.quality}
          onChange={(e) => onChange('quality', Number(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-500"
        />
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <span>Smaller</span>
          <span>Larger</span>
        </div>
      </div>

      {/* Resize */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Resize (px)
          </label>
          {/* Aspect Ratio Toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs text-gray-500">Aspect ratio</span>
            <div
              onClick={() => onChange('maintainAspectRatio', !settings.maintainAspectRatio)}
              className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer
                ${settings.maintainAspectRatio ? 'bg-brand-500' : 'bg-gray-700'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform
                ${settings.maintainAspectRatio ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </div>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {['width', 'height'].map((dim) => (
            <div key={dim}>
              <label className="text-xs text-gray-600 mb-1 block capitalize">{dim}</label>
              <input
                type="number"
                placeholder={`Auto`}
                value={settings[dim]}
                min={1}
                max={10000}
                onChange={(e) => onChange(dim, e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5
                  text-sm text-gray-200 placeholder-gray-600
                  focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
              />
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-600 mt-2">Leave empty to keep original dimensions</p>
      </div>

      {/* Process Button */}
      <button
        onClick={onProcess}
        disabled={!hasFiles || isProcessing}
        className={`w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2
          transition-all duration-200
          ${hasFiles && !isProcessing
            ? 'bg-brand-500 hover:bg-brand-600 text-white shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40'
            : 'bg-gray-800 text-gray-600 cursor-not-allowed'
          }`}
      >
        {isProcessing ? (
          <>
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {uploadProgress > 0 && uploadProgress < 100
              ? `Uploading ${uploadProgress}%`
              : 'Processing…'}
          </>
        ) : (
          <>
            Process Image{hasFiles ? 's' : ''}
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </div>
  );
};