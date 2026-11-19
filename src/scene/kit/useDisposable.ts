import { useEffect, useMemo, type DependencyList } from 'react'

/**
 * `useMemo` for GPU resources: builds the object when `deps` change and disposes the old one.
 * A disposed geometry that is rendered again is simply re-uploaded, so StrictMode's
 * mount → unmount → mount cycle is safe.
 */
export function useDisposable<T extends { dispose: () => void }>(factory: () => T, deps: DependencyList): T {
  // oxlint-disable-next-line react/exhaustive-deps -- deps are supplied by the caller
  const value = useMemo(factory, deps)
  useEffect(() => () => value.dispose(), [value])
  return value
}
