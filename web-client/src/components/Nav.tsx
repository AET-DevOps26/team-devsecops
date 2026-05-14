import { useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { BoltIcon, BookOpenIcon, UserIcon } from '@heroicons/react/24/solid'

const items = [
  { to: '/generate', label: 'Generate', Icon: BoltIcon },
  { to: '/library', label: 'Library', Icon: BookOpenIcon },
  { to: '/profile', label: 'Profile', Icon: UserIcon },
]

export function Nav() {
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const [pill, setPill] = useState<CSSProperties>()
  const { pathname } = useLocation()

  const activeIndex = items.findIndex(
    ({ to }) => pathname === to || pathname.startsWith(to + '/'),
  )

  // Use the pixel values of the selected page in the navbar and put the pill exactly there (i.e. highlight the nav button)
  useLayoutEffect(() => {
    const place = () => {
      const el = linkRefs.current[activeIndex]
      setPill(
        el
          ? {
              left: el.offsetLeft,
              top: el.offsetTop,
              width: el.offsetWidth,
              height: el.offsetHeight,
            }
          : undefined,
      )
    }
    place()
    // the Outfit web font loads async (font-display: swap); re-measure once it's
    // ready so the pill isn't stuck on fallback-font metrics
    document.fonts.ready.then(place)
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [activeIndex])

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-gray-200 bg-white md:relative md:w-56 md:flex-col md:gap-1 md:border-t-0 md:border-r md:p-4">
      <span className="hidden px-3 pb-4 text-xl font-bold md:block">Cooking Assistant</span>
      {pill && (
        <span
          className="pointer-events-none absolute rounded-lg bg-orange-50 transition-all duration-200 ease-out"
          style={pill}
        />
      )}
      {items.map(({ to, label, Icon }, i) => (
        <NavLink
          key={to}
          to={to}
          ref={(el) => {
            linkRefs.current[i] = el
          }}
          className={({ isActive }) =>
            `relative z-10 flex flex-1 flex-col items-center gap-1 py-2 text-xs md:flex-none md:flex-row md:gap-3 md:rounded-lg md:px-3 md:py-2 md:text-sm ${
              isActive
                ? 'text-orange-600'
                : 'text-gray-500 md:hover:bg-gray-100'
            }`
          }
        >
          <Icon className="h-6 w-6" />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
