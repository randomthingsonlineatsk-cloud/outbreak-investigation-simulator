import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { PAGE_H, PAGE_W, layoutSummary, pdfSafe, type SummaryModel } from './oi-summary-data'

// Draws the layout from layoutSummary onto a single A4 page using the PDF
// standard Helvetica fonts (no font files to load or embed).
export async function buildSummaryPdf(model: SummaryModel): Promise<{ bytes: Uint8Array; replacedChars: number; hiddenOutbreaks: number }> {
  const doc = await PDFDocument.create()
  const page = doc.addPage([PAGE_W, PAGE_H])
  const regular = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const measure = (t: string, size: number, isBold: boolean) => (isBold ? bold : regular).widthOfTextAtSize(t, size)

  const { ops, replacedChars, hiddenOutbreaks } = layoutSummary(model, measure)
  for (const op of ops) {
    if (op.kind === 'rect') page.drawRectangle({ x: op.x, y: op.y, width: op.w, height: op.h, color: rgb(...op.fill) })
    else if (op.kind === 'line') page.drawLine({ start: { x: op.x1, y: op.y1 }, end: { x: op.x2, y: op.y2 }, thickness: 0.8, color: rgb(...op.color) })
    else page.drawText(op.text, { x: op.x, y: op.y, size: op.size, font: op.bold ? bold : regular, color: rgb(...op.color) })
  }

  const safeName = pdfSafe(model.name).text
  doc.setTitle(safeName ? `Field Epidemiology Skills Summary - ${safeName}` : 'Field Epidemiology Skills Summary')
  doc.setCreator('Outbreak Investigation Simulator')
  doc.setProducer('Outbreak Investigation Simulator')
  return { bytes: await doc.save(), replacedChars, hiddenOutbreaks }
}
