// Feature: thai-faculty-performance
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { translateFacultyName, FACULTY_TRANSLATION_MAP, type Lang } from '../faculty-translation'

// ─── Unit Tests ───────────────────────────────────────────────────────────────

describe('FACULTY_TRANSLATION_MAP', () => {
  it('contains exactly 28 entries', () => {
    expect(Object.keys(FACULTY_TRANSLATION_MAP)).toHaveLength(28)
  })

  it('maps Faculty of Engineering to the correct Thai name', () => {
    expect(FACULTY_TRANSLATION_MAP['Faculty of Engineering']).toBe('คณะวิศวกรรมศาสตร์')
  })

  it('maps Faculty of Medicine to the correct Thai name', () => {
    expect(FACULTY_TRANSLATION_MAP['Faculty of Medicine']).toBe('คณะแพทยศาสตร์')
  })

  it('maps College of Arts, Media and Technology to the correct Thai name', () => {
    expect(FACULTY_TRANSLATION_MAP['College of Arts, Media and Technology']).toBe(
      'วิทยาลัยศิลปะ สื่อ และเทคโนโลยี'
    )
  })
})

describe('translateFacultyName', () => {
  // ── Edge cases: empty / falsy inputs ──────────────────────────────────────

  it('returns empty string for empty string input (th)', () => {
    expect(translateFacultyName('', 'th')).toBe('')
  })

  it('returns empty string for empty string input (en)', () => {
    expect(translateFacultyName('', 'en')).toBe('')
  })

  // TypeScript types prevent null/undefined at compile time, but we guard at
  // runtime too — cast to test the defensive path.
  it('returns empty string for null input (runtime guard)', () => {
    expect(translateFacultyName(null as unknown as string, 'th')).toBe('')
  })

  it('returns empty string for undefined input (runtime guard)', () => {
    expect(translateFacultyName(undefined as unknown as string, 'en')).toBe('')
  })

  // ── English mode ──────────────────────────────────────────────────────────

  it('returns original name unchanged in English mode for a known faculty', () => {
    expect(translateFacultyName('Faculty of Science', 'en')).toBe('Faculty of Science')
  })

  it('returns original name unchanged in English mode for an unknown faculty', () => {
    expect(translateFacultyName('Unknown Faculty', 'en')).toBe('Unknown Faculty')
  })

  // ── Thai mode: known names ────────────────────────────────────────────────

  it('returns Thai name for Faculty of Science in Thai mode', () => {
    expect(translateFacultyName('Faculty of Science', 'th')).toBe('คณะวิทยาศาสตร์')
  })

  it('returns Thai name for Faculty of Engineering in Thai mode', () => {
    expect(translateFacultyName('Faculty of Engineering', 'th')).toBe('คณะวิศวกรรมศาสตร์')
  })

  it('returns Thai name for School of Public Policy in Thai mode', () => {
    expect(translateFacultyName('School of Public Policy', 'th')).toBe(
      'วิทยาลัยนโยบายสาธารณะและรัฐกิจ'
    )
  })

  // ── Thai mode: unknown names (fallback) ───────────────────────────────────

  it('returns original name as fallback for unknown faculty in Thai mode', () => {
    expect(translateFacultyName('Unknown Faculty', 'th')).toBe('Unknown Faculty')
  })

  it('returns original name as fallback for arbitrary string not in map', () => {
    expect(translateFacultyName('Some Random Department', 'th')).toBe('Some Random Department')
  })
})

// ─── Property-Based Tests ─────────────────────────────────────────────────────

describe('Property 1: Thai translation returns correct mapped name', () => {
  /**
   * Validates: Requirements 1.1, 2.1, 3.1
   *
   * For any faculty name that exists as a key in FACULTY_TRANSLATION_MAP,
   * translateFacultyName(name, 'th') SHALL return the corresponding Thai value.
   */
  it('Property 1: translateFacultyName(name, "th") === FACULTY_TRANSLATION_MAP[name] for all map keys', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(FACULTY_TRANSLATION_MAP)),
        (name) => {
          expect(translateFacultyName(name, 'th')).toBe(FACULTY_TRANSLATION_MAP[name])
        }
      ),
      { numRuns: 100 }
    )
  })
})

describe('Property 2: English mode returns original name unchanged', () => {
  /**
   * Validates: Requirements 1.2, 2.2, 3.2
   *
   * For any faculty name string, translateFacultyName(name, 'en') SHALL return
   * the original name unchanged (identity function for English).
   */
  it('Property 2: translateFacultyName(name, "en") === name for any non-empty string', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        (name) => {
          expect(translateFacultyName(name, 'en')).toBe(name)
        }
      ),
      { numRuns: 100 }
    )
  })
})

describe('Property 3: Unknown name fallback returns original name', () => {
  /**
   * Validates: Requirements 1.3, 2.2, 3.2
   *
   * For any string that is NOT a key in FACULTY_TRANSLATION_MAP,
   * translateFacultyName(name, 'th') SHALL return the original name unchanged.
   */
  it('Property 3: translateFacultyName(name, "th") === name for names not in map', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }).filter((s) => !(s in FACULTY_TRANSLATION_MAP)),
        (name) => {
          expect(translateFacultyName(name, 'th')).toBe(name)
        }
      ),
      { numRuns: 100 }
    )
  })
})
