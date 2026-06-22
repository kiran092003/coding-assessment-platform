import { DatePicker, CustomProvider } from 'rsuite'

export default function DateTimePicker({ label, value, onChange, placeholder = 'Select date & time', required, minDate }) {
  return (
    <CustomProvider theme="dark">
      <div>
        {label && (
          <label className="block text-[#8890B0] text-xs font-semibold uppercase tracking-wider mb-2">
            {label}
          </label>
        )}
        <DatePicker
          format="MMM dd, yyyy HH:mm"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          style={{ width: '100%' }}
          size="md"
          cleanable={false}
          editable={false}
          placement="autoVerticalStart"
          showMeridian={false}
          shouldDisableDate={minDate ? (date) => date < minDate : undefined}
        />
        {required && !value && (
          <span className="sr-only">required</span>
        )}
      </div>
    </CustomProvider>
  )
}
