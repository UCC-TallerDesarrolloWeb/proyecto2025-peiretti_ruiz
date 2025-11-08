const delay = (ms) => new Promise(r => setTimeout(r, ms))
let items = [
  { id: 1, name: 'Towel', price: 10 },
  { id: 2, name: 'Umbrella', price: 15 },
]

export async function getItems() {
  await delay(300)
  return structuredClone(items)
}

export async function addItem(data) {
  await delay(300)
  const it = { id: Date.now(), ...data }
  items.push(it)
  return it
}

export async function updateItem(id, patch) {
  await delay(300)
  items = items.map(x => x.id === id ? { ...x, ...patch } : x)
  return items.find(x => x.id === id)
}

export async function deleteItem(id) {
  await delay(300)
  items = items.filter(x => x.id !== id)
  return { ok: true }
}
