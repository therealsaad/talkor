/** Type-safe authoring contracts; these are NOT a publication mechanism. */
export type Grade = 0|1|2|3|4|5|6|7|8|9|10
export type EditorialStatus = 'draft' | 'existing-runtime'
export type LearningMode = 'tap-picture'|'repeat-after-julie'|'listen-and-find'|'picture-choice'|'guided-dialogue'|'word-builder'|'role-play'|'sentence-builder'|'listen-and-answer'|'conversation'|'scenario-decision'|'speaking-reflection'
export interface LevelDesignConfig {
 id:string; grade:number; level:number; gradeLabel:string; title:string; roadmapTitle?:string; editorialStatus:EditorialStatus; studentPlayable:boolean; description:string
 syllabus:{objectives:string[];skills:string[];boardReviewRequired:boolean;sourceBook:string|null;sourcePages:number[];syllabusVerified:boolean}
 experience:{themeId:string;world:string;sceneDescription:string;layout:string;palette:{background:string;backgroundDeep:string;primary:string;secondary:string;accent:string;ink:string;surface:string};motif:string;animationMood:string;musicMood:string;useReducedMotionFallback:boolean;minTouchTargetPx:number}
 learningPolicy:{voiceFirst:boolean;invisibleAdaptive:boolean;autoResume:boolean;introRequired:boolean;introMustComplete:boolean;speechLanguage:string;beginnerHindiSupport:boolean;spontaneousFeedbackTTS:string;staticAudioStrategy:string;sendMicrophoneAudioToBackend:boolean;homeworkRequired:boolean}
 staffOnlyPreview:boolean
}
export interface LevelActivity { id:string;type:LearningMode;prompt:string;successCriteria:string;difficulty:number;approved:boolean }
export interface SuggestedActivity { label:string;mode:LearningMode;educatorNote:string }
export interface LevelInteractionConfig { allowedModes:LearningMode[];requireMicrophone:boolean;disableMusicDuringSpeech:boolean;allowReplayCompletedLevels:boolean; teacherStates:string[] }
