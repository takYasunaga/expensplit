interface DollarInputProps {
  id?: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  ariaLabel?: string
}

export function DollarInput({ id, value, onChange, required, ariaLabel }: DollarInputProps) {
  return (
    <div className="relative">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-gray-500"
      >
        $
      </span>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        min="0.01"
        step="0.01"
        placeholder="0.00"
        required={required}
        aria-label={ariaLabel}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-gray-300 py-2 pr-3 pl-7 text-sm tabular-nums focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:outline-none"
      />
    </div>
  )
}
