export const formatPrice = n => new Intl.NumberFormat('en-US', { style:'currency', currency:'USD' }).format(+n || 0)
export const parseISODate = v => (v ? new Date(v + 'T00:00:00') : null)
export const calcNights = (inD, outD) => (!inD || !outD ? 0 : Math.max(0, (outD - inD) / 86400000))
export const pluralize = (n, s, p = s + 's') => `${n} ${n === 1 ? s : p}`

export const isLetterOrSpace = ch =>
  ch === ' ' || ch === '-' || ch === "'" || ch.toLowerCase() !== ch.toUpperCase()
export const keepLetters = s => [...(s || '')].filter(isLetterOrSpace).join('')
export const isLetters = s => s.trim().length > 0 && [...s.trim()].every(isLetterOrSpace)

export const isDigit = ch => ch >= '0' && ch <= '9'
export const keepDigits = s => [...(s || '')].filter(isDigit).join('')
export const isDigits = s => s.length > 0 && [...s].every(isDigit)

export const isEmailBasic = s => {
  const t = (s || '').trim()
  const at = t.indexOf('@'), dot = t.lastIndexOf('.')
  return at > 0 && dot > at + 1 && dot < t.length - 1
}

export const isExpiryMMYY = s => {
  const t = (s || '').trim()
  if (t.length !== 5 || t[2] !== '/') return false
  const mm = t.slice(0,2), yy = t.slice(3)
  if (!isDigits(mm) || !isDigits(yy)) return false
  const m = Number(mm)
  return m >= 1 && m <= 12
}

export const validateDates = (checkin, checkout) => {
  const inD = parseISODate(checkin), outD = parseISODate(checkout), today = new Date()
  today.setHours(0,0,0,0)
  if (!inD || !outD) return 'Complete Check-in and Check-out.'
  if (inD < today) return 'The check-in date cannot be earlier than today.'
  if (outD <= inD) return 'The check-out date must be after the check-in date.'
  return null
}

export const isLuhn = s => {
  const digits = keepDigits(s)
  let sum = 0, dbl = false
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = +digits[i]
    if (dbl) { d *= 2; if (d > 9) d -= 9 }
    sum += d; dbl = !dbl
  }
  return sum % 10 === 0
}