import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';

// แปลงเป็น JSON
export const exportJSON = (data, filename = "sales_crm_export.json") => {
  const jsonStr = JSON.stringify(data, null, 2);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([jsonStr], { type: "application/json" }));
  a.download = filename;
  a.click();
};

// แปลงเป็น CSV
export const exportCSV = (leads, filename = "sales_crm_leads.csv") => {
  const csvRows = [];
  csvRows.push("บริษัท,เลขนิติบุคคล,ผู้ติดต่อ,เบอร์โทร,อีเมล,รายละเอียด,รายได้รวม,ทุนจดทะเบียน,กำไร,สถานะ,ติดต่อล่าสุด,นัดถัดไป");
  
  leads.forEach(l => {
    const row = [
      `"${l.companyName || "-"}"`,
      `"${l.companyNumber || "-"}"`,
      `"${l.contactName || "-"}"`,
      `"${l.contactPhone || "-"}"`,
      `"${l.contactEmail || "-"}"`,
      `"${(l.description || "-").replace(/"/g, '""')}"`,
      `"${l.revenue || "-"}"`,
      `"${l.registeredCapital || "-"}"`,
      `"${l.profit || "-"}"`,
      `"${l.latestStatus || "-"}"`,
      `"${l.latestContactDate || "-"}"`,
      `"${l.nextFollowupDate || "-"}"`
    ];
    csvRows.push(row.join(","));
  });

  const csvString = "\uFEFF" + csvRows.join("\n");
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// แคปจอเป็นภาพ JPG
export const exportJPG = async (domElement, filename = "sales_crm_report.jpg") => {
  try {
    const dataUrl = await toPng(domElement, { backgroundColor: '#ffffff' });
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  } catch (err) {
    console.error("Export JPG Error:", err);
    toast.error("ไม่สามารถสร้างรูปภาพได้");
  }
};

// แคปจอแล้วยัดลง PDF
export const exportPDF_fromDOM = async (domElement, filename = "sales_crm_report.pdf") => {
  try {
    const dataUrl = await toPng(domElement, { backgroundColor: '#ffffff' });
    // คำนวณอัตราส่วนภาพให้อยู่ในหน้า A4 แนวนอน (Landscape)
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    // ตั้งค่ารูปให้พอดีหน้ากระดาษ
    const imgProps = pdf.getImageProperties(dataUrl);
    const imgRatio = imgProps.width / imgProps.height;
    const pdfRatio = pdfWidth / pdfHeight;
    
    let finalWidth, finalHeight;
    if (imgRatio > pdfRatio) {
      finalWidth = pdfWidth;
      finalHeight = pdfWidth / imgRatio;
    } else {
      finalHeight = pdfHeight;
      finalWidth = pdfHeight * imgRatio;
    }

    pdf.addImage(dataUrl, 'PNG', 0, 0, finalWidth, finalHeight);
    pdf.save(filename);
  } catch (err) {
    console.error("Export PDF Error:", err);
    toast.error("ไม่สามารถสร้าง PDF ได้");
  }
};

// ปริ้นข้อมูลเยอะๆ ด้วยหน้า HTML รองรับการขึ้นหน้าใหม่ (Page Break)
export const printHTMLTable = (leads, title = "รายงานสรุปข้อมูลลีด (All Leads Report)", printWindowParam = null) => {
  const formatDateShort = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date)) return dateString;
    const thMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const d = date.getDate();
    const m = thMonths[date.getMonth()];
    const y = (date.getFullYear() + 543).toString().slice(-2);
    return `${d} ${m} ${y}`;
  };
  const printWindow = printWindowParam || window.open('', '_blank');
  
  const statusCounts = leads.reduce((acc, l) => {
    const status = l.latestStatus || "ไม่ระบุ";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
  
  const totalLeads = leads.length;

  const getStatusColor = (status) => {
    switch(status) {
      case "ปิดการขาย": return { bg: "#dcfce7", border: "#22c55e", text: "#15803d" };
      case "ด่วนมาก": return { bg: "#fee2e2", border: "#ef4444", text: "#b91c1c" };
      case "มีตติ้ง": return { bg: "#ffedd5", border: "#f97316", text: "#c2410c" };
      case "ต้องตามต่อ": return { bg: "#e0f2fe", border: "#0ea5e9", text: "#0369a1" };
      case "ฝากโปรไฟล์": return { bg: "#f3e8ff", border: "#a855f7", text: "#7e22ce" };
      case "ทั่วไป": return { bg: "#f3f4f6", border: "#9ca3af", text: "#4b5563" };
      case "ติดต่อไม่ได้": return { bg: "#fee2e2", border: "#f87171", text: "#b91c1c" };
      case "ไม่สนใจ": return { bg: "#f1f5f9", border: "#64748b", text: "#334155" };
      default: return { bg: "#f0fdfa", border: "#14b8a6", text: "#0f766e" };
    }
  };

  const summaryHtml = Object.entries(statusCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([status, count]) => {
      const colors = getStatusColor(status);
      return `
      <div style="flex: 0 0 calc(33.333% - 10px); box-sizing: border-box; background: ${colors.bg} !important; border: 1px solid ${colors.border} !important; color: ${colors.text} !important; padding: 12px; border-radius: 8px; text-align: center; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
        <div style="font-size: 13px; opacity: 0.9; margin-bottom: 4px;">${status}</div>
        <div style="font-size: 26px; font-weight: bold;">${count} <span style="font-size: 14px; font-weight: normal;">ลีด</span></div>
      </div>
    `}).join('');

  const htmlContent = `
    <html>
      <head>
        <title>${title}</title>
        <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap" rel="stylesheet">
        <style>
          @page {
            margin: 0; /* ฆ่า Header ของ Browser */
          }
          body {
            font-family: 'Sarabun', sans-serif;
            color: #333;
            margin: 0;
            padding: 0 0.8cm; /* เว้นขอบซ้ายขวา 1.5cm ไม่ให้ชิดขอบกระดาษ */
            background: white;
          }
          /* Fixed Header ให้หัวข้ออยู่ทุกหน้า */
          .fixed-title {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            padding-top: 1.2cm; /* ขยับหัวข้อลงมาอีกนิด */
            background: white;
            z-index: 999;
            text-align: center;
            height: 2.5cm; /* กำหนดความสูงให้แน่นอน */
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px; /* เล็กลงนิดนึงเพื่อให้พอดี 11 คอลัมน์ */
          }
          thead {
            display: table-header-group;
          }
          tfoot {
            display: table-footer-group;
          }
          tr {
            page-break-inside: avoid;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 4px 3px; /* ลด padding เพื่อให้ไม่เบียด */
            text-align: left;
            word-break: break-word;
          }
          .nowrap {
            white-space: nowrap;
          }
          .col-header {
            background-color: #03B5AA !important;
            color: white !important;
            font-weight: 600;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          
          .summary-grid {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 15px;
            max-width: 650px;
            margin: 0 auto;
          }
          
          @media print {
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="text-align: right; padding: 20px; background: #f1f5f9; margin-bottom: 20px;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #03B5AA; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; font-family: 'Sarabun';">🖨️ สั่งปริ้น (หรือ Save as PDF)</button>
        </div>
        
        <!-- หัวข้อหลัก ลอยอยู่ด้านบนสุดของทุกหน้า -->
        <div class="fixed-title">
          <h2 style="margin: 0; color: #03B5AA; font-size: 24px;">${title}</h2>
          <div style="font-size: 14px; color: #666; font-weight: normal; margin-top: 5px;">
            จำนวนลีดทั้งหมด ${totalLeads} รายการ | ข้อมูล ณ วันที่: ${new Date().toLocaleDateString('th-TH')}
          </div>
        </div>

        <!-- หน้าแรก: ดันเนื้อหาลงมาไม่ให้ทับกับ Fixed Title -->
        <div style="padding-top: 4cm;">
          <!-- สรุปยอดสถานะ พิมพ์เฉพาะหน้าแรกเท่านั้น -->
          <div style="text-align: center; font-weight: bold; font-size: 16px; margin-bottom: 10px;">📊 สรุปยอดตามสถานะ:</div>
          <div class="summary-grid">
            ${summaryHtml}
          </div>
        </div>
        
        <table style="margin-top: -3.5cm; position: relative; z-index: 1;">
          <thead>
            <!-- Spacer: ดันตารางให้ต่ำกว่า Fixed Title ในทุกๆ หน้าที่พิมพ์ -->
            <tr><th colspan="11" style="height: 4.2cm; border: none; padding: 0;"></th></tr>
            <tr>
              <th class="col-header text-center nowrap">ลำดับ</th>
              <th class="col-header" style="max-width: 140px; white-space: normal;">บริษัท</th>
              <th class="col-header nowrap">ผู้ติดต่อ</th>
              <th class="col-header nowrap">เบอร์โทร</th>
              <th class="col-header text-right nowrap">รายได้</th>
              <th class="col-header text-right nowrap">ทุนจดทะเบียน</th>
              <th class="col-header text-right nowrap">กำไร</th>
              <th class="col-header nowrap">สถานะล่าสุด</th>
              <th class="col-header text-center nowrap">ติดต่อล่าสุด</th>
              <th class="col-header text-center nowrap">นัดถัดไป</th>
              <th class="col-header nowrap">ผู้ดูแล</th>
            </tr>
          </thead>
          <tbody>
            ${leads.map((l, index) => `
              <tr>
                <td class="text-center nowrap">${index + 1}</td>
                <td style="line-height: 1.4; max-width: 140px; white-space: normal; word-wrap: break-word;">${l.companyName || '-'}</td>
                <td class="nowrap">${l.contactName || '-'}</td>
                <td class="nowrap">${l.contactPhone || '-'}</td>
                <td class="text-right nowrap">${Number(l.revenue || 0).toLocaleString()}</td>
                <td class="text-right nowrap">${l.registeredCapital ? Number(l.registeredCapital).toLocaleString() : '-'}</td>
                <td class="text-right nowrap">${Number(l.profit || 0).toLocaleString()}</td>
                <td class="nowrap"><b>${l.latestStatus || '-'}</b></td>
                <td class="text-center nowrap">${formatDateShort(l.latestContactDate || l.updatedAt)}</td>
                <td class="text-center nowrap">${formatDateShort(l.nextFollowupDate)}</td>
                <td class="nowrap">${l.owner || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <!-- ขอบกระดาษด้านล่าง 2cm สำหรับทุกหน้า -->
            <tr><td colspan="11" style="height: 2cm; border: none; padding: 0;"></td></tr>
          </tfoot>
        </table>
        
        <script>
          setTimeout(function() { window.print(); }, 800);
        </script>
      </body>
    </html>
  `;

  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  } else {
    toast.error("Popup blocker อาจจะบล็อกการเปิดรายงาน กรุณาอนุญาตให้เปิด popup ได้");
  }
};
