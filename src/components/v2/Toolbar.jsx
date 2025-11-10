import DownloadTool from './DownloadTool.jsx';
import PrintTool from './PrintTool.jsx';

export default function Toolbar() {
  return (
    <div className="viewer-v2-toolbar">
      <DownloadTool />
      <PrintTool />
    </div>
  );
}
