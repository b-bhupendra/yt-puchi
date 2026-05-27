import React, { useState, useRef } from 'react';
import { Shield, Search, RefreshCw, EyeOff, AlertTriangle, ChevronDown, Check } from 'lucide-react';

// Invidious instances act as an ad-free, tracking-free reverse proxy for YouTube.
// They do not block iframes, do not serve ads, and do not include the visibility change 
// scripts that pause playback when the tab is hidden or screen is off.

export default function App() {
  const [currentProxy, setCurrentProxy] = useState('https://inv.thepixora.com');
  const [proxyList, setProxyList] = useState<{name: string, url: string}[]>([
    { name: 'Inv.ThePixora (CA)', url: 'https://inv.thepixora.com' },
    { name: 'Yewtu.be', url: 'https://yewtu.be' },
    { name: 'Vid.Puffyan', url: 'https://vid.puffyan.us' }
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [iframeKey, setIframeKey] = useState(0);
  const [isTesting, setIsTesting] = useState(false);
  const [showProxyMenu, setShowProxyMenu] = useState(false);
  
  React.useEffect(() => {
    fetch('/api/proxies')
      .then(res => res.json())
      .then(data => setProxyList(data))
      .catch(() => {});
  }, []);

  const [stealthMode, setStealthMode] = useState(true);
  const [blockAds, setBlockAds] = useState(true);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const currentUrl = searchQuery ? `${currentProxy}/search?q=${encodeURIComponent(searchQuery)}` : currentProxy;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIframeKey(k => k + 1); // Force reload iframe
    const input = document.activeElement as HTMLElement;
    input?.blur(); // Dismiss keyboard on mobile
  };

  const handleReload = () => {
    setIframeKey(k => k + 1);
  };

  const handleAutoSelect = async () => {
    if (isTesting) return;
    setIsTesting(true);
    try {
      const res = await fetch('/api/ping');
      const data = await res.json();
      if (data.fastest) {
         setCurrentProxy(data.fastest.url);
      }
    } catch (e) {
      console.error("Auto select failed", e);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] text-slate-200 flex flex-col font-sans selection:bg-indigo-500/30">
      
      {/* Dynamic Main Content Area */}
      <main className="flex-1 relative flex flex-col overflow-hidden">
        {/* Top Browser Bar */}
        <header className="bg-[#111111] border-b border-white/10 z-20 flex flex-col px-4 py-3 gap-3 safe-top">
          <div className="flex items-center gap-3">
            {/* Proxy Dropdown Trigger */}
            <div className="relative">
              <button 
                onClick={() => setShowProxyMenu(!showProxyMenu)}
                className="flex items-center gap-2 bg-[#1c1c1e] hover:bg-[#2c2c2e] px-3 py-1.5 rounded-full border border-white/5 transition-colors"
                title="Change Stealth Proxy Node"
              >
                <Shield className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-medium max-w-[100px] truncate">
                  {proxyList.find(p => p.url === currentProxy)?.name || 'Proxy'}
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showProxyMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Proxy Dropdown Menu */}
              {showProxyMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-30" 
                    onClick={() => setShowProxyMenu(false)}
                  />
                  <div className="absolute top-full left-0 mt-2 w-64 bg-[#111111] border border-white/10 rounded-xl shadow-2xl z-40 overflow-hidden flex flex-col">
                    <div className="p-3 border-b border-white/5 flex items-center justify-between bg-[#1a1a1c]">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Nodes</span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAutoSelect();
                        }}
                        disabled={isTesting}
                        className={`text-[10px] font-medium tracking-wide uppercase px-2 py-1 rounded transition-colors ${
                          isTesting ? 'text-indigo-400/50 bg-indigo-500/10' : 'text-indigo-400 bg-indigo-500/20 hover:bg-indigo-500/30'
                        }`}
                      >
                        {isTesting ? 'Testing...' : 'Auto-Select'}
                      </button>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {proxyList.map((proxy) => (
                        <button
                          key={proxy.url}
                          onClick={() => {
                            setCurrentProxy(proxy.url);
                            setShowProxyMenu(false);
                            setIframeKey(k => k + 1);
                          }}
                          className="w-full flex items-center justify-between p-3 text-left hover:bg-white/5 border-b border-white/5 last:border-0 transition-colors"
                        >
                          <div className="flex flex-col gap-0.5 truncate pr-2">
                            <span className={`text-sm tracking-wide ${currentProxy === proxy.url ? 'text-indigo-300 font-medium' : 'text-slate-200'}`}>
                              {proxy.name}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono truncate">{proxy.url}</span>
                          </div>
                          {currentProxy === proxy.url && <Check className="w-4 h-4 text-indigo-400 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
              
            <form onSubmit={handleSearch} className="flex-1 relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-slate-500" />
              </div>
              <input
                type="text"
                placeholder="Search seamless video..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#1c1c1e] text-sm text-white placeholder-slate-500 rounded-full py-1.5 pl-9 pr-4 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all border border-white/5"
              />
            </form>

            <button 
              onClick={handleReload}
              className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-white/5 transition-colors shrink-0"
              title="Reload Frame"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Browser Iframe container */}
        <div className="flex-1 relative bg-black w-full h-full">
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center pointer-events-none z-0">
            <RefreshCw className="w-8 h-8 text-slate-700 animate-spin mb-4" />
            <p className="text-slate-500 text-sm">Connecting to stealth proxy...</p>
            <div className="mt-6 flex flex-col gap-2 max-w-sm">
              <span className="text-slate-600 text-xs leading-relaxed">If you encounter a "502 Bad Gateway", "Refused to Connect", or endless loading, use the top-left shield icon to switch to a different Proxy Node.</span>
              <span className="text-slate-600 text-[10px] leading-relaxed italic">Note: AI Studio's sandbox has strict iframe constraints, so internal links inside the proxy might block navigation. Standalone PWAs won't have this sandbox issue.</span>
            </div>
          </div>
          
          <iframe
            ref={iframeRef}
            key={iframeKey}
            src={currentUrl}
            className="absolute inset-0 w-full h-full border-none z-10 bg-transparent"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
            title="Seamless Proxy View"
            allow="autoplay; fullscreen; picture-in-picture"
          />
        </div>
      </main>
    </div>
  );
}

