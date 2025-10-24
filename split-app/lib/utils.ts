import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Split storage utilities
export interface SplitRecipient {
  addr: string
  bps: number
}

export interface SplitConfig {
  recipients: SplitRecipient[]
  updatedAt: number
}

export function getSplitKey(chainId: number, address: string): string {
  return `split:${chainId}:${address.toLowerCase()}`
}

export function saveSplitToStorage(key: string, data: SplitConfig): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (e) {
    console.error('Failed to save split to localStorage:', e)
  }
}

export function loadSplitFromStorage(key: string): SplitConfig | null {
  if (typeof window === 'undefined') return null
  try {
    const item = localStorage.getItem(key)
    if (!item) return null
    return JSON.parse(item)
  } catch (e) {
    console.error('Failed to load split from localStorage:', e)
    return null
  }
}
