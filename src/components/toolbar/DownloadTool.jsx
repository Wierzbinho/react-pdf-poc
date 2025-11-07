import ToolbarGroup from './ToolbarGroup.jsx';

export default function DownloadTool({ numPages, onDownload }) {
  return (
    <ToolbarGroup label="Download document">
      <button type="button" onClick={onDownload} disabled={!numPages} aria-label="Download PDF">
        <span aria-hidden="true" className="pdf-icon">
          ⬇
        </span>
      </button>
    </ToolbarGroup>
  );
}
