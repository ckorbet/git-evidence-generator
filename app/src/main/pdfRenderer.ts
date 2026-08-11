import { BrowserWindow } from 'electron'

/**
 * Renders a self-contained HTML document to a PDF buffer using an offscreen `BrowserWindow`.
 * Each call creates and destroys its own window so concurrent report generations never share
 * (or race on) render state.
 */
export async function renderHtmlToPdf(html: string): Promise<Buffer> {
  const window = new BrowserWindow({
    show: false,
    webPreferences: {
      offscreen: true,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  try {
    await window.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
    const pdfBuffer = await window.webContents.printToPDF({
      printBackground: true,
      pageSize: 'A4',
      margins: { top: 0, bottom: 0, left: 0, right: 0 }
    })
    return pdfBuffer
  } finally {
    window.destroy()
  }
}
