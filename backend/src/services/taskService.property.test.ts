/**
 * Property-based tests for TaskService.
 * Uses fast-check to verify invariants across many generated inputs.
 *
 * Validates: Requirements 4.2, 4.3, 4.4, 4.5, 4.6
 */

import { describe, it } from 'vitest'
import * as fc from 'fast-check'
import { createTaskRepository } from '../repositories/taskRepository'
import { createTaskService } from './taskService'
import type { Task } from '../types'

// ---------------------------------------------------------------------------
// Shared arbitraries
// ---------------------------------------------------------------------------

const taskDtoArb = fc.record({
  title: fc.string({ minLength: 1, maxLength: 40 }).map(s => s.trim() || 'title'),
  description: fc.string({ minLength: 1, maxLength: 80 }).map(s => s.trim() || 'desc'),
  status: fc.constantFrom('pending' as const, 'in_progress' as const, 'completed' as const),
  priority: fc.constantFrom('low' as const, 'medium' as const, 'high' as const),
})

// ---------------------------------------------------------------------------
// Property 4: Search Filter Correctness
// Validates: Requirements 4.2
// ---------------------------------------------------------------------------

describe('Property 4: Search Filter Correctness', () => {
  it('every returned task matches the search term (title or description)', () => {
    fc.assert(
      fc.property(
        fc.array(taskDtoArb, { minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 10 }).map(s => s.trim() || 'x'),
        (dtos, search) => {
          const repo = createTaskRepository([])
          const service = createTaskService(repo)
          dtos.forEach(dto => service.createTask(dto))
          const { data } = service.listTasks({ search })
          const q = search.toLowerCase()
          return data.every(t =>
            t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
          )
        }
      )
    )
  })

  it('no matching task is absent from the result', () => {
    fc.assert(
      fc.property(
        fc.array(taskDtoArb, { minLength: 1, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 10 }).map(s => s.trim() || 'x'),
        (dtos, search) => {
          const repo = createTaskRepository([])
          const service = createTaskService(repo)
          const all = dtos.map(dto => service.createTask(dto))
          const q = search.toLowerCase()
          const expected = all.filter(t =>
            t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
          )
          const { data } = service.listTasks({ search, pageSize: 1000 })
          const resultIds = new Set(data.map((t: Task) => t.id))
          return expected.every(t => resultIds.has(t.id))
        }
      )
    )
  })
})

// ---------------------------------------------------------------------------
// Property 5: Status and Priority Filter Correctness
// Validates: Requirements 4.3, 4.4
// ---------------------------------------------------------------------------

describe('Property 5: Status and Priority Filter Correctness', () => {
  it('status filter returns only tasks with matching status', () => {
    fc.assert(
      fc.property(
        fc.array(taskDtoArb, { minLength: 1, maxLength: 20 }),
        fc.constantFrom('pending' as const, 'in_progress' as const, 'completed' as const),
        (dtos, status) => {
          const repo = createTaskRepository([])
          const service = createTaskService(repo)
          dtos.forEach(dto => service.createTask(dto))
          const { data } = service.listTasks({ status, pageSize: 1000 })
          return data.every(t => t.status === status)
        }
      )
    )
  })

  it('priority filter returns only tasks with matching priority', () => {
    fc.assert(
      fc.property(
        fc.array(taskDtoArb, { minLength: 1, maxLength: 20 }),
        fc.constantFrom('low' as const, 'medium' as const, 'high' as const),
        (dtos, priority) => {
          const repo = createTaskRepository([])
          const service = createTaskService(repo)
          dtos.forEach(dto => service.createTask(dto))
          const { data } = service.listTasks({ priority, pageSize: 1000 })
          return data.every(t => t.priority === priority)
        }
      )
    )
  })
})

// ---------------------------------------------------------------------------
// Property 6: Sort Ordering Invariant
// Validates: Requirements 4.5, 4.6
// ---------------------------------------------------------------------------

describe('Property 6: Sort Ordering Invariant', () => {
  const SORT_FIELDS = ['createdAt', 'priority', 'title'] as const
  const SORT_ORDERS = ['asc', 'desc'] as const

  it('adjacent pairs satisfy the expected ordering for all sortBy/sortOrder combinations', () => {
    const PRIORITY_W = { low: 0, medium: 1, high: 2 } as const
    fc.assert(
      fc.property(
        fc.array(taskDtoArb, { minLength: 2, maxLength: 15 }),
        fc.constantFrom(...SORT_FIELDS),
        fc.constantFrom(...SORT_ORDERS),
        (dtos, sortBy, sortOrder) => {
          const repo = createTaskRepository([])
          const service = createTaskService(repo)
          dtos.forEach(dto => service.createTask(dto))
          const { data } = service.listTasks({ sortBy, sortOrder, pageSize: 1000 })
          const dir = sortOrder === 'asc' ? 1 : -1

          for (let i = 0; i < data.length - 1; i++) {
            const a = data[i]
            const b = data[i + 1]
            let cmp = 0
            if (sortBy === 'priority') {
              cmp = (PRIORITY_W[a.priority] - PRIORITY_W[b.priority]) * dir
            } else if (sortBy === 'title') {
              // Match the service's case-insensitive Unicode code-point comparison
              // (not locale-aware localeCompare, which differs for punctuation/symbols)
              const aTitle = a.title.toLowerCase()
              const bTitle = b.title.toLowerCase()
              cmp = (aTitle < bTitle ? -1 : aTitle > bTitle ? 1 : 0) * dir
            } else {
              // ISO 8601 strings sort correctly with Unicode comparison
              cmp = (a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0) * dir
            }
            if (cmp > 0) return false
          }
          return true
        }
      )
    )
  })
})

// ---------------------------------------------------------------------------
// Property 7: Pagination Slice Correctness
// Validates: Requirements 4.7
// ---------------------------------------------------------------------------

describe('Property 7: Pagination Slice Correctness', () => {
  it('data slice matches pre-pagination positions; total equals pre-pagination count', () => {
    fc.assert(
      fc.property(
        fc.array(taskDtoArb, { minLength: 2, maxLength: 30 }),
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 1, max: 10 }),
        (dtos, page, pageSize) => {
          const repo = createTaskRepository([])
          const service = createTaskService(repo)
          dtos.forEach(dto => service.createTask(dto))

          // Get all results without pagination
          const all = service.listTasks({ pageSize: 1000 })
          // Get paginated results
          const paginated = service.listTasks({ page, pageSize })

          // total must equal pre-pagination count
          if (paginated.total !== all.total) return false
          // echoed page/pageSize must match request
          if (paginated.page !== page || paginated.pageSize !== pageSize) return false

          const start = (page - 1) * pageSize
          const end = start + pageSize
          const expectedSlice = all.data.slice(start, end)

          // data must match the slice of the full result set
          if (paginated.data.length !== expectedSlice.length) return false
          return paginated.data.every((t: Task, i: number) => t.id === expectedSlice[i].id)
        }
      )
    )
  })
})

// ---------------------------------------------------------------------------
// Property 12: Composed Filters Satisfy All Active Criteria
// Validates: Requirements 4.2, 4.3, 4.4
// ---------------------------------------------------------------------------

describe('Property 12: Composed Filters Satisfy All Active Criteria', () => {
  it('every returned task satisfies all active search/status/priority criteria simultaneously', () => {
    const optSearchArb = fc.option(
      fc.string({ minLength: 1, maxLength: 8 }).map(s => s.trim() || 'x'),
      { nil: undefined }
    )
    const optStatusArb = fc.option(
      fc.constantFrom('pending' as const, 'in_progress' as const, 'completed' as const),
      { nil: undefined }
    )
    const optPriorityArb = fc.option(
      fc.constantFrom('low' as const, 'medium' as const, 'high' as const),
      { nil: undefined }
    )
    fc.assert(
      fc.property(
        fc.array(taskDtoArb, { minLength: 1, maxLength: 20 }),
        optSearchArb, optStatusArb, optPriorityArb,
        (dtos, search, status, priority) => {
          const repo = createTaskRepository([])
          const service = createTaskService(repo)
          dtos.forEach(dto => service.createTask(dto))
          const { data } = service.listTasks({ search, status, priority, pageSize: 1000 })

          return data.every((t: Task) => {
            if (search) {
              const q = search.toLowerCase()
              if (!t.title.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q)) return false
            }
            if (status && t.status !== status) return false
            if (priority && t.priority !== priority) return false
            return true
          })
        }
      )
    )
  })
})
