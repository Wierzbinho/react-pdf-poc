export default function DownloadTool({ onDownload, disabled }) {
  return (
    <button type="button" onClick={onDownload} disabled={disabled}>
      Download
    </button>
  );
}
