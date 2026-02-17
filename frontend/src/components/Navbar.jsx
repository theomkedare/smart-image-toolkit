import { Image, Zap } from 'lucide-react';

export const Navbar = () => (
  <nav className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
          <Image className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-lg tracking-tight">
          Smart<span className="text-brand-500">Image</span>
        </span>
      </div>
      <div className="flex items-center gap-3 text-sm text-gray-400">
        <Zap className="w-4 h-4 text-brand-500" />
        <span>Free • No watermarks • No signup</span>
      </div>
    </div>
  </nav>
);