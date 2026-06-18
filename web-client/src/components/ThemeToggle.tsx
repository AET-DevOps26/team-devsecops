import { useState } from 'react'
import type { ComponentType } from 'react'
import { useTranslation } from 'react-i18next'
import { MoonIcon, SunIcon } from '@heroicons/react/24/outline'
import { getThemeMode, setThemeMode, systemPrefersDark, THEME_MODES, useThemeMode, type ThemeMode } from '../theme'

// The heroicons crescent moon with a small "A" badge overlaid bottom-right
// (white-haloed so it stays legible) — signals the theme is set automatically.
function AutoThemeIcon({ className }: { className?: string }) {
	return (
		<svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
			<path
				d="M21.752 15.002A9.718 9.718 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<text
				x="19"
				y="10"
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fontFamily="Outfit, ui-sans-serif, system-ui, sans-serif"
				fill="currentColor"
				stroke="white"
				strokeWidth="0"
				strokeLinejoin="round"
				paintOrder="stroke"
			>
				A
			</text>
		</svg>
	)
}

const THEME_BUTTONS = {
	LIGHT: { labelKey: 'theme.light', Icon: SunIcon },
	AUTO: { labelKey: 'theme.auto', Icon: AutoThemeIcon },
	DARK: { labelKey: 'theme.dark', Icon: MoonIcon },
} as const satisfies Record<ThemeMode, { labelKey: string; Icon: ComponentType<{ className?: string }> }>

// Desktop: Light / Auto / Dark slider
export function ThemeSlider() {
	const { t } = useTranslation()
	const mode = useThemeMode()
	const activeIndex = THEME_MODES.indexOf(mode)

	return (
		<div className="relative flex rounded-lg bg-gray-100 p-1 dark:bg-neutral-800">
			<span
				aria-hidden
				className="pointer-events-none absolute inset-y-1 left-1 rounded-md bg-white shadow-sm transition-transform duration-200 ease-out dark:bg-neutral-700"
				style={{ width: 'calc((100% - 0.5rem) / 3)', transform: `translateX(${activeIndex * 100}%)` }}
			/>
			{THEME_MODES.map((value) => (
				<button
					key={value}
					type="button"
					aria-pressed={mode === value}
					onClick={() => setThemeMode(value)}
					className={`relative z-10 flex-1 rounded-md py-1 text-sm font-medium cursor-pointer transition-colors ${
						mode === value ? 'text-orange-600 dark:text-orange-400' : 'text-gray-500 dark:text-neutral-400'
					}`}
				>
					{t(THEME_BUTTONS[value].labelKey)}
				</button>
			))}
		</div>
	)
}

function themeCycle(mode: ThemeMode, systemDark: boolean): ThemeMode[] {
	if (mode === 'DARK' || systemDark) return ['LIGHT', 'AUTO', 'DARK']
	return ['DARK', 'AUTO', 'LIGHT']
}

// Mobile: single icon button that steps through the cycle above
export function ThemeIconToggle({ className = '' }: { className?: string }) {
	const { t } = useTranslation()
	const mode = useThemeMode()
	const [cycle] = useState(() => themeCycle(getThemeMode(), systemPrefersDark()))
	const [step, setStep] = useState(0)
	const target = cycle[step]
	const Icon = THEME_BUTTONS[mode].Icon

	return (
		<button
			type="button"
			onClick={() => {
				setThemeMode(target)
				setStep((s) => (s + 1) % cycle.length)
			}}
			aria-label={t('theme.switchTo', { mode: t(THEME_BUTTONS[target].labelKey) })}
			title={t(THEME_BUTTONS[mode].labelKey)}
			className={`flex h-9 w-9 items-center justify-center rounded-full text-gray-500 cursor-pointer transition-transform duration-100 hover:scale-95 dark:text-neutral-400 ${className}`}
		>
			<Icon className="h-6 w-6" />
		</button>
	)
}
