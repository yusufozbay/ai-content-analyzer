import React from 'react';
import { Download, Share2, Copy, FileText } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ExportShareButtonsProps {
  results: string;
  url?: string;
  markdownContent?: string;
}

const ExportShareButtons: React.FC<ExportShareButtonsProps> = ({ results, url, markdownContent }) => {
  const generatePDF = async () => {
    const element = document.getElementById('analysis-results');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: element.scrollWidth,
        height: element.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Add title page
      pdf.setFontSize(20);
      pdf.text('Mosanta AI - SEO Analysis Report', 20, 30);
      pdf.setFontSize(12);
      pdf.text(`Analyzed URL: ${url}`, 20, 45);
      pdf.text(`Generated on: ${new Date().toLocaleDateString('tr-TR')}`, 20, 55);
      pdf.text('Powered by Mosanta AI', 20, 65);
      
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`seo-analysis-${new Date().getTime()}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('PDF oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(results);
      alert('Analiz sonuçları panoya kopyalandı!');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      alert('Panoya kopyalama başarısız oldu.');
    }
  };

  const exportMarkdown = () => {
    if (!markdownContent) {
      alert('Markdown içeriği bulunamadı.');
      return;
    }

    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seo-analysis-${new Date().getTime()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const shareResults = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'SEO Analysis Results',
          text: `SEO Analysis for ${url}`,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback to copying URL
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert('Sayfa URL\'si panoya kopyalandı!');
      } catch (error) {
        console.error('Error copying URL:', error);
        alert('URL kopyalama başarısız oldu.');
      }
    }
  };

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <button
        onClick={generatePDF}
        className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
      >
        <Download className="w-4 h-4 mr-2" />
        PDF İndir
      </button>
      
      {markdownContent && (
        <button
          onClick={exportMarkdown}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <FileText className="w-4 h-4 mr-2" />
          Markdown İndir
        </button>
      )}
      
      <button
        onClick={copyToClipboard}
        className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
      >
        <Copy className="w-4 h-4 mr-2" />
        Panoya Kopyala
      </button>
      
      <button
        onClick={shareResults}
        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
      >
        <Share2 className="w-4 h-4 mr-2" />
        Paylaş
      </button>
    </div>
  );
};

export default ExportShareButtons;