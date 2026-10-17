import { kgLessonVideoScripts, validateKGLessonVideoScripts } from '../../src/curriculum/kg/video-scripts'

describe('KG Runway introduction scripts', () => {
  it('prepares one 15–25 second story and storyboard for every lesson without claiming video files exist', () => {
    expect(validateKGLessonVideoScripts()).toEqual([])
    expect(kgLessonVideoScripts).toHaveLength(24)
    expect(new Set(kgLessonVideoScripts.map((script) => script.lessonKey)).size).toBe(24)
    for (const script of kgLessonVideoScripts) {
      expect(script.status).toBe('NOT_CREATED')
      expect(script.playback.availability).toBe('NOT_CREATED')
      expect(script.scenes).toHaveLength(4)
      expect(script.scenes[0].startSecond).toBe(0)
      expect(script.scenes[3].endSecond).toBe(20)
      expect(script.azureTtsNarration).toContain('Miss Julie')
      expect(script.scenes.every((scene) => scene.runwayImageToVideoPrompt.includes('light blue blazer'))).toBe(true)
    }
  })
})
