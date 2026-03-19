'use client'

import * as XLSX from 'xlsx'
import Papa from 'papaparse'

export interface ExtractedProduct {
  name: string
  quantity: number
  price: number
  category: string
}

async function extractProductsFromPDF(file: File): Promise<ExtractedProduct[]> {
  const pdfjsLib = await import('pdfjs-dist')

  if (typeof window !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
  }

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise

  let products: ExtractedProduct[] = []

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const textContent = await page.getTextContent()

    const items = textContent.items.filter((item: any) => 'str' in item)

    const text = items.map((item: any) => item.str).join(' ')

    const lines = text.split(/\n|,/)

    for (const line of lines) {
      const match = line.match(/(.+?)\s+(\d+)\s+(\d+(?:\.\d+)?)/)

      if (match) {
        const name = match[1].trim()
        const quantity = parseInt(match[2], 10)
        const price = parseFloat(match[3])

        if (name && quantity > 0 && price > 0) {
          products.push({
            name,
            quantity,
            price,
            category: 'PDF dan yuklandi',
          })
        }
      }
    }
  }

  return products
}

async function extractProductsFromCSV(file: File): Promise<ExtractedProduct[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: any) => {
        const products: ExtractedProduct[] = []

        for (const row of results.data) {
          const name =
            row.name || row['Mahsulot'] || row['Product Name'] || row['Nomi'] || ''

          const quantity = parseInt(
            row.quantity || row['Miqdor'] || row['Qty'] || row['Soni'] || '0',
            10
          )

          const price = parseFloat(
            row.price || row['Narx'] || row['Price'] || row['Qiyma'] || '0'
          )

          const category =
            row.category ||
            row['Kategoriya'] ||
            row['Category'] ||
            'CSV dan yuklandi'

          if (name && quantity > 0 && price > 0) {
            products.push({
              name: name.toString(),
              quantity,
              price,
              category,
            })
          }
        }

        resolve(products)
      },
      error: (error: any) => {
        reject(new Error(`CSV parsing xatosi: ${error.message}`))
      },
    })
  })
}

async function extractProductsFromExcel(file: File): Promise<ExtractedProduct[]> {
  const arrayBuffer = await file.arrayBuffer()

  const workbook = XLSX.read(arrayBuffer, { type: 'array' })

  const worksheet = workbook.Sheets[workbook.SheetNames[0]]

  const rows: any[] = XLSX.utils.sheet_to_json(worksheet)

  const products: ExtractedProduct[] = []

  for (const row of rows) {
    const name =
      row.name || row['Mahsulot'] || row['Product Name'] || row['Nomi'] || ''

    const quantity = parseInt(
      row.quantity || row['Miqdor'] || row['Qty'] || row['Soni'] || '0',
      10
    )

    const price = parseFloat(
      row.price || row['Narx'] || row['Price'] || row['Qiyma'] || '0'
    )

    const category =
      row.category || row['Kategoriya'] || row['Category'] || 'Excel dan yuklandi'

    if (name && quantity > 0 && price > 0) {
      products.push({
        name: name.toString(),
        quantity,
        price,
        category,
      })
    }
  }

  return products
}

export async function extractProductsFromFile(
  file: File
): Promise<ExtractedProduct[]> {
  const fileName = file.name.toLowerCase()

  if (fileName.endsWith('.pdf')) {
    return extractProductsFromPDF(file)
  }

  if (fileName.endsWith('.csv')) {
    return extractProductsFromCSV(file)
  }

  if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    return extractProductsFromExcel(file)
  }

  throw new Error(
    "Noto'g'ri fayl turi. Iltimos, PDF, CSV yoki Excel (.xlsx, .xls) faylni yuklang."
  )
}