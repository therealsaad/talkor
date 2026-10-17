import { isAuthorizedKGAlphabetStudent } from '../../src/services/kg-pilot-access'

describe('KG alphabet pilot authorization', () => {
  const id = '507f1f77bcf86cd799439011'
  it('permits only active Grade 0 profiles explicitly approved by a school admin', () => {
    expect(isAuthorizedKGAlphabetStudent({ id, grade: 0, status: 'active', kgAlphabetPilotEnabled: true }, [])).toBe(true)
    expect(isAuthorizedKGAlphabetStudent({ id, grade: 0, status: 'active' }, [])).toBe(false)
    expect(isAuthorizedKGAlphabetStudent({ id, grade: 4, status: 'active', kgAlphabetPilotEnabled: true }, [])).toBe(false)
    expect(isAuthorizedKGAlphabetStudent({ id, grade: 0, status: 'inactive', kgAlphabetPilotEnabled: true }, [])).toBe(false)
  })
  it('preserves the previous explicit pilot allowlist for backwards compatibility', () => {
    expect(isAuthorizedKGAlphabetStudent({ id, grade: 0, status: 'active' }, [id])).toBe(true)
    expect(isAuthorizedKGAlphabetStudent({ id, grade: 0, status: 'active' }, [])).toBe(false)
  })
})
