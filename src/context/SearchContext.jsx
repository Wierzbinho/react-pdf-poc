import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const SearchContext = createContext(null);

const escapeHtml = (value) =>
  value.replace(/[&<>]/g, (char) => {
    if (char === '&') {
      return '&amp;';
    }
    if (char === '<') {
      return '&lt;';
    }
    if (char === '>') {
      return '&gt;';
    }
    return char;
  });

export function SearchProvider({ children, pdfDocument, numPages, goToPage }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [matchesByPage, setMatchesByPage] = useState(() => new Map());
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const documentReady = Boolean(pdfDocument);
  const hasPages = Boolean(numPages);

  const resetSearchState = useCallback(() => {
    setResults([]);
    setMatchesByPage(new Map());
    setActiveMatchIndex(0);
    setErrorMessage(null);
  }, []);

  useEffect(() => {
    if (query.trim() === '') {
      resetSearchState();
    }
  }, [query, resetSearchState]);

  useEffect(() => {
    if (results.length > 0) {
      const index = Math.min(activeMatchIndex, results.length - 1);
      const target = results[index];
      if (target) {
        goToPage(target.pageNumber);
      }
    }
  }, [activeMatchIndex, results, goToPage]);

  useEffect(() => {
    // Reset search state when the underlying document changes.
    resetSearchState();
    setQuery('');
    setIsOpen(false);
  }, [pdfDocument, resetSearchState]);

  const handleSearchSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      const trimmedQuery = query.trim();

      if (!pdfDocument || !numPages || !trimmedQuery) {
        resetSearchState();
        return;
      }

      setIsSearching(true);
      setErrorMessage(null);

      try {
        const escaped = trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const nextMatchesByPage = new Map();
        const nextResults = [];

        for (let pageIndex = 0; pageIndex < numPages; pageIndex += 1) {
          const pageNumber = pageIndex + 1;
          const page = await pdfDocument.getPage(pageNumber);
          const textContent = await page.getTextContent({ disableCombineTextItems: true });
          const itemMatchesMap = new Map();

          textContent.items.forEach((item, itemIndex) => {
            const text = item?.str ?? '';
            if (!text) {
              return;
            }

            const regex = new RegExp(escaped, 'gi');
            const matchesForItem = [];
            let match;

            while ((match = regex.exec(text)) !== null) {
              const start = match.index;
              const end = start + match[0].length;
              const matchIndex = nextResults.length;

              nextResults.push({ pageNumber, itemIndex, start, end });
              matchesForItem.push({ matchIndex, start, end });
            }

            if (matchesForItem.length > 0) {
              itemMatchesMap.set(itemIndex, matchesForItem);
            }
          });

          if (itemMatchesMap.size > 0) {
            nextMatchesByPage.set(pageNumber, itemMatchesMap);
          }
        }

        setMatchesByPage(nextMatchesByPage);
        setResults(nextResults);
        setActiveMatchIndex(0);
        if (nextResults.length > 0) {
          goToPage(nextResults[0].pageNumber);
        }
      } catch (error) {
        console.error('Search failed', error);
        setErrorMessage('Unable to search this document.');
        setMatchesByPage(new Map());
      } finally {
        setIsSearching(false);
      }
    },
    [pdfDocument, numPages, query, goToPage, resetSearchState],
  );

  const toggleSearch = useCallback(() => {
    setIsOpen((open) => {
      if (open) {
        setQuery('');
        resetSearchState();
      }
      return !open;
    });
  }, [resetSearchState]);

  const closeSearch = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    resetSearchState();
  }, [resetSearchState]);

  const selectMatch = useCallback(
    (direction) => {
      const total = results.length;
      if (total === 0) {
        return;
      }

      setActiveMatchIndex((previous) => {
        const nextIndex = (previous + direction + total) % total;
        goToPage(results[nextIndex].pageNumber);
        return nextIndex;
      });
    },
    [results, goToPage],
  );

  const textRenderersByPage = useMemo(() => {
    if (results.length === 0 || matchesByPage.size === 0) {
      return new Map();
    }

    const map = new Map();

    matchesByPage.forEach((itemMatchesMap, pageNumber) => {
      map.set(pageNumber, ({ str, itemIndex }) => {
        const source = typeof str === 'string' ? str : '';
        const matches = itemMatchesMap.get(itemIndex);
        if (!matches || matches.length === 0) {
          return escapeHtml(source);
        }

        let cursor = 0;
        let output = '';

        matches.forEach(({ start, end, matchIndex }) => {
          const safeStart = Math.max(start, 0);
          const safeEnd = Math.max(end, safeStart);

          if (safeStart > cursor) {
            output += escapeHtml(source.slice(cursor, safeStart));
          }

          const segment = source.slice(safeStart, safeEnd);
          const isActive = matchIndex === activeMatchIndex;
          output += `<mark class="pdf-highlight${isActive ? ' pdf-highlight--active' : ''}">${escapeHtml(segment)}</mark>`;
          cursor = safeEnd;
        });

        if (cursor < source.length) {
          output += escapeHtml(source.slice(cursor));
        }

        return output;
      });
    });

    return map;
  }, [matchesByPage, results, activeMatchIndex]);

  const value = useMemo(
    () => ({
      isOpen,
      query,
      setQuery,
      handleQueryChange: (event) => setQuery(event.target.value),
      submitSearch: handleSearchSubmit,
      toggleSearch,
      closeSearch,
      selectNextMatch: () => selectMatch(1),
      selectPreviousMatch: () => selectMatch(-1),
      totalMatches: results.length,
      activeMatchIndex,
      isSearching,
      errorMessage,
      documentReady: documentReady && hasPages,
      textRenderersByPage,
    }),
    [
      isOpen,
      query,
      handleSearchSubmit,
      toggleSearch,
      closeSearch,
      selectMatch,
      results.length,
      activeMatchIndex,
      isSearching,
      errorMessage,
      documentReady,
      hasPages,
      textRenderersByPage,
    ],
  );

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider.');
  }
  return context;
}
