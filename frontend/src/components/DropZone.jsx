import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, ImagePlus, X } from 'lucide-react';

const ACCEPTED = { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif'] };

/**
 * Drag-and-drop upload area with file list
 */
export const DropZone = ({ files, onAdd, onRemove }) => {
  const onDrop = useCallback(
    (accepted) => { if (accepted.length) onAdd(accepted); },
    [onAdd]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    maxFiles: 10,
    multiple: true,
  });

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Drop Area */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer
          transition-all duration-200
          ${isDragActive
            ? 'border-brand-500 bg-brand-500/10 scale-[1.01]'
            : 'border-gray-700 hover:border-gray-500 hover:bg-gray-800/40 bg-gray-900/40'
          }
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors
            ${isDragActive ? 'bg-brand-500/20' : 'bg-gray-800'}`}>
            {isDragActive
              ? <ImagePlus className="w-8 h-8 text-brand-500" />
              : <Upload className="w-8 h-8 text-gray-500" />
            }
          </div>
          <div>
            <p className="font-semibold text-gray-200 text-lg">
              {isDragActive ? 'Drop images here' : 'Drag & drop images'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              or <span className="text-brand-500 font-medium">click to browse</span>
            </p>
            <p className="text-xs text-gray-600 mt-2">
              JPG, PNG, WebP, AVIF, GIF · Max 20MB each · Up to 10 files
            </p>
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
            {files.length} file{files.length !== 1 ? 's' : ''} selected
          </p>
          {files.map((file, i) => (
            <div
              key={`${file.name}-${i}`}
              className="flex items-center justify-between bg-gray-900 rounded-xl px-4 py-3 border border-gray-800"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Tiny preview */}
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-gray-700"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatSize(file.size)}</p>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onRemove(i); }}
                className="ml-3 p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};