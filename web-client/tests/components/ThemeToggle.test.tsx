import { beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeIconToggle, ThemeSlider } from '../../src/components/ThemeToggle'
import { setThemeMode } from '../../src/theme'

const isDark = () => document.documentElement.classList.contains('dark')

beforeEach(() => {
	setThemeMode('AUTO')
})

afterEach(() => {
	document.documentElement.className = ''
})

describe('ThemeSlider', () => {
	it('renders the three modes with AUTO active by default', () => {
		render(<ThemeSlider />)

		expect(screen.getByRole('button', { name: 'Light' })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Dark' })).toBeInTheDocument()
		const auto = screen.getByRole('button', { name: 'Auto' })
		expect(auto).toHaveAttribute('aria-pressed', 'true')
	})

	it('selects a mode on click and updates the dark class', async () => {
		const user = userEvent.setup()
		render(<ThemeSlider />)

		await user.click(screen.getByRole('button', { name: 'Dark' }))
		expect(screen.getByRole('button', { name: 'Dark' })).toHaveAttribute('aria-pressed', 'true')
		expect(screen.getByRole('button', { name: 'Auto' })).toHaveAttribute('aria-pressed', 'false')
		expect(isDark()).toBe(true)

		await user.click(screen.getByRole('button', { name: 'Light' }))
		expect(screen.getByRole('button', { name: 'Light' })).toHaveAttribute('aria-pressed', 'true')
		expect(isDark()).toBe(false)
	})
})

describe('ThemeIconToggle', () => {
	it('steps through dark, auto, then light on a light system', async () => {
		const user = userEvent.setup()
		render(<ThemeIconToggle />)

		// auto theme
		const button = screen.getByRole('button', { name: 'Switch to Dark theme' })
		expect(button).toHaveAttribute('title', 'Auto')
		await user.click(button)

		// dark theme
		expect(isDark()).toBe(true)
		const afterDark = screen.getByRole('button')
		expect(afterDark).toHaveAttribute('aria-label', 'Switch to Auto theme')
		expect(afterDark).toHaveAttribute('title', 'Dark')
		await user.click(afterDark)

		// auto theme
		expect(isDark()).toBe(false)
		const afterAuto = screen.getByRole('button')
		expect(afterAuto).toHaveAttribute('aria-label', 'Switch to Light theme')
		expect(afterAuto).toHaveAttribute('title', 'Auto')
		await user.click(afterAuto)

		// light theme
		expect(isDark()).toBe(false)
		expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Switch to Dark theme')
	})
})
