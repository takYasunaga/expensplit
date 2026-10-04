import type { Schema } from '@google/genai'

/** A receipt as read by Gemini. Amounts are dollars, e.g. 12.5. */
export interface ParsedReceipt {
  merchantName: string
  totalAmount: number
  lineItems: { description: string; amount: number }[]
}

/** An error whose message is safe to show to the user as-is. */
export class ReceiptScanError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'ReceiptScanError'
  }
}

// gemini-1.5-flash has been retired; this alias tracks the current Flash model.
const DEFAULT_MODEL = 'gemini-flash-latest'

const MAX_ATTEMPTS = 3
const RETRY_DELAY_MS = 2000

const SYSTEM_PROMPT = `You read photos of purchase receipts for an expense-splitting app.
Extract the merchant name, the final total charged, and every purchased line item.

Rules:
- Amounts are plain numbers in the receipt's currency, with no currency symbols.
- "amount" is the full price charged for the line. If a line shows a quantity, use the line total, not the unit price, and keep the quantity in the description (e.g. "Draft beer x3").
- Add tax, tip, service charges and other fees as their own line items so the line items add up to the total.
- Subtract a discount from the item it applies to. Never return a negative amount.
- "totalAmount" is the final amount paid, after tax and tip.
- Copy descriptions as printed, in the original language. Do not invent items.
- If the image is not a receipt or cannot be read, return an empty merchantName, a totalAmount of 0 and no lineItems.`

const NOT_CONFIGURED_MESSAGE =
  'Receipt scanning isn’t set up: add VITE_GEMINI_API_KEY to .env.local and restart the dev server.'

/** Reads a file as a data URL ("data:image/png;base64,..."). */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new ReceiptScanError('Couldn’t read that image file.'))
    reader.readAsDataURL(file)
  })
}

function toFriendlyError(error: unknown): ReceiptScanError {
  if (error instanceof ReceiptScanError) return error

  const status = (error as { status?: unknown } | null)?.status
  const detail = error instanceof Error ? error.message : ''
  let message = 'Couldn’t scan the receipt. Check your connection and try again.'
  if (status === 429) {
    message = 'The free Gemini quota is used up for now. Wait a minute and try again.'
  } else if (status === 401 || status === 403 || /API key not valid/i.test(detail)) {
    message = 'Gemini rejected the API key. Check VITE_GEMINI_API_KEY in .env.local.'
  } else if (status === 404) {
    message = 'The Gemini model wasn’t found. Check VITE_GEMINI_MODEL in .env.local.'
  } else if (typeof status === 'number' && status >= 500) {
    message = 'Gemini is busy right now. Try again in a moment.'
  }
  return new ReceiptScanError(message, { cause: error })
}

/** Checks the model's JSON and drops unusable lines. */
function toParsedReceipt(json: string): ParsedReceipt {
  let data: unknown
  try {
    data = JSON.parse(json)
  } catch (error) {
    throw new ReceiptScanError('Gemini returned something unreadable. Try scanning again.', {
      cause: error,
    })
  }

  const record = (data ?? {}) as Record<string, unknown>
  const rawItems = Array.isArray(record.lineItems) ? (record.lineItems as unknown[]) : []
  const lineItems = rawItems.flatMap((raw) => {
    const item = (raw ?? {}) as Record<string, unknown>
    const description = typeof item.description === 'string' ? item.description.trim() : ''
    const amount = Number(item.amount)
    return description && Number.isFinite(amount) && amount > 0 ? [{ description, amount }] : []
  })
  const totalAmount = Number(record.totalAmount)
  const parsed: ParsedReceipt = {
    merchantName: typeof record.merchantName === 'string' ? record.merchantName.trim() : '',
    totalAmount: Number.isFinite(totalAmount) && totalAmount > 0 ? totalAmount : 0,
    lineItems,
  }

  if (parsed.totalAmount === 0 && parsed.lineItems.length === 0) {
    throw new ReceiptScanError(
      'Couldn’t find a receipt in that image. Try a clearer photo, or enter the details manually.',
    )
  }
  return parsed
}

/**
 * Sends a receipt image to Gemini and returns its merchant, total and line
 * items. `base64Image` may be raw Base64 or a data URL; a data URL's MIME type
 * wins over `mimeType`. Throws ReceiptScanError with a user-facing message.
 */
export async function parseReceiptImage(
  base64Image: string,
  mimeType = 'image/jpeg',
): Promise<ParsedReceipt> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey) throw new ReceiptScanError(NOT_CONFIGURED_MESSAGE)

  const dataUrl = /^data:([^;,]+);base64,(.*)$/s.exec(base64Image)
  const data = dataUrl ? dataUrl[2] : base64Image
  const type = dataUrl ? dataUrl[1] : mimeType

  try {
    // Loaded on demand so the SDK is only downloaded when someone scans.
    const { GoogleGenAI, Type } = await import('@google/genai')

    const responseSchema: Schema = {
      type: Type.OBJECT,
      properties: {
        merchantName: { type: Type.STRING },
        totalAmount: { type: Type.NUMBER },
        lineItems: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              description: { type: Type.STRING },
              amount: { type: Type.NUMBER },
            },
            required: ['description', 'amount'],
          },
        },
      },
      required: ['merchantName', 'totalAmount', 'lineItems'],
    }

    const ai = new GoogleGenAI({ apiKey })
    const scan = () =>
      ai.models.generateContent({
        model: import.meta.env.VITE_GEMINI_MODEL || DEFAULT_MODEL,
        contents: [
          {
            role: 'user',
            parts: [
              { inlineData: { mimeType: type, data } },
              { text: 'Extract this receipt as JSON.' },
            ],
          },
        ],
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: 'application/json',
          responseSchema,
          temperature: 0,
        },
      })

    // The free tier often answers 503 "high demand"; a short wait usually clears it.
    for (let attempt = 1; ; attempt++) {
      try {
        const response = await scan()
        return toParsedReceipt(response.text ?? '')
      } catch (error) {
        const isOverloaded = (error as { status?: unknown } | null)?.status === 503
        if (!isOverloaded || attempt === MAX_ATTEMPTS) throw error
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * attempt))
      }
    }
  } catch (error) {
    console.error('Receipt scan failed:', error)
    throw toFriendlyError(error)
  }
}
