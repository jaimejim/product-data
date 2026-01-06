import type { AnalysisData } from './types'

export interface HistoryItem {
  id: string
  timestamp: number
  data: AnalysisData
  product_id?: number
}

const HISTORY_KEY = 'analyzer_history'
const MAX_HISTORY_ITEMS = 50

export function getHistory(): HistoryItem[] {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem(HISTORY_KEY)
    if (!stored) return []
    return JSON.parse(stored)
  } catch (error) {
    console.error('Failed to load history:', error)
    return []
  }
}

export function addToHistory(data: AnalysisData, product_id?: number): void {
  if (typeof window === 'undefined') return

  try {
    const history = getHistory()

    // Check if product already exists in history (by product name and brand)
    const existingIndex = history.findIndex(
      (item) =>
        item.data.product_name &&
        item.data.product_name === data.product_name &&
        item.data.brand === data.brand
    )

    const newItem: HistoryItem = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      data,
      product_id,
    }

    // If exists, remove old entry
    if (existingIndex !== -1) {
      history.splice(existingIndex, 1)
    }

    // Add to beginning
    history.unshift(newItem)

    // Limit to MAX_HISTORY_ITEMS
    const trimmed = history.slice(0, MAX_HISTORY_ITEMS)

    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed))
  } catch (error) {
    console.error('Failed to save to history:', error)
  }
}

export function removeFromHistory(id: string): void {
  if (typeof window === 'undefined') return

  try {
    const history = getHistory()
    const filtered = history.filter((item) => item.id !== id)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered))
  } catch (error) {
    console.error('Failed to remove from history:', error)
  }
}

export function clearHistory(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(HISTORY_KEY)
  } catch (error) {
    console.error('Failed to clear history:', error)
  }
}

export function getHistoryStats(): { count: number; oldestTimestamp: number | null } {
  const history = getHistory()
  return {
    count: history.length,
    oldestTimestamp: history.length > 0 ? history[history.length - 1].timestamp : null,
  }
}
