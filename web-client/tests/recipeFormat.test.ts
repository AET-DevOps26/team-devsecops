import {formatQuantity} from '../src/recipeFormat'

describe('formatQuantity', () => {
	it('renders fractional values as glyphs and respects scaling', () => {
		expect(formatQuantity(0.5)).toBe('½')
		expect(formatQuantity(1.5)).toBe('1 ½')
		expect(formatQuantity(1, 0.5)).toBe('½')
		expect(formatQuantity(6.123)).toBe('6.12')
	})
})
