const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add import for Menu
content = content.replace('import { \n  Building2', 'import { Menu,\n  Building2');

// 2. Add isMobileMenuOpen state
content = content.replace("const [activeTab, setActiveTab] = useState<string>('dashboard');", "const [activeTab, setActiveTab] = useState<string>('dashboard');\n  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);");

// 3. Update aside className
content = content.replace(/<aside className="[^"]+" id="app-sidebar">/, '<aside className={`fixed inset-y-0 left-0 z-[100] w-64 bg-[#0f172a] text-slate-300 border-r border-slate-800 shrink-0 flex flex-col justify-between transform transition-transform duration-300 md:relative md:translate-x-0 ${isMobileMenuOpen ? \'translate-x-0\' : \'-translate-x-full\'}`} id="app-sidebar">');

// 4. Add overlay
content = content.replace('      {/* Sidebar navigation */}', '      {/* Mobile overlay */}\n      {isMobileMenuOpen && (\n        <div \n          className="fixed inset-0 bg-black/50 z-[90] md:hidden backdrop-blur-sm"\n          onClick={() => setIsMobileMenuOpen(false)}\n        />\n      )}\n\n      {/* Sidebar navigation */}');

// 5. Update header bar
content = content.replace(/<header className="([^"]+)" id="app-header-bar">\s*<div className="flex items-center gap-3">/, `<header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between z-10 sticky top-0" id="app-header-bar">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 -ml-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <Menu className="w-5 h-5" />
            </button>`);

// 6. Update all setActiveTab calls to close the menu
content = content.replace(/onClick=\{\(\) => setActiveTab\('([^']+)'\)\}/g, "onClick={() => { setActiveTab('$1'); setIsMobileMenuOpen(false); }}");

fs.writeFileSync('src/App.tsx', content);
console.log('App.tsx mobile layout patched!');
