import {keepDigits, keepLetters, isLetters, isDigits, isEmailBasic} from './validation'

export const CONTACT_LIMITS = {
    phoneMax: 12,
    msgMax: 500,
}

export const sanitizeName = (s) => keepLetters(s || '')
export const sanitizeEmail = (s) => (s || '').trim() // solo elimina espacios al inicio y al final
export const sanitizePhone = (s) => keepDigits(s || '').slice(0, CONTACT_LIMITS.phoneMax)
export const sanitizeMessage = (s) => (s || '').slice(0, CONTACT_LIMITS.msgMax) // opcional (s || '')

/**
 * Valida campos del formulario de Contact.
 * options.requireMessage: si true (default), el mensaje es obligatorio.
 */

export function validateContact(data = {}, options = {}) {
    const {
        fname = '', lname = '', email = '', phone = '', message = ''
    } = data
    const {requireMessage = true} = options // default: mensaje obligatorio
    const errors = {} // objeto que acumula los errores encontrados

    // Nombres
    if (!fname || !isLetters(fname)) errors.fname = 'First name: letters only'
    if (!lname || !isLetters(lname)) errors.lname = 'Last name: letters only'

    // Email
    if (!email || !isEmailBasic(email)) errors.email = 'Invalid email'

    // Teléfono (opcional)
    if (phone) {
        if (!isDigits(phone)) {
            errors.phone = 'Digits only'
        } else if (keepDigits(phone).length > CONTACT_LIMITS.phoneMax) {
            errors.phone = `Max ${CONTACT_LIMITS.phoneMax} digits`
        }
    }

    // Mensaje
    if (requireMessage) { // el mesnaje es obligatorio en Contact, pero no en Payment
        if (!message || !message.trim()) {
            errors.message = 'Message is required'
        } else if (message.length > CONTACT_LIMITS.msgMax) {
            errors.message = `Max ${CONTACT_LIMITS.msgMax} characters`
        }
    } else {
        // si no es requerido, solo controlamos el largo si viene
        if (message && message.length > CONTACT_LIMITS.msgMax) {
            errors.message = `Max ${CONTACT_LIMITS.msgMax} characters`
        }
    }

    return {ok: Object.keys(errors).length === 0, errors}
    // ok es true si no hay errores (el objeto errors está vacío)
}
