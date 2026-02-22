import {useId} from 'react'

// parametros que recibe 
export default function Input({
                                  label,
                                  value,
                                  onChange,
                                  type = 'text',
                                  placeholder = '',
                                  error,
                                  full = false,
                                  ...rest // → cualquier otra prop que se le pase (maxLength, autoComplete, etc.)
                              }) {
    const id = useId()
    const classes = [
        'field',
        error ? 'is-error' : '',
        full ? 'field-full' : ''
    ]
        .filter(Boolean) // elimina los strings vacíos '' del array
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
                {...rest} // sin necesidad de declararlas explícitamente
            />
            <div role="alert" aria-live="polite" className="field-error">
                {error || ''}
            </div>
            {/* role="alert" + aria-live="polite" → accesibilidad
                el lector de pantalla anuncia el error cuando aparece
                si no hay error muestra string vacío pero mantiene el espacio */}
        </div>
    )
}
