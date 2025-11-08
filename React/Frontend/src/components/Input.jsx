import { useId } from 'react'

export default function Input({
  label, value, onChange, type='text', placeholder='', error, ...rest
}) {
  const id = useId()
  return (
    <div className={`field ${error ? 'is-error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      <input id={id} value={value} onChange={onChange} type={type} placeholder={placeholder} {...rest}/>
      <div role="alert" aria-live="polite" className="field-error">{error || ''}</div>
    </div>
  )
}
