export default function SearchOverlay({
  isOpen,
  inputRef,
  query,
  onQueryChange,
  onSubmit,
  onSelectPrevious,
  onSelectNext,
  totalMatches,
  activeMatchIndex,
  documentReady,
  isSearching,
  onClose,
  errorMessage,
}) {
  if (!isOpen) {
    return null;
  }

  const hasMatches = totalMatches > 0;
  const summaryLabel = hasMatches ? `${activeMatchIndex + 1} / ${totalMatches}` : '0 / 0';

  return (
    <div className="pdf-search-overlay" role="dialog" aria-label="Search document">
      <form className="pdf-search-form" onSubmit={onSubmit}>
        <input
          ref={inputRef}
          type="search"
          placeholder="Find in document"
          value={query}
          onChange={onQueryChange}
          disabled={!documentReady}
        />
        <span className="pdf-search-count">{summaryLabel}</span>
        <div className="pdf-search-nav">
          <button type="button" onClick={onSelectPrevious} disabled={!hasMatches}>
            ‹
          </button>
          <button type="button" onClick={onSelectNext} disabled={!hasMatches}>
            ›
          </button>
        </div>
        <button type="submit" disabled={!documentReady || isSearching}>
          {isSearching ? '…' : 'Go'}
        </button>
        <button type="button" className="pdf-search-close" onClick={onClose}>
          ×
        </button>
      </form>
      {errorMessage ? <p className="pdf-search-error">{errorMessage}</p> : null}
    </div>
  );
}
