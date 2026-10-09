/**
 * Property-based tests for server-side Zod validation schemas.
 * Uses fast-check to verify invariants across many generated inputs.
 *
 * Validates: Requirements 7.1, 7.2, 7.3, 7.4
 */

import { describe, it } from 'vitest'
import * as fc from 'fast-check'
import { CreateTaskSchema } from './taskSchemas'

// ---------------------------------------------------------------------------
// Property 8: Whitespace-Only Input Rejected by Server-Side Validator
// Validates: Requirements 7.1, 7.2
// ---------------------------------------------------------------------------

// fc.stringOf was removed in fast-check v4; build the equivalent with array + join
const whitespaceArb = fc
  .array(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 1, maxLength: 50 })
  .map(chars => chars.join(''))

describe('Property 8: Whitespace-Only Input Rejected', () => {
  it('whitespace-only title fails validation with a title field error', () => {
    fc.assert(
      fc.property(
        whitespaceArb,
        fc.string({ minLength: 1 }).map(s => s.trim() || 'x'),
        (ws, desc) => {
          const result = CreateTaskSchema.safeParse({ title: ws, description: desc })
          if (result.success) return false
          const fields = result.error.flatten().fieldErrors
          return !!fields.title?.length
        }
      )
    )
  })

  it('whitespace-only description fails validation with a description field error', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).map(s => s.trim() || 'x'),
        whitespaceArb,
        (title, ws) => {
          const result = CreateTaskSchema.safeParse({ title, description: ws })
          if (result.success) return false
          const fields = result.error.flatten().fieldErrors
          return !!fields.description?.length
        }
      )
    )
  })
})

// ---------------------------------------------------------------------------
// Property 9: Invalid Enum Values Rejected by Server-Side Validator
// Validates: Requirements 7.3, 7.4
// ---------------------------------------------------------------------------

const VALID_STATUSES = ['pending', 'in_progress', 'completed']
const VALID_PRIORITIES = ['low', 'medium', 'high']

const invalidStatusArb = fc.string().filter(s => !VALID_STATUSES.includes(s))
const invalidPriorityArb = fc.string().filter(s => !VALID_PRIORITIES.includes(s))

describe('Property 9: Invalid Enum Values Rejected', () => {
  it('invalid status fails with a status field error', () => {
    fc.assert(
      fc.property(invalidStatusArb, (badStatus) => {
        const result = CreateTaskSchema.safeParse({
          title: 'Valid',
          description: 'Valid',
          status: badStatus,
        })
        if (result.success) return false
        return !!result.error.flatten().fieldErrors.status?.length
      })
    )
  })

  it('invalid priority fails with a priority field error', () => {
    fc.assert(
      fc.property(invalidPriorityArb, (badPriority) => {
        const result = CreateTaskSchema.safeParse({
          title: 'Valid',
          description: 'Valid',
          priority: badPriority,
        })
        if (result.success) return false
        return !!result.error.flatten().fieldErrors.priority?.length
      })
    )
  })
})

// ---------------------------------------------------------------------------
// Property 10: Invalid Calendar Dates Rejected
// Validates: Requirements 7.5
// ---------------------------------------------------------------------------

// Use invalid date strings (wrong format and logically invalid like Feb 30, month 13)
// Also test that valid dates (2020-2030 range) are accepted
const VALID_DATE_ARB = fc.date({
  min: new Date('2020-01-01'),
  max: new Date('2030-12-31'),
}).filter(d => !isNaN(d.getTime())).map(d => d.toISOString().slice(0, 10))

const INVALID_DATE_ARB = fc.oneof(
  // Wrong format
  fc.string().filter(s => !/^\d{4}-\d{2}-\d{2}$/.test(s)),
  // Logically invalid calendar dates
  fc.constantFrom('2025-02-30', '2025-13-01', '2025-00-01', '2025-04-31', '2024-02-30')
)

describe('Property 10: Invalid Calendar Dates Rejected', () => {
  it('invalid date strings fail CreateTaskSchema.dueDate', () => {
    fc.assert(
      fc.property(INVALID_DATE_ARB, (badDate) => {
        const result = CreateTaskSchema.safeParse({
          title: 'Valid', description: 'Valid', dueDate: badDate
        })
        return !result.success
      })
    )
  })

  it('valid YYYY-MM-DD dates in range 2020-2030 are accepted', () => {
    fc.assert(
      fc.property(VALID_DATE_ARB, (validDate) => {
        const result = CreateTaskSchema.safeParse({
          title: 'Valid', description: 'Valid', dueDate: validDate
        })
        return result.success
      })
    )
  })
})

