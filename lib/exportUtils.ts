import { Order } from '@/types/orders';

export function exportToCSV(orders: Order[], filename: string = 'orders.csv') {
  const headers = [
    'Buyurtma ID',
    'Mijoz ismi',
    'Mijoz email',
    'Mijoz telefon',
    'Status',
    'To\'lov turi',
    'Pickup sanasi',
    'Mas\'ul shaxs',
    'Mahsulotlar',
    'Jami summa',
    'Yaratilgan sanasi',
  ];

  const rows = orders.map((order) => [
    order.id,
    order.customerName,
    order.customerEmail,
    order.customerPhone,
    order.status,
    order.paymentType,
    order.pickupDate.toLocaleDateString('uz-UZ'),
    order.assignedTo || '',
    order.products.map((p) => `${p.name} (${p.quantity}x${p.price})`).join('; '),
    order.totalAmount,
    new Date(order.createdAt).toLocaleString('uz-UZ'),
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToExcel(orders: Order[], filename: string = 'orders.xlsx') {
  // Create CSV in Excel-compatible format
  const headers = [
    'Buyurtma ID',
    'Mijoz ismi',
    'Mijoz email',
    'Mijoz telefon',
    'Status',
    'To\'lov turi',
    'Pickup sanasi',
    'Mas\'ul shaxs',
    'Mahsulotlar',
    'Jami summa',
    'Yaratilgan sanasi',
  ];

  const rows = orders.map((order) => [
    order.id,
    order.customerName,
    order.customerEmail,
    order.customerPhone,
    order.status,
    order.paymentType,
    order.pickupDate.toLocaleDateString('uz-UZ'),
    order.assignedTo || '',
    order.products.map((p) => `${p.name} (${p.quantity}x${p.price})`).join('; '),
    order.totalAmount,
    new Date(order.createdAt).toLocaleString('uz-UZ'),
  ]);

  // Create workbook XML
  const xlsContent = `
    <?xml version="1.0" encoding="UTF-8"?>
    <?mso-application progid="Excel.Sheet"?>
    <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
     xmlns:o="urn:schemas-microsoft-com:office:office"
     xmlns:x="urn:schemas-microsoft-com:office:excel"
     xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
     xmlns:html="http://www.w3.org/TR/REC-html40">
     <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
      <Created>${new Date().toISOString()}</Created>
     </DocumentProperties>
     <Worksheet ss:Name="Orders">
      <Table>
       ${[headers, ...rows]
         .map(
           (row) => `
        <Row>
         ${row.map((cell) => `<Cell><Data ss:Type="String">${String(cell).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</Data></Cell>`).join('')}
        </Row>
       `
         )
         .join('')}
      </Table>
     </Worksheet>
    </Workbook>
  `;

  const blob = new Blob([xlsContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToPDF(orders: Order[], filename: string = 'orders.pdf') {
  // Simple HTML to PDF conversion using print
  const printWindow = window.open('', '', 'width=800,height=600');
  if (!printWindow) return;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Buyurtmalar</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { text-align: center; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .page-break { page-break-after: always; }
      </style>
    </head>
    <body>
      <h1>Buyurtmalar ro'yxati</h1>
      <p>Nusxa sanasi: ${new Date().toLocaleString('uz-UZ')}</p>
      <table>
        <thead>
          <tr>
            <th>Buyurtma ID</th>
            <th>Mijoz</th>
            <th>Status</th>
            <th>To'lov</th>
            <th>Pickup</th>
            <th>Summa</th>
          </tr>
        </thead>
        <tbody>
          ${orders
            .map(
              (order) => `
            <tr>
              <td>${order.id}</td>
              <td>${order.customerName}</td>
              <td>${order.status}</td>
              <td>${order.paymentType}</td>
              <td>${order.pickupDate.toLocaleDateString('uz-UZ')}</td>
              <td>${order.totalAmount.toLocaleString('uz-UZ')}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
      <p style="margin-top: 20px; text-align: center;">
        <strong>Jami:</strong> ${orders.reduce((sum, o) => sum + o.totalAmount, 0).toLocaleString('uz-UZ')} som
      </p>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();

  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
}
