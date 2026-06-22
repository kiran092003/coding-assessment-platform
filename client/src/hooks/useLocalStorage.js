import { useState, useCallback } from 'react'

/**
 * A hook that syncs state with localStorage.
 * @template T
 * @param {string} key - The localStorage key.
 * @param {T} initialValue - The default value if nothing is stored.
 * @returns {[T, (value: T | ((prev: T) => T)) => void, () => void]}
 */
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item !== null ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  })

  const setValue = useCallback(
    (value) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value
        setStoredValue(valueToStore)
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      } catch (error) {
        console.warn(`useLocalStorage: failed to set "${key}"`, error)
      }
    },
    [key, storedValue],
  )

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key)
      setStoredValue(initialValue)
    } catch (error) {
      console.warn(`useLocalStorage: failed to remove "${key}"`, error)
    }
  }, [key, initialValue])

  return [storedValue, setValue, removeValue]
}

export default useLocalStorage
