import { jsPDF } from 'jspdf';

// Avery 5160 sheet: 3 columns x 10 rows of 2.625" x 1" labels on letter paper.
// All measurements are in inches.
const SHEET = {
  columns: 3,
  rows: 10,
  topMargin: 0.5,
  leftMargin: 0.1875,
  labelWidth: 2.625,
  labelHeight: 1,
  columnPitch: 2.75,
  rowPitch: 1,
  textPadding: 0.15,
};
const LABELS_PER_PAGE = SHEET.columns * SHEET.rows;
const FONT_SIZE = 10;

// Builds a PDF of address labels, one per property, and downloads it.
export default function (properties) {
  const doc = new jsPDF({ unit: 'in', format: 'letter' });
  doc.setFont('helvetica');
  doc.setFontSize(FONT_SIZE);

  const lineHeight = FONT_SIZE / 72 * doc.getLineHeightFactor();
  const maxTextWidth = SHEET.labelWidth - SHEET.textPadding * 2;

  const labels = properties
    .filter(item => item.address_std)
    .map(item => [ 'ATTN: ALL RESIDENTS', item.address_std, `PHILADELPHIA, PA ${item.zip_code}` ]);

  labels.forEach((label, index) => {
    const position = index % LABELS_PER_PAGE;
    if (index > 0 && position === 0) doc.addPage();

    const column = position % SHEET.columns;
    const row = Math.floor(position / SHEET.columns);
    const centerX = SHEET.leftMargin + column * SHEET.columnPitch + SHEET.labelWidth / 2;
    const centerY = SHEET.topMargin + row * SHEET.rowPitch + SHEET.labelHeight / 2;

    const lines = label.flatMap(line => doc.splitTextToSize(line, maxTextWidth));
    const firstLineY = centerY - (lines.length - 1) * lineHeight / 2;
    doc.text(lines, centerX, firstLineY, { align: 'center', baseline: 'middle' });
  });

  doc.save('mailing-labels.pdf');
}
