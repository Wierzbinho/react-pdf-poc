import DownloadTool from './DownloadTool.jsx';

export default function Toolbar({ downloadDisabled }) {
  return (
    <div className="viewer-v2-toolbar">
      <DownloadTool disabled={downloadDisabled} />
    </div>
  );
}
