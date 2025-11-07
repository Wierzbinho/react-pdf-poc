import { createPortal } from 'react-dom';
import ToolbarGroup from './ToolbarGroup.jsx';
import SearchOverlay from '../SearchOverlay.jsx';
import { useSearch } from '../../context/SearchContext.jsx';

export default function SearchTool() {
  const {
    documentReady,
    toggleSearch,
    closeSearch,
    isOpen,
    inputRef,
    query,
    handleQueryChange,
    submitSearch,
    selectNextMatch,
    selectPreviousMatch,
    totalMatches,
    activeMatchIndex,
    isSearching,
    errorMessage,
  } = useSearch();

  const overlayProps = {
    isOpen,
    inputRef,
    query,
    onQueryChange: handleQueryChange,
    onSubmit: submitSearch,
    onSelectPrevious: selectPreviousMatch,
    onSelectNext: selectNextMatch,
    totalMatches,
    activeMatchIndex,
    documentReady,
    isSearching,
    onClose: closeSearch,
    errorMessage,
  };

  const overlay =
    isOpen && typeof document !== 'undefined'
      ? createPortal(<SearchOverlay {...overlayProps} />, document.body)
      : null;

  return (
    <>
      <ToolbarGroup label="Search document">
        <button type="button" onClick={toggleSearch} aria-label="Search in document" disabled={!documentReady}>
          <span aria-hidden="true" className="pdf-icon">
            🔍
          </span>
        </button>
      </ToolbarGroup>
      {overlay}
    </>
  );
}
