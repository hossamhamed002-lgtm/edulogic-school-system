
import * as XLSX from 'xlsx';
// @ts-ignore
import html2pdf from 'html2pdf.js';

export const exportUtils = {
  /**
   * للطباعة مع معاينة احترافية تدعم التوجيه والهوامش المخصصة
   * @param elementId معرف العنصر المراد طباعته
   * @param orientation 'portrait' أو 'landscape'
   * @param margin الهامش بالملم (افتراضي 5)
   */
  print: (elementId?: string, orientation: 'portrait' | 'landscape' = 'portrait', margin: number = 5) => {
    if (elementId) {
      const element = document.getElementById(elementId);
      if (element) {
        const isLandscape = orientation === 'landscape';
        const width = isLandscape ? '297mm' : '210mm';
        const height = isLandscape ? '210mm' : '297mm';

        const printWindow = window.open('', '_blank', 'width=1150,height=850');
        if (printWindow) {
          printWindow.document.write(`
            <html lang="ar" dir="rtl">
              <head>
                <title>معاينة الطباعة - نظام كنترول النسر</title>
                <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@200..1000&display=swap" rel="stylesheet">
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                  @page { 
                    size: A4 ${orientation}; 
                    margin: ${margin}mm !important; 
                  }
                  body { 
                    font-family: 'Cairo', sans-serif; 
                    background-color: #f3f4f6; 
                    margin: 0;
                    padding: 10mm;
                    display: flex;
                    justify-content: center;
                  }
                  .print-sheet {
                    background: white;
                    width: ${width};
                    min-height: ${height};
                    padding: 0;
                    box-shadow: 0 0 20px rgba(0,0,0,0.15);
                    box-sizing: border-box;
                  }
                  @media print {
                    body { background: white; padding: 0; }
                    .print-sheet { 
                        box-shadow: none; 
                        padding: 0; 
                        width: 100% !important; 
                        min-height: initial !important;
                    }
                    .no-print { display: none !important; }
                  }
                  .no-print { display: none !important; }
                  /* إجبار النص على سطر واحد في الجداول */
                  table { table-layout: auto !important; width: 100% !important; }
                  td, th { white-space: nowrap !important; }
                </style>
              </head>
              <body>
                <div class="print-sheet">
                  ${element.innerHTML}
                </div>
                <script>
                  window.onload = () => {
                    setTimeout(() => {
                      window.print();
                    }, 800);
                  };
                </script>
              </body>
            </html>
          `);
          printWindow.document.close();
          return;
        }
      }
    }
    window.print();
  },

  /**
   * للتصدير إلى ملف PDF احترافي مع هوامش مخصصة
   */
  exportToPDF: (
    elementId: string,
    filename: string,
    orientation: 'portrait' | 'landscape' = 'portrait',
    margin: number = 5,
    format: 'a4' | 'a3' = 'a4'
  ) => {
    const element = document.getElementById(elementId);
    if (!element) return Promise.reject('Element not found');

    const rect = element.getBoundingClientRect();
    const targetId = elementId;
    const opt = {
      margin: margin,
      filename: `${filename}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: {
        scale: 1.5,
        useCORS: true,
        allowTaint: true,
        letterRendering: false,
        foreignObjectRendering: true,
        windowWidth: Math.max(element.scrollWidth, rect.width),
        windowHeight: Math.max(element.scrollHeight, rect.height),
        scrollX: 0,
        scrollY: 0,
        onclone: (doc: Document) => {
          document.querySelectorAll('link[rel="stylesheet"], style').forEach((node) => {
            doc.head.appendChild(node.cloneNode(true));
          });
          const link = doc.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://fonts.googleapis.com/css2?family=Cairo:wght@200..1000&display=swap';
          doc.head.appendChild(link);
          const style = doc.createElement('style');
          style.textContent = `
            * { font-family: 'Cairo', 'Noto Naskh Arabic', sans-serif !important; }
            html, body { direction: rtl; unicode-bidi: plaintext; }
            body { font-smooth: always; -webkit-font-smoothing: antialiased; }
            .no-print { display: none !important; }
          `;
          doc.head.appendChild(style);
          const printRoot = doc.getElementById(targetId);
          if (printRoot) {
            (printRoot as HTMLElement).style.overflow = 'visible';
            (printRoot as HTMLElement).style.height = 'auto';
            (printRoot as HTMLElement).style.maxHeight = 'none';
          }
        }
      },
      pagebreak: { mode: ['css', 'legacy'] as const },
      jsPDF: { unit: 'mm' as const, format: format as const, orientation: orientation }
    };

    return html2pdf().set(opt).from(element).save();
  },

  exportTableToExcel: (tableId: string, filename: string) => {
    const table = document.getElementById(tableId);
    if (!table) return;
    const wb = XLSX.utils.table_to_book(table);
    XLSX.writeFile(wb, `${filename}.xlsx`);
  },

  exportDataToExcel: (data: any[], filename: string) => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.writeFile(wb, `${filename}.xlsx`);
  }
};
