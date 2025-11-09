// src/utils/contactValidation.js
import {
  keepDigits,
  keepLetters,
  isLetters,
  isDigits,
  isEmailBasic,
} from './validation'

// límites usados en Contact
export const CONTACT_LIMITS = {
  phoneMax: 12,     // máx. 12 dígitos (sin contar el código de país)
  msgMax: 500,      // igual al placeholder del form
}

/**
 * Sanitizadores rápidos para usar en onChange
 */
export const sanitizeName = (s) => keepLetters(s || '')
export const sanitizeEmail = (s) => (s || '').trim()
export const sanitizePhone = (s) => keepDigits(s || '').slice(0, CONTACT_LIMITS.phoneMax)
export const sanitizeMessage = (s) => (s || '').slice(0, CONTACT_LIMITS.msgMax)

/**
 * Valida todos los campos del form de Contact.
 * @param {Object} data { fname, lname, email, phone, message }
 * @returns {{ ok: boolean, errors: Record<string,string> }}
 */
export function validateContact(data = {}) {
  const { fname = '', lname = '', email = '', phone = '', message = '' } = data
  const errors = {}

  // Nombres
  if (!fname || !isLetters(fname)) {
    errors.fname = 'First name: letters only'
  }
  if (!lname || !isLetters(lname)) {
    errors.lname = 'Last name: letters only'
  }

  // Email
  if (!email || !isEmailBasic(email)) {
    errors.email = 'Invalid email'
  }

  // Teléfono (opcional, pero si viene debe ser numérico y con límite)
  if (phone) {
    if (!isDigits(phone)) {
      errors.phone = 'Digits only'
    } else if (keepDigits(phone).length > CONTACT_LIMITS.phoneMax) {
      errors.phone = `Max ${CONTACT_LIMITS.phoneMax} digits`
    }
  }

  // Mensaje (requerido)
  if (!message || !message.trim()) {
    errors.message = 'Message is required'
  } else if (message.length > CONTACT_LIMITS.msgMax) {
    errors.message = `Max ${CONTACT_LIMITS.msgMax} characters`
  }

  return { ok: Object.keys(errors).length === 0, errors }
}

/**
 * Ayudín para combinar código de país y número sin símbolos.
 * No valida; solo concatena dígitos limpios.
 */
export const buildInternationalPhone = (ccode = '', phone = '') =>
  keepDigits(`${ccode}${phone}`)
