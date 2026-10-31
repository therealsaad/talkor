export type ClassroomPreviewAccessResult = {
  allowed: boolean
  reason:
    | 'loading'
    | 'student_blocked'
    | 'production_unauthenticated'
    | 'production_unauthorized'
    | 'authorized_staff'
    | 'authorized_dev'
  redirectUrl: string | null
}

/**
 * Authoritative access check for the classroom preview sandbox.
 * Enforces genuine server-verified staff authorization in production and
 * prevents student or anonymous users from interacting with the sandbox.
 */
export function checkClassroomPreviewAccess({
  status,
  role,
  isProduction = process.env.NODE_ENV === 'production',
}: {
  status: 'loading' | 'authenticated' | 'unauthenticated'
  role: 'SCHOOL_ADMIN' | 'TEACHER' | 'STUDENT' | string | null
  isProduction?: boolean
}): ClassroomPreviewAccessResult {
  // 1. Loading state: hold rendering until session verification settles
  if (status === 'loading') {
    return {
      allowed: false,
      reason: 'loading',
      redirectUrl: null,
    }
  }

  // 2. Student session: NEVER allowed in sandbox in ANY environment
  if (status === 'authenticated' && role === 'STUDENT') {
    return {
      allowed: false,
      reason: 'student_blocked',
      redirectUrl: '/student/continue',
    }
  }

  // 3. Staff session (Teacher or School Admin): Always authorized
  if (status === 'authenticated' && (role === 'TEACHER' || role === 'SCHOOL_ADMIN')) {
    return {
      allowed: true,
      reason: 'authorized_staff',
      redirectUrl: null,
    }
  }

  // 4. Production environment: Anonymous and non-staff sessions are strictly denied
  if (isProduction) {
    if (status === 'unauthenticated') {
      return {
        allowed: false,
        reason: 'production_unauthenticated',
        redirectUrl: '/login/school',
      }
    }
    return {
      allowed: false,
      reason: 'production_unauthorized',
      redirectUrl: '/login/school',
    }
  }

  // 5. Development environment: Non-student developers are authorized
  return {
    allowed: true,
    reason: 'authorized_dev',
    redirectUrl: null,
  }
}
