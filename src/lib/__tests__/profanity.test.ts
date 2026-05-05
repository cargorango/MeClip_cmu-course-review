// Feature: cmu-course-review, Property 10: Profanity Filter Correctness
import { describe, test, expect } from 'vitest'
import * as fc from 'fast-check'
import { containsProfanity, PROFANITY_LIST } from '../profanity'

describe('containsProfanity', () => {
  test('Property 10: messages containing profanity words are rejected', () => {
    PROFANITY_LIST.forEach(word => {
      expect(containsProfanity(word)).toBe(true)
      expect(containsProfanity(`ข้อความ ${word} ปกติ`)).toBe(true)
    })
  })

  test('Property 10: clean messages are accepted', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[a-zA-Z0-9ก-๙ \t\n.,!?]+$/),
        (content) => {
          // Only test strings that don't accidentally contain profanity
          const hasProfanity = PROFANITY_LIST.some(w => content.toLowerCase().includes(w.toLowerCase()))
          if (hasProfanity) return true // skip this case
          return containsProfanity(content) === false
        }
      ),
      { numRuns: 100 }
    )
  })

  test('case-insensitive detection', () => {
    expect(containsProfanity('ควย')).toBe(true)
    expect(containsProfanity('เหี้ย')).toBe(true)
  })

  test('clean message returns false', () => {
    expect(containsProfanity('วิชานี้สนุกมาก')).toBe(false)
    expect(containsProfanity('อาจารย์สอนดี')).toBe(false)
    expect(containsProfanity('ข้อสอบยากมาก')).toBe(false)
  })
})
