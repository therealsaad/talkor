type StudentActivity = {
  type?: string
  title?: string
  prompt?: string
  instruction?: string
  choices?: string[]
  content?: Record<string, unknown>
}

export function isMissingKGPilotPicture(activity: StudentActivity): boolean {
  if (activity.type !== 'PICTURE_CHOICE' || activity.content?.pictureMode !== true) return false
  const asset = activity.content?.pictureAsset
  if (!asset || typeof asset !== 'object' || (asset as { status?: unknown }).status !== 'READY') return true

  const options = activity.content.pictureOptions
  if (!Array.isArray(options) || options.length < 2 || !activity.choices?.length || options.length !== activity.choices.length) return true
  return options.some((item, index) => {
    if (!item || typeof item !== 'object') return true
    const option = item as { word?: unknown; assetKey?: unknown; status?: unknown }
    return option.word !== activity.choices?.[index] || typeof option.assetKey !== 'string' || option.status !== 'READY'
  })
}

/** Never render or complete a KG picture task unless every referenced choice has a verified asset. */
export function presentKGPilotActivity<T extends StudentActivity>(activity: T): T {
  if (!isMissingKGPilotPicture(activity)) return activity

  const notice = 'Picture not available. This picture task is skipped and does not count as completed.'
  return {
    ...activity,
    title: 'Picture activity unavailable',
    prompt: 'The picture is not available yet. Tap Continue to skip this activity.',
    instruction: notice,
    choices: [],
    content: {
      ...activity.content,
      pictureMode: false,
      pilotUnavailableMessage: notice,
    },
  }
}
