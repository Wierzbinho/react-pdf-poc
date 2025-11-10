import DownloadTool from './DownloadTool.jsx';

export default function Toolbar({ onDownload, downloadDisabled }) {
  return (
    <div className="viewer-v2-toolbar">
      <DownloadTool onDownload={onDownload} disabled={downloadDisabled} />
    </div>
  );
}
