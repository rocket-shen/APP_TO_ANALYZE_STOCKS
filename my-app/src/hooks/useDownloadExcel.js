// my-app/src/hooks/useDownloadExcel.js
import { useState } from 'react';

const parseFilename = (disposition, fallback) => {
  if (!disposition) return fallback;
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
  if (utf8?.[1]) {
    try {
      return decodeURIComponent(utf8[1]);
    } catch {
      return utf8[1];
    }
  }
  const plain = /filename="?([^";]+)"?/i.exec(disposition);
  return plain?.[1] || fallback;
};

export const useDownloadExcel = () => {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async (targetSymbol) => {
    if (!targetSymbol) return;

    setDownloading(true);
    try {
      const response = await fetch(`/api/v1/export-excel/${targetSymbol}`, {
        method: 'GET',
      });

      const contentType = response.headers.get('content-type') || '';

      if (!response.ok) {
        let message = `下載失败（HTTP ${response.status}）`;
        if (contentType.includes('application/json')) {
          const err = await response.json();
          if (err?.detail) message = String(err.detail);
        }
        throw new Error(message);
      }

      if (contentType.includes('application/json')) {
        throw new Error('後端回傳的不是 Excel 檔案，請確認 /export-excel 使用 FileResponse');
      }

      const blob = await response.blob();
      const fileName = parseFilename(
        response.headers.get('content-disposition'),
        `${targetSymbol}_財務報表.xlsx`
      );

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
    } catch (err) {
      console.error(err);
      alert(err.message || '下載失敗，請確認後端服務是否運行');
    } finally {
      setDownloading(false);
    }
  };

  return { handleDownload, downloading };
};