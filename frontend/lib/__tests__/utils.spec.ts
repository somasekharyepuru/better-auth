/**
 * lib/utils Tests
 *
 * Tests for utility functions: cn, getInitials, getAvatarFallback
 */

import { cn, getInitials, getAvatarFallback } from '../utils'

describe('cn (className utility)', () => {
    it('merges class names', () => {
        expect(cn('foo', 'bar')).toBe('foo bar')
    })

    it('handles conditional classes', () => {
        expect(cn('base', true && 'active')).toBe('base active')
        expect(cn('base', false && 'inactive')).toBe('base')
    })

    it('handles arrays', () => {
        expect(cn(['foo', 'bar'])).toBe('foo bar')
    })

    it('merges tailwind classes correctly', () => {
        expect(cn('p-4', 'p-2')).toBe('p-2')
        expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
    })

    it('handles undefined and null', () => {
        expect(cn('base', undefined, null, 'valid')).toBe('base valid')
    })

    it('handles empty string', () => {
        expect(cn('', 'foo')).toBe('foo')
    })
})

describe('getInitials', () => {
    describe('with names', () => {
        it('returns initials for single name', () => {
            expect(getInitials('John')).toBe('J')
        })

        it('returns initials for full name', () => {
            expect(getInitials('John Doe')).toBe('JD')
        })

        it('returns initials for name with multiple parts', () => {
            expect(getInitials('John Michael Doe')).toBe('JM')
        })

        it('respects maxLength parameter', () => {
            expect(getInitials('John Doe', 1)).toBe('J')
            expect(getInitials('John Michael Doe', 3)).toBe('JMD')
        })

        it('handles lowercase names', () => {
            expect(getInitials('john doe')).toBe('JD')
        })
    })

    describe('with edge cases', () => {
        it('returns "U" for null', () => {
            expect(getInitials(null)).toBe('U')
        })

        it('returns "U" for undefined', () => {
            expect(getInitials(undefined)).toBe('U')
        })

        it('returns "U" for empty string', () => {
            expect(getInitials('')).toBe('U')
        })

        it('handles whitespace', () => {
            expect(getInitials('  John  Doe  ')).toBe('JD')
        })
    })
})

describe('getAvatarFallback', () => {
    it('uses name when provided', () => {
        expect(getAvatarFallback('John Doe', 'john@example.com')).toBe('JD')
    })

    it('uses email when name is null', () => {
        expect(getAvatarFallback(null, 'john@example.com')).toBe('J')
    })

    it('uses email when name is undefined', () => {
        expect(getAvatarFallback(undefined, 'jane@example.com')).toBe('J')
    })

    it('returns "U" when both are null', () => {
        expect(getAvatarFallback(null, null)).toBe('U')
    })

    it('returns "U" when both are undefined', () => {
        expect(getAvatarFallback(undefined, undefined)).toBe('U')
    })

    it('respects maxLength parameter', () => {
        expect(getAvatarFallback('John Doe', null, 1)).toBe('J')
        expect(getAvatarFallback('John Michael Doe', null, 3)).toBe('JMD')
    })

    it('prefers name over email', () => {
        expect(getAvatarFallback('Jane', 'different@example.com')).toBe('J')
    })
})
