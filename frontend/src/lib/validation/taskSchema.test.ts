import { describe, it, expect } from 'vitest'
import { taskFormSchema } from './taskSchema'

// A fully valid base object – individual tests override only the field under test
const validBase = {
  title: 'Test Task',
  description: 'Test description',
  status: 'pending' as const,
  priority: 'medium' as const,
  dueDate: '2025-01-15',
}

// ---------------------------------------------------------------------------
// Title validation
// ---------------------------------------------------------------------------
describe('taskFormSchema – title', () => {
  it('fails when title is empty', () => {
    const result = taskFormSchema.safeParse({ ...validBase, title: '' })
    expect(result.success).toBe(false)
  })

  it('fails when title is whitespace-only', () => {
    const result = taskFormSchema.safeParse({ ...validBase, title: '   ' })
    expect(result.success).toBe(false)
  })

  it('passes when title is exactly 255 characters', () => {
    const result = taskFormSchema.safeParse({ ...validBase, title: 'a'.repeat(255) })
    expect(result.success).toBe(true)
  })

  it('fails when title is 256 characters', () => {
    const result = taskFormSchema.safeParse({ ...validBase, title: 'a'.repeat(256) })
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Description validation
// ---------------------------------------------------------------------------
describe('taskFormSchema – description', () => {
  it('fails when description is empty', () => {
    const result = taskFormSchema.safeParse({ ...validBase, description: '' })
    expect(result.success).toBe(false)
  })

  it('fails when description is whitespace-only', () => {
    const result = taskFormSchema.safeParse({ ...validBase, description: '   ' })
    expect(result.success).toBe(false)
  })

  it('passes when description is exactly 1000 characters', () => {
    const result = taskFormSchema.safeParse({ ...validBase, description: 'a'.repeat(1000) })
    expect(result.success).toBe(true)
  })

  it('fails when description is 1001 characters', () => {
    const result = taskFormSchema.safeParse({ ...validBase, description: 'a'.repeat(1001) })
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Status enum validation
// ---------------------------------------------------------------------------
describe('taskFormSchema – status', () => {
  it.each(['pending', 'in_progress', 'completed'])('passes for valid status "%s"', (status) => {
    const result = taskFormSchema.safeParse({ ...validBase, status })
    expect(result.success).toBe(true)
  })

  it.each(['PENDING', 'invalid', 'done'])('fails for invalid status "%s"', (status) => {
    const result = taskFormSchema.safeParse({ ...validBase, status })
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Priority enum validation
// ---------------------------------------------------------------------------
describe('taskFormSchema – priority', () => {
  it.each(['low', 'medium', 'high'])('passes for valid priority "%s"', (priority) => {
    const result = taskFormSchema.safeParse({ ...validBase, priority })
    expect(result.success).toBe(true)
  })

  it.each(['LOW', 'critical', ''])('fails for invalid priority "%s"', (priority) => {
    const result = taskFormSchema.safeParse({ ...validBase, priority })
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Due date validation
// ---------------------------------------------------------------------------
describe('taskFormSchema – dueDate', () => {
  it('passes for a valid date "2025-01-15"', () => {
    const result = taskFormSchema.safeParse({ ...validBase, dueDate: '2025-01-15' })
    expect(result.success).toBe(true)
  })

  it('passes for a valid date "2025-02-28"', () => {
    const result = taskFormSchema.safeParse({ ...validBase, dueDate: '2025-02-28' })
    expect(result.success).toBe(true)
  })

  it('fails for "2025-02-30" (Feb does not have 30 days)', () => {
    const result = taskFormSchema.safeParse({ ...validBase, dueDate: '2025-02-30' })
    expect(result.success).toBe(false)
  })

  it('fails for "2025-13-01" (month 13 does not exist)', () => {
    const result = taskFormSchema.safeParse({ ...validBase, dueDate: '2025-13-01' })
    expect(result.success).toBe(false)
  })

  it('fails for "2025-00-01" (month 0 does not exist)', () => {
    const result = taskFormSchema.safeParse({ ...validBase, dueDate: '2025-00-01' })
    expect(result.success).toBe(false)
  })

  it('fails for "not-a-date" (wrong format)', () => {
    const result = taskFormSchema.safeParse({ ...validBase, dueDate: 'not-a-date' })
    expect(result.success).toBe(false)
  })

  it('passes when dueDate is null (nullable)', () => {
    const result = taskFormSchema.safeParse({ ...validBase, dueDate: null })
    expect(result.success).toBe(true)
  })

  it('passes when dueDate is undefined (optional)', () => {
    const { dueDate: _omit, ...withoutDueDate } = validBase
    const result = taskFormSchema.safeParse(withoutDueDate)
    expect(result.success).toBe(true)
  })
})
