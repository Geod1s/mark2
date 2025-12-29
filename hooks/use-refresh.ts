import { useCallback } from 'react'

export function useRefresh() {
  const refresh = useCallback(() => {
    window.location.reload()
  }, [])

  return { refresh }
}