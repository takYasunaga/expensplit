import { useEffect, useId, useState, type DragEvent } from 'react'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE_BYTES = 10 * 1024 * 1024

interface ReceiptUploaderProps {
  file: File | null
  onFileChange: (file: File | null) => void
  onScan: () => void
  isScanning: boolean
  /** Result of the last scan attempt, shown under the button. */
  scanMessage?: { tone: 'error' | 'info'; text: string } | null
}

function formatSize(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function ReceiptUploader({
  file,
  onFileChange,
  onScan,
  isScanning,
  scanMessage,
}: ReceiptUploaderProps) {
  const inputId = useId()
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)

  useEffect(() => {
    if (!file) return
    // Object URLs are an external resource: create one per file, revoke it on cleanup.
    const url = URL.createObjectURL(file)
    // oxlint-disable-next-line react/set-state-in-effect
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const selectFile = (candidate: File | undefined) => {
    if (!candidate) return
    if (!ACCEPTED_TYPES.includes(candidate.type)) {
      setFileError('That file type isn’t supported. Use a JPG, PNG or WebP image.')
      return
    }
    if (candidate.size > MAX_SIZE_BYTES) {
      setFileError(`That image is ${formatSize(candidate.size)}. The limit is 10 MB.`)
      return
    }
    setFileError(null)
    onFileChange(candidate)
  }

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    setIsDragging(false)
    selectFile(event.dataTransfer.files[0])
  }

  return (
    <div>
      <input
        id={inputId}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        className="sr-only"
        // Reset so choosing the same file again still fires onChange.
        onClick={(event) => (event.currentTarget.value = '')}
        onChange={(event) => selectFile(event.target.files?.[0])}
      />

      {file && previewUrl ? (
        <div className="flex gap-3 rounded-lg border border-gray-200 p-3">
          <img
            src={previewUrl}
            alt="Receipt preview"
            className="h-24 w-20 shrink-0 rounded-md border border-gray-200 object-cover"
          />
          <div className="flex min-w-0 flex-1 flex-col">
            <p className="truncate text-sm font-medium text-gray-900">{file.name}</p>
            <p className="text-xs text-gray-500">{formatSize(file.size)}</p>
            <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-2 pt-2">
              <button
                type="button"
                disabled={isScanning}
                onClick={onScan}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {isScanning ? 'Scanning…' : '✨ Scan Receipt with AI'}
              </button>
              <label
                htmlFor={inputId}
                className="cursor-pointer text-sm text-gray-600 underline hover:text-gray-900"
              >
                Replace
              </label>
              <button
                type="button"
                disabled={isScanning}
                onClick={() => onFileChange(null)}
                className="text-sm text-gray-600 underline hover:text-gray-900 disabled:text-gray-300"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          onDragOver={(event) => {
            event.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`flex cursor-pointer flex-col items-center rounded-lg border-2 border-dashed px-4 py-5 text-center transition-colors ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }`}
        >
          <span className="text-sm font-medium text-gray-900">
            Drop a receipt photo here, or <span className="text-indigo-600">choose a file</span>
          </span>
          <span className="mt-1 text-xs text-gray-500">JPG, PNG or WebP, up to 10 MB</span>
        </label>
      )}

      {fileError && (
        <p role="alert" className="mt-2 text-sm text-red-700">
          {fileError}
        </p>
      )}
      {scanMessage && (
        <p
          role={scanMessage.tone === 'error' ? 'alert' : 'status'}
          className={`mt-2 text-sm ${scanMessage.tone === 'error' ? 'text-red-700' : 'text-gray-600'}`}
        >
          {scanMessage.text}
        </p>
      )}
    </div>
  )
}
