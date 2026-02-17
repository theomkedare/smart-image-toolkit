/**
 * Footer component
 * Displays creator credit with Instagram link
 */

export const Footer = () => {
  return (
    <footer className="border-t border-gray-800 bg-gray-950 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-center gap-2 text-sm text-gray-500">
        <span>© {new Date().getFullYear()} All rights reserved —</span>
        <a href="https://instagram.com/omkedare.dev" target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-500 hover:text-brand-400 transition-colors duration-200 hover:underline underline-offset-2">  Om Kedare</a>
      </div>
    </footer>
  );
};