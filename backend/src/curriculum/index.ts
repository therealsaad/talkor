/** Explicit grade mapping prevents one class from silently inheriting another class's lessons. */
import { lessons as grade0 } from './kg/lessons'
import { lessons as grade1 } from './class-1/lessons'
import { lessons as grade2 } from './class-2/lessons'
import { lessons as grade3 } from './class-3/lessons'
import { lessons as grade5 } from './class-5/lessons'
import { lessons as grade6 } from './class-6/lessons'
import { lessons as grade7 } from './class-7/lessons'
import { lessons as grade8 } from './class-8/lessons'
import { lessons as grade9 } from './class-9/lessons'
import { lessons as grade10 } from './class-10/lessons'
import type { StarterUnit } from './types'

export const starters: Readonly<Partial<Record<number, readonly StarterUnit[]>>> = {
  0: grade0,
  1: grade1,
  2: grade2,
  3: grade3,
  5: grade5,
  6: grade6,
  7: grade7,
  8: grade8,
  9: grade9,
  10: grade10,
}
