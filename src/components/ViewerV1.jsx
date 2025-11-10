import { useCallback, useEffect, useRef, useState } from 'react';
import { Document, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import Toolbar from './Toolbar.jsx';
import Thumbnails from './Thumbnails.jsx';
import Pages from './Pages.jsx';
import { SearchProvider } from '../context/SearchContext.jsx';

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

const SAMPLE_PDF_URL =
  'https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf';
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.5;
const ZOOM_STEP = 0.25;
const ROTATION_STEP = 90;

export default function ViewerV1() {
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pdfDocument, setPdfDocument] = useState(null);
  const pageRefs = useRef([]);
  const isPrintingRef = useRef(false);
  const isDownloadingRef = useRef(false);
  const autoScrollTargetRef = useRef(null);
  const autoScrollTimeoutRef = useRef(null);

  const scrollToPage = useCallback((pageNumber) => {
    const target = pageRefs.current[pageNumber - 1];
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
    }
  }, []);

  const goToPage = useCallback(
    (pageNumber, { scroll = true } = {}) => {
      if (!numPages) {
        return;
      }

      const clamped = Math.min(Math.max(pageNumber, 1), numPages);
      setCurrentPage(clamped);
      setPageInput(String(clamped));

      if (scroll) {
        autoScrollTargetRef.current = clamped;
        if (autoScrollTimeoutRef.current) {
          clearTimeout(autoScrollTimeoutRef.current);
        }
        autoScrollTimeoutRef.current = setTimeout(() => {
          autoScrollTargetRef.current = null;
        }, 600);
        requestAnimationFrame(() => scrollToPage(clamped));
      }
    },
    [numPages, scrollToPage],
  );

  const handleDocumentLoad = (documentProxy) => {
    const nextNumPages = documentProxy.numPages;
    setPdfDocument(documentProxy);
    pageRefs.current = new Array(nextNumPages).fill(null);
    setNumPages(nextNumPages);
    setCurrentPage(1);
    setPageInput('1');
    autoScrollTargetRef.current = 1;
    if (autoScrollTimeoutRef.current) {
      clearTimeout(autoScrollTimeoutRef.current);
    }
    autoScrollTimeoutRef.current = setTimeout(() => {
      autoScrollTargetRef.current = null;
    }, 600);
    requestAnimationFrame(() => scrollToPage(1));
  };

  const handleFirstClick = () => goToPage(1);
  const handlePreviousClick = () => goToPage(currentPage - 1);
  const handleNextClick = () => goToPage(currentPage + 1);
  const handleLastClick = () => {
    if (numPages) {
      goToPage(numPages);
    }
  };

  const resolvePageInput = () => {
    const parsed = parseInt(pageInput, 10);
    if (!Number.isNaN(parsed)) {
      goToPage(parsed);
    } else {
      setPageInput(String(currentPage));
    }
  };

  const handlePageInputChange = (event) => {
    setPageInput(event.target.value);
  };

  const handlePageInputBlur = () => {
    resolvePageInput();
  };

  const handlePageInputKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      resolvePageInput();
    }
  };

  const clampZoom = (value) => Math.min(Math.max(value, MIN_ZOOM), MAX_ZOOM);

  const updateZoom = (nextZoom) => {
    const clamped = clampZoom(nextZoom);
    setZoom(clamped);
  };

  const handleZoomOut = () => updateZoom(zoom - ZOOM_STEP);
  const handleZoomIn = () => updateZoom(zoom + ZOOM_STEP);
  const handleZoomReset = () => updateZoom(1);

  const normalizeRotation = (value) => ((value % 360) + 360) % 360;

  const adjustRotation = (delta) => {
    setRotation((prev) => normalizeRotation(prev + delta));
  };

  const handleRotateCounterClockwise = () => adjustRotation(-ROTATION_STEP);
  const handleRotateClockwise = () => adjustRotation(ROTATION_STEP);
  const handleRotateReset = () => setRotation(0);

  const handlePrintDocument = async () => {
    if (!numPages || isPrintingRef.current) {
      return;
    }

    const buildPrintableBlob = async () => {
      if (pdfDocument) {
        try {
          const data = await pdfDocument.getData();
          return new Blob([data], { type: 'application/pdf' });
        } catch (error) {
          console.warn('Falling back to network PDF fetch before printing.', error);
        }
      }

      const response = await fetch(SAMPLE_PDF_URL, { mode: 'cors' });
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF for printing: ${response.status}`);
      }
      return response.blob();
    };

    isPrintingRef.current = true;

    let objectUrl;
    let iframe;
    let cleanupCalled = false;

    const cleanup = () => {
      if (cleanupCalled) {
        return;
      }
      cleanupCalled = true;
      if (iframe) {
        iframe.remove();
        iframe = null;
      }
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        objectUrl = null;
      }
      isPrintingRef.current = false;
    };

    try {
      const blob = await buildPrintableBlob();
      objectUrl = URL.createObjectURL(blob);

      iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '1px';
      iframe.style.height = '1px';
      iframe.style.border = '0';
      iframe.style.opacity = '0';
      iframe.setAttribute('aria-hidden', 'true');

      iframe.onload = () => {
        const iframeWindow = iframe?.contentWindow;
        if (!iframeWindow) {
          cleanup();
          return;
        }

        let waitingForUser = false;
        let watchdogTimer;

        const finalize = () => {
          if (watchdogTimer) {
            clearTimeout(watchdogTimer);
            watchdogTimer = null;
          }
          iframeWindow.removeEventListener('afterprint', finalize);
          window.removeEventListener('focus', handleWindowFocus);
          cleanup();
        };

        const handleWindowFocus = () => {
          if (!waitingForUser) {
            return;
          }
          window.removeEventListener('focus', handleWindowFocus);
          finalize();
        };

        iframeWindow.addEventListener('afterprint', finalize, { once: true });
        window.addEventListener('focus', handleWindowFocus);

        requestAnimationFrame(() => {
          waitingForUser = true;
          try {
            iframeWindow.focus();
            iframeWindow.print();
            watchdogTimer = window.setTimeout(() => {
              window.removeEventListener('focus', handleWindowFocus);
              finalize();
            }, 60000);
          } catch (error) {
            console.error('Unable to open print dialog.', error);
            waitingForUser = false;
            window.removeEventListener('focus', handleWindowFocus);
            finalize();
          }
        });
      };

      iframe.onerror = () => {
        console.error('Unable to load PDF in print frame.');
        cleanup();
      };

      iframe.src = objectUrl;
      document.body.appendChild(iframe);
    } catch (error) {
      console.error('Unable to print PDF:', error);
      cleanup();
    }
  };

  const handleDownloadDocument = async () => {
    if (!numPages || isDownloadingRef.current) {
      return;
    }

    isDownloadingRef.current = true;

    let objectUrl;
    let linkElement;

    try {
      const response = await fetch(SAMPLE_PDF_URL, { mode: 'cors' });
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF for download: ${response.status}`);
      }

      const blob = await response.blob();
      objectUrl = URL.createObjectURL(blob);

      let suggestedName = 'document.pdf';
      try {
        const parsedUrl = new URL(SAMPLE_PDF_URL);
        const pathname = parsedUrl.pathname.split('/').filter(Boolean).pop();
        if (pathname) {
          suggestedName = pathname;
        }
      } catch {
        // use default name
      }

      linkElement = document.createElement('a');
      linkElement.href = objectUrl;
      linkElement.download = suggestedName;
      linkElement.style.display = 'none';
      document.body.appendChild(linkElement);
      linkElement.click();
    } catch (error) {
      console.error('Unable to download PDF:', error);
    } finally {
      if (linkElement) {
        document.body.removeChild(linkElement);
      }
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      isDownloadingRef.current = false;
    }
  };

  useEffect(() => {
    if (!numPages) {
      return;
    }
    requestAnimationFrame(() => scrollToPage(currentPage));
  }, [zoom, rotation]);

  useEffect(() => {
    return () => {
      if (autoScrollTimeoutRef.current) {
        clearTimeout(autoScrollTimeoutRef.current);
        autoScrollTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!numPages) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        let bestIndex = -1;
        let bestRatio = 0;

        entries.forEach((entry) => {
          const pageNumber = Number(entry.target.dataset.page);
          if (!pageNumber) {
            return;
          }
          const ratio = entry.intersectionRatio;
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestIndex = pageNumber;
          }
        });

        if (bestIndex === -1) {
          return;
        }

        const target = autoScrollTargetRef.current;
        const reachedTarget = target && bestIndex === target && bestRatio >= 0.55;

        if (reachedTarget) {
          autoScrollTargetRef.current = null;
          if (autoScrollTimeoutRef.current) {
            clearTimeout(autoScrollTimeoutRef.current);
            autoScrollTimeoutRef.current = null;
          }
          if (currentPage !== target) {
            setCurrentPage(target);
            setPageInput(String(target));
          }
          return;
        }

        const isManualScroll = !target && bestIndex !== currentPage && bestRatio >= 0.6;

        if (isManualScroll) {
          setCurrentPage(bestIndex);
          setPageInput(String(bestIndex));
        }
      },
      {
        root: null,
        threshold: [0, 0.2, 0.4, 0.6, 0.8, 1],
        rootMargin: '-15% 0px -15% 0px',
      },
    );

    pageRefs.current.forEach((element) => {
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [numPages, currentPage]);

  return (
    <SearchProvider pdfDocument={pdfDocument} numPages={numPages} goToPage={goToPage}>
      <main className="pdf-viewer">
        <Toolbar
          numPages={numPages}
          currentPage={currentPage}
          pageInput={pageInput}
          onGoFirst={handleFirstClick}
          onGoPrevious={handlePreviousClick}
          onGoNext={handleNextClick}
          onGoLast={handleLastClick}
          onPageInputChange={handlePageInputChange}
          onPageInputBlur={handlePageInputBlur}
          onPageInputKeyDown={handlePageInputKeyDown}
          zoom={zoom}
          minZoom={MIN_ZOOM}
          maxZoom={MAX_ZOOM}
          onZoomOut={handleZoomOut}
          onZoomIn={handleZoomIn}
          onZoomReset={handleZoomReset}
          rotation={rotation}
          onRotateCounterClockwise={handleRotateCounterClockwise}
          onRotateClockwise={handleRotateClockwise}
          onRotateReset={handleRotateReset}
          onDownload={handleDownloadDocument}
          onPrint={handlePrintDocument}
        />
        <Document file={SAMPLE_PDF_URL} onLoadSuccess={handleDocumentLoad}>
          <div className="pdf-layout">
            <Thumbnails
              numPages={numPages}
              currentPage={currentPage}
              rotation={rotation}
              onSelectPage={(pageNumber) => goToPage(pageNumber)}
            />

            <Pages numPages={numPages} zoom={zoom} rotation={rotation} pageRefs={pageRefs} />
          </div>
        </Document>
      </main>
    </SearchProvider>
  );
}
