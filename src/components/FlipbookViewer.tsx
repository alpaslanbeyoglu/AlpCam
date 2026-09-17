import React, { useState, useCallback, useRef, useEffect } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { Document, Page, pdfjs } from 'react-pdf';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, Minimize2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Configure worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// Component for a single page in the flipbook
const PageContent = React.forwardRef<HTMLDivElement, { pageNumber: number; width: number; height: number }>(
  (props, ref) => {
    return (
      <div className="bg-white shadow-2xl overflow-hidden" ref={ref} data-density="hard">
        <Page
          pageNumber={props.pageNumber}
          width={props.width}
          height={props.height}
          renderAnnotationLayer={false}
          renderTextLayer={false}
          className="pointer-events-none"
        />
      </div>
    );
  }
);

interface FlipbookViewerProps {
  pdfUrl: string;
  title: string;
  onClose: () => void;
}

export const FlipbookViewer: React.FC<FlipbookViewerProps> = ({ pdfUrl, title, onClose }) => {
  // Use proxy to avoid CORS issues
  const proxyUrl = `/api/drive/fetch-file?url=${encodeURIComponent(pdfUrl)}`;
  
  const [numPages, setNumPages] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const bookRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Responsive book sizing
  const [bookSize, setBookSize] = useState({ width: 450, height: 600 });

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;
        
        // Aim for 70% of height, maintain aspect ratio
        let h = Math.min(600, containerHeight * 0.7);
        let w = h * 0.75; // Approx A4 ratio

        if (w * 2 > containerWidth * 0.9) {
          w = (containerWidth * 0.9) / 2;
          h = w / 0.75;
        }

        setBookSize({ width: Math.floor(w), height: Math.floor(h) });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Mouse wheel zoom support
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom(prev => Math.min(3, Math.max(0.5, prev + delta)));
      }
    };
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
      }
    };
  }, []);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
  };

  const nextPage = () => {
    if (bookRef.current) {
      bookRef.current.pageFlip().flipNext();
    }
  };

  const prevPage = () => {
    if (bookRef.current) {
      bookRef.current.pageFlip().flipPrev();
    }
  };

  const onFlip = useCallback((e: any) => {
    setCurrentPage(e.data);
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullScreen(false);
      }
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-8"
        ref={containerRef}
      >
        {/* Header Controls */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-slate-900/50 border-b border-slate-700/50 text-white z-50">
          <div className="flex flex-col">
            <h3 className="font-bold text-sm sm:text-base truncate max-w-[200px] sm:max-w-md">{title}</h3>
            {numPages && (
              <span className="text-[10px] sm:text-xs text-slate-400">
                Sayfa: {currentPage + 1} / {numPages}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700">
              <button
                onClick={() => setZoom(Math.max(0.5, zoom - 0.2))}
                className="p-1.5 hover:bg-slate-700 rounded transition"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="px-2 text-xs font-mono w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom(Math.min(2, zoom + 0.2))}
                className="p-1.5 hover:bg-slate-700 rounded transition"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={toggleFullScreen}
              className="p-2 hover:bg-slate-800 rounded-full transition text-slate-400 hover:text-white"
            >
              {isFullScreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 bg-rose-600/20 hover:bg-rose-600 text-rose-500 hover:text-white rounded-full transition border border-rose-600/30"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center gap-4 text-white">
            <Loader2 className="w-12 h-12 animate-spin text-sky-500" />
            <p className="text-sm font-medium animate-pulse">Fiyat Listesi Yükleniyor...</p>
          </div>
        )}

        {/* Book Container */}
        <div 
          className="relative transition-transform duration-300 ease-out"
          style={{ 
            transform: `scale(${zoom})`,
            marginTop: '40px'
          }}
        >
          <Document
            file={proxyUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={null}
          >
            {numPages && (
              <HTMLFlipBook
                width={bookSize.width}
                height={bookSize.height}
                size="fixed"
                minWidth={315}
                maxWidth={1000}
                minHeight={400}
                maxHeight={1533}
                maxShadowOpacity={0.5}
                showCover={true}
                mobileScrollSupport={true}
                onFlip={onFlip}
                ref={bookRef}
                className="shadow-2xl"
                style={{}}
                startPage={0}
                drawShadow={true}
                flippingTime={1000}
                usePortrait={false}
                startZIndex={0}
                autoSize={true}
                clickEventForward={true}
                useMouseEvents={true}
                swipeDistance={30}
                showPageCorners={true}
                disableFlipByClick={false}
              >
                {Array.from(new Array(numPages), (el, index) => (
                  <PageContent
                    key={`page_${index + 1}`}
                    pageNumber={index + 1}
                    width={bookSize.width}
                    height={bookSize.height}
                  />
                ))}
              </HTMLFlipBook>
            )}
          </Document>

          {/* Navigation Buttons */}
          <div className="absolute top-1/2 -left-12 sm:-left-20 -translate-y-1/2 hidden md:block">
            <button
              onClick={prevPage}
              disabled={currentPage === 0}
              className="p-4 bg-slate-800/80 hover:bg-sky-600 text-white rounded-full transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-slate-700 shadow-xl"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
          </div>
          <div className="absolute top-1/2 -right-12 sm:-right-20 -translate-y-1/2 hidden md:block">
            <button
              onClick={nextPage}
              disabled={numPages ? currentPage >= numPages - 1 : false}
              className="p-4 bg-slate-800/80 hover:bg-sky-600 text-white rounded-full transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-slate-700 shadow-xl"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          </div>
        </div>

        {/* Mobile Page Controls */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-6 md:hidden">
            <button
              onClick={prevPage}
              className="p-3 bg-slate-800 rounded-full text-white"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <span className="text-white text-sm font-bold bg-slate-800/50 px-4 py-1 rounded-full">
              {currentPage + 1} / {numPages}
            </span>
            <button
              onClick={nextPage}
              className="p-3 bg-slate-800 rounded-full text-white"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
        </div>

        {/* Help Tip */}
        {!isLoading && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-slate-400 text-[10px] sm:text-xs text-center">
            Sayfa kenarlarından sürükleyerek veya ok tuşlarıyla çevirebilirsiniz. <br/>
            Zoom için üst paneli kullanın.
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
