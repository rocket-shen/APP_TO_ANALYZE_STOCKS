// my-app/src/hooks/useDownloadExcel.js
import { useState } from 'react';

export const useDownloadExcel = () => {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async (targetSymbol) => {
    if (!targetSymbol) return;

    setDownloading(true);
    try {
      const response = await fetch(
        `/api/v1/export-excel/${targetSymbol}`,
        { method: 'GET' }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${targetSymbol}_財務報表.xlsx`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      // 延遲一點再清理（更穩定）
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);

      alert(`${targetSymbol} 財務報表下載成功！`);
    } catch (err) {
      console.error(err);
      alert('下載失敗，請確認後端服務是否運行');
    } finally {
      setDownloading(false);
    }
  };

  return { handleDownload, downloading };
};