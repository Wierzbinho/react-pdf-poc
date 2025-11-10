import { useDownload } from '../../hooks/useDownload.js';
import { useDocument } from '../../context/DocumentContext.jsx';

export default function DownloadTool() {
  const { numPages } = useDocument();
  const { download, isDownloading } = useDownload();

  return (
    <button type="button" onClick={download} disabled={!numPages || isDownloading}>
      Download
    </button>
  );
}
