/**
 * Property-based tests for the in-memory task repository.
 * Uses fast-check to verify invariants across many generated inputs.
 *
 * Validates: Requirements 2.2, 2.3, 2.4, 2.5
 */

import { describe, it } from 'vitest'
import * as fc from 'fast-check'
import { createTaskRepository } from './taskRepository'
import type { CreateTaskDto } from '../types'

// ---------------------------------------------------------------------------
// Arbitrary: valid CreateTaskDto
// ---------------------------------------------------------------------------

const createDtoArb: fc.Arbitrary<CreateTaskDto> = fc.record({
  title: fc.string({ minLength: 1, maxLength: 50 }).map(s => s.trim() || 'x'),
  description: fc.string({ minLength: 1, maxLength: 100 }).map(s => s.trim() || 'x'),
  status: fc.constantFrom('pending' as const, 'in_progress' as const, 'completed' as const),
  priority: fc.constantFrom('low' as const, 'medium' as const, 'high' as const),
})

// ---------------------------------------------------------------------------
// Property 1: Task ID Uniqueness
// Validates: Requirements 2.2
// ---------------------------------------------------------------------------

describe('Property 1: Task ID Uniqueness', () => {
  it('all created task IDs are pairwise distinct', () => {
    fc.assert(
      fc.property(fc.array(createDtoArb, { minLength: 1, maxLength: 50 }), (dtos) => {
        const repo = createTaskRepository([])
        const tasks = dtos.map(dto => repo.create(dto))
        const ids = tasks.map(t => t.id)
        const uniqueIds = new Set(ids)
        return uniqueIds.size === ids.length
      })
    )
  })
})

// ---------------------------------------------------------------------------
// Property 2: Timestamp Invariant
// Validates: Requirements 2.3, 2.4
// ---------------------------------------------------------------------------

describe('Property 2: Timestamp Invariant', () => {
  it('createdAt === updatedAt immediately after create', () => {
    fc.assert(
      fc.property(createDtoArb, (dto) => {
        const repo = createTaskRepository([])
        const task = repo.create(dto)
        return task.createdAt === task.updatedAt
      })
    )
  })

  it('after update: updatedAt >= createdAt and updatedAt >= previous updatedAt', () => {
    fc.assert(
      fc.property(createDtoArb, (dto) => {
        const repo = createTaskRepository([])
        const created = repo.create(dto)
        const before = created.updatedAt
        const updated = repo.update(created.id, {
          title: 'Updated',
          description: 'Updated',
          status: 'completed',
          priority: 'high',
        })!
        return updated.updatedAt >= created.createdAt && updated.updatedAt >= before
      })
    )
  })
})

// ---------------------------------------------------------------------------
// Property 3: Server-Generated Fields Override Client-Supplied Values
// Validates: Requirements 2.5
// ---------------------------------------------------------------------------

describe('Property 3: Server-Generated Fields Override Client-Supplied Values', () => {
  it('server always generates its own id, createdAt, updatedAt ignoring client values', () => {
    const clientFieldsArb = fc.record({
      id: fc.string({ minLength: 1, maxLength: 128 }),
      createdAt: fc.string(),
      updatedAt: fc.string(),
    })
    fc.assert(
      fc.property(createDtoArb, clientFieldsArb, (dto, clientFields) => {
        const repo = createTaskRepository([])
        const task = repo.create({ ...dto, ...clientFields } as any)
        return (
          task.id !== clientFields.id &&
          task.createdAt !== clientFields.createdAt &&
          task.updatedAt !== clientFields.updatedAt
        )
      })
    )
  })
})

// ---------------------------------------------------------------------------
// Property 11: Stored Strings Are Always Trimmed
// Validates: Requirements 7.7
// ---------------------------------------------------------------------------

import { createTaskService } from '../services/taskService'

describe('Property 11: Stored Strings Are Always Trimmed', () => {
  it('task.title equals input.title.trim() regardless of surrounding whitespace', () => {
    const wsArb = fc.array(fc.constantFrom(' ', '\t', '\n'), { minLength: 0, maxLength: 5 }).map(a => a.join(''))
    const coreStringArb = fc.string({ minLength: 1, maxLength: 30 }).map(s => s.trim() || 'x')
    fc.assert(
      fc.property(wsArb, coreStringArb, wsArb, coreStringArb, wsArb, wsArb, (pre1, core1, suf1, core2, pre2, suf2) => {
        const title = pre1 + core1 + suf1
        const description = pre2 + core2 + suf2
        const repo = createTaskRepository([])
        const service = createTaskService(repo)
        const task = service.createTask({ title, description })
        return task.title === title.trim() && task.description === description.trim()
      })
    )
  })
})
