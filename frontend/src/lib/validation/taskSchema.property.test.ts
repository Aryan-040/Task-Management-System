/**
 * Property-based tests for taskFormSchema (client-side validation).
 * Uses fast-check to verify invariants across many generated inputs.
 *
 * Validates: Requirements 10.3, 10.4, 15.2
 */

import { describe, it } from 'vitest'
import * as fc from 'fast-check'
import { taskFormSchema } from './taskSchema'

// ---------------------------------------------------------------------------
// Shared arbitraries
// ---------------------------------------------------------------------------

/**
 * Generates whitespace-only strings (space, tab, newline, carriage return).
 * Uses fc.array + fc.constantFrom per fast-check v4 pattern (no fc.stringOf).
 */
const wsArb = fc
  .array(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 1, maxLength: 50 })
  .map(chars => chars.join(''))

/**
 * Valid YYYY-MM-DD dates in the range 2020–2030.
 */
const validDateArb = fc.date({
  min: new Date('2020-01-01'),
  max: new Date('2030-12-31'),
}).filter(d => !isNaN(d.getTime())).map(d => d.toISOString().slice(0, 10))

/**
 * Strings that are either not in YYYY-MM-DD format, or are impossible
 * calendar dates (e.g. Feb 30, month 13).
 */
const invalidDateArb = fc.oneof(
  fc.string().filter(s => !/^\d{4}-\d{2}-\d{2}$/.test(s)),
  fc.constantFrom('2025-02-30', '2025-13-01', '2025-00-01', '2025-04-31')
)

// ---------------------------------------------------------------------------
// Property 8 (client-side): Whitespace-Only Input Rejected
// Validates: Requirements 10.3
// ---------------------------------------------------------------------------

describe('Property 8 (client-side): Whitespace-Only Input Rejected', () => {
  it('whitespace-only title fails with title error (≥100 runs)', () => {
    fc.assert(
      fc.property(
        wsArb,
        fc.string({ minLength: 1 }).map(s => s.trim() || 'x'),
        (ws, desc) => {
          const r = taskFormSchema.safeParse({ title: ws, description: desc, status: 'pending', priority: 'medium' })
          if (r.success) return false
          return r.error.issues.some(e => e.path[0] === 'title')
        }
      ),
      { numRuns: 100 }
    )
  })

  it('whitespace-only description fails with description error (≥100 runs)', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).map(s => s.trim() || 'x'),
        wsArb,
        (title, ws) => {
          const r = taskFormSchema.safeParse({ title, description: ws, status: 'pending', priority: 'medium' })
          if (r.success) return false
          return r.error.issues.some(e => e.path[0] === 'description')
        }
      ),
      { numRuns: 100 }
    )
  })
})

// ---------------------------------------------------------------------------
// Property 10 (client-side): Invalid Calendar Dates Rejected
// Validates: Requirements 10.4
// ---------------------------------------------------------------------------

describe('Property 10 (client-side): Invalid Calendar Dates Rejected', () => {
  it('invalid dates fail taskFormSchema.dueDate (≥100 runs)', () => {
    fc.assert(
      fc.property(invalidDateArb, (bad) => {
        const r = taskFormSchema.safeParse({
          title: 'Valid', description: 'Valid',
          status: 'pending', priority: 'medium', dueDate: bad
        })
        return !r.success
      }),
      { numRuns: 100 }
    )
  })

  it('valid dates in 2020–2030 are accepted (≥100 runs)', () => {
    fc.assert(
      fc.property(validDateArb, (valid) => {
        const r = taskFormSchema.safeParse({
          title: 'Valid', description: 'Valid',
          status: 'pending', priority: 'medium', dueDate: valid
        })
        return r.success
      }),
      { numRuns: 100 }
    )
  })
})

// ---------------------------------------------------------------------------
// Additional: title/description length boundaries
// Validates: Requirements 15.2
// ---------------------------------------------------------------------------

describe('taskFormSchema length boundaries (additional property tests)', () => {
  it('titles of length 1–255 always pass', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 255 }).filter(s => s.trim().length > 0),
        (title) => {
          const r = taskFormSchema.safeParse({ title, description: 'x', status: 'pending', priority: 'medium' })
          return r.success
        }
      ),
      { numRuns: 100 }
    )
  })

  it('titles longer than 255 chars always fail', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 256, maxLength: 300 }),
        (title) => {
          const r = taskFormSchema.safeParse({ title, description: 'x', status: 'pending', priority: 'medium' })
          return !r.success
        }
      ),
      { numRuns: 100 }
    )
  })
})
