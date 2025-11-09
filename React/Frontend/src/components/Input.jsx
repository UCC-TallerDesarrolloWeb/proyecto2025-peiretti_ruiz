import {useId} from 'react'

export default function Input({
                                  label,
                                  value,
                                  onChange,
                                  type = 'text',
                                  placeholder = '',
                                  error,
                                  full = false,
                                  ...rest
                              }) {
    const id = useId()
    const classes = [
        'field',
        error ? 'is-error' : '',
        full ? 'field-full' : ''
    ]
        .filter(Boolean)
        .join(' ')

    return (
        <div className={classes}>
            <label htmlFor={id}>{label}</label>
            <input
                id={id}
                value={value}
                onChange={onChange}
                type={type}
                placeholder={placeholder}
                {...rest}
            />
            <div role="alert" aria-live="polite" className="field-error">
                {error || ''}
            </div>
        </div>
    )
}
