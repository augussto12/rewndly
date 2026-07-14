import { useEffect, useRef, useState, type ImgHTMLAttributes } from 'react'

/**
 * <img> that fades in once the bitmap has loaded, so posters reveal smoothly over
 * their surface background instead of popping in. Relies on the caller's own
 * `transition` class (e.g. the poster's `transition duration-500`) to animate the opacity.
 */
export function FadeInImage({ className = '', onLoad, onError, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const [loaded, setLoaded] = useState(false)
  const ref = useRef<HTMLImageElement>(null)

  useEffect(() => {
    // Cached images may have finished loading before the onLoad handler attached.
    if (ref.current?.complete) {
      setLoaded(true)
    }
  }, [])

  return (
    <img
      ref={ref}
      {...props}
      onLoad={(event) => {
        setLoaded(true)
        onLoad?.(event)
      }}
      onError={(event) => {
        // Reveal even on error so a broken URL never leaves an invisible gap.
        setLoaded(true)
        onError?.(event)
      }}
      className={`${className} ${loaded ? 'opacity-100' : 'opacity-0'}`.trim()}
    />
  )
}
