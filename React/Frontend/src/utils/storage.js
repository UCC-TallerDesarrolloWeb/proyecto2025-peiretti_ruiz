const ls = typeof window !== 'undefined' ? window.localStorage : null
export const save = (k, v) => ls?.setItem(k, JSON.stringify(v))
export const load = (k, def=null) => {
  if (!ls) return def
  try { return JSON.parse(ls.getItem(k)) ?? def }
  catch { return def }
}
export const remove = k => ls?.removeItem(k)
