# Talkora — Educational Dataset Research (Sprint 1)

**Prepared by:** Z.ai Curriculum Agent | **Date:** 2026-10-31
**Purpose:** audit candidate speech/language datasets for Miss Julie's child-English pipeline (ASR evaluation, retrieval, future fine-tuning) — with licenses, suitability for **young learners (ages 5–6, Class 1)**, and honest limitations.

**Ground rule applied throughout:** adult speech datasets must **not** be assumed suitable for child pronunciation assessment. Suitability verdicts below are per-use-case, not blanket.

---

## 1. Official Balbharati ecosystem (primary syllabus source)

| Item | Detail |
|---|---|
| Official URL | https://ebooks.ebalbharati.in/ (eBook library: textbooks, teachers handbooks, workbooks; filters by class 1–12, 10 mediums, syllabus years 2006–2026) |
| Verified asset | *English Balbharati — Grade One* (2025): https://ebooks.ebalbharati.in/pdfs/103050001.pdf — read directly on 2026-10-31 |
| License | **All rights reserved** by Balbharati (Pune). Copyright page prohibits reproduction without written permission. Third-party poems are credited in-book. |
| Size/scope | Std 1 English: 4 units / 44 chapters / 92 PDF pages. Library total: 903 books listed for syllabus year 2026. |
| Languages | English edition; Marathi/Hindi/Urdu/Gujarati/Kannada/Sindhi/Telugu/Tamil/Bengali editions exist for cross-language support design |
| Educational suitability | **Excellent** — this IS the syllabus; QR codes in-book point to official audio/visual complements |
| Age suitability | Exactly on-target (Grade One) |
| Quality limitations | PDF text extraction loses picture-dependent content; official audio is rights-reserved |
| Recommended usage | **Retrieval** (syllabus map, word banks, page references) and evaluation alignment. **Not** for corpus fine-tuning. Any reuse beyond referencing needs Balbharati authorization (open PM question). |

## 2. Mozilla Common Voice

| Item | Detail |
|---|---|
| Official URL | https://commonvoice.mozilla.org/ · per-language stats: https://commonvoice.mozilla.org/en/languages and Mozilla Data Collective (mozilladatacollective.com) |
| License | **CC0-1.0** (public domain dedication) — confirmed via Mozilla's Digital Public Goods profile |
| Size (verified) | Common Voice 19.0 release: **32,584 hours** total across 120+ languages; per-language validated-hour counts for **Hindi** and **Marathi** are published on the languages page (each in the hundreds-of-hours range; pull exact current numbers at integration time) |
| Languages | 120+, incl. Hindi and Marathi (Marathi added in CV 8, 2022) |
| Educational suitability | Good for **ASR robustness testing** on Indian-accented English and for Hindi/Marathi speech models |
| Age suitability | **Caution:** contributor base is predominantly **adult and teen volunteers**; there is no child-speech subset and no child-consent framework. Do **not** treat as child pronunciation data. |
| Quality limitations | Crowd-read sentences; variable recording quality; sentence domains are general, not early-literacy |
| Recommended usage | **Evaluation** (accent/locale robustness of the STT layer) and optionally retrieval of phonetically balanced test sets. **Not** for child pronunciation assessment; **not** for fine-tuning child-facing scoring. |

## 3. AI4Bharat (IIT Madras)

| Item | Detail |
|---|---|
| Official URL | https://ai4bharat.iitm.ac.in/ · Hugging Face: [ai4bharat/IndicVoices](https://huggingface.co/datasets/ai4bharat/IndicVoices), [ai4bharat/IndicVoices-R](https://huggingface.co/datasets/AI4Bharat/IndicVoices-R) · GitHub: [AI4Bharat/IndicVoices](https://github.com/AI4Bharat/IndicVoices) |
| License | Open datasets distributed via HF/GitHub; AI4Bharat typically uses permissive research licenses — **verify the exact license on each dataset card before use** (do not assume) |
| Size (verified) | **IndicVoices:** 23.7K hours natural speech, 22 languages, 208 districts (initial March-2024 release: 7,348 hrs from 16,237 speakers; mix: 76% extempore, 8% read, rest conversational). **Kathbath:** ~1,684 hrs labeled read speech across 12 Indian languages. **IndicVoices-R (TTS-oriented):** 1,704 hrs, 10,496 speakers, 22 languages |
| Languages | 22 Indian languages incl. **Hindi and Marathi** |
| Educational suitability | Strong for Hindi/Marathi ASR and TTS infrastructure behind Miss Julie's L1 support |
| Age suitability | **Adult speakers** (adults recruited across districts). Not child speech. |
| Quality limitations | Spontaneous adult speech; school-domain vocabulary not guaranteed; check speaker-consent scope before any public-facing use |
| Recommended usage | **Fine-tuning/eval of the Hindi/Marathi STT/TTS layer** (the language support channel), and Hindi/Marathi pronunciation modelling for teacher-side speech. Not for scoring children's English. |

## 4. EFCAMDAT (EF–Cambridge Open Language Database)

| Item | Detail |
|---|---|
| Official URL | Coordinated via the University of Cambridge / EF research teams; cleaned subcorpus page: https://www.languagesciences.cam.ac.uk/resources ; methodology paper: [LDK 2023](https://aclanthology.org/2023.ldk-1.27.pdf) |
| License | "Open access" to the research community **upon application** — research-only use, citation required, no redistribution |
| Size | ~1.2M texts from ~174K learners worldwide (published figures; confirm current version on application) |
| Languages | L2 **English writing** by learners at CEFR-mapped levels |
| Educational suitability | Useful for **error-pattern research** (what beginners at low CEFR levels actually write) to enrich `learner-mistakes.json` candidate patterns |
| Age suitability | **Adult** EF Englishtown learners — not children |
| Quality limitations | **Written, not spoken** — no pronunciation signal; self-selected learners |
| Recommended usage | **Retrieval** for error-taxonomy design and evaluation rubrics. Not usable for speech scoring; not child data. |

## 5. CMU Kids Corpus (LDC97S63)

| Item | Detail |
|---|---|
| Official URL | https://catalog.ldc.upenn.edu/LDC97S63 |
| License | **LDC license** — non-commercial research, signed user agreement; membership or non-member fee. Not open-download. |
| Size (verified) | 76 child speakers (ages 6–11), ~5,180 utterances of read American English |
| Languages | American English |
| Educational suitability | The closest verified **actual child-speech** resource; useful to sanity-check ASR behaviour on child voices |
| Age suitability | **Children — but ages 6–11, American-accented, read speech**: younger and accent-distant from Maharashtra Class 1 learners |
| Quality limitations | Small; dated recordings; read-aloud only; US phoneme norms; license restricts redistribution and any product use |
| Recommended usage | **Internal evaluation** of child-voice ASR degradation, if licensing is secured. **Not** for fine-tuning production models, and not representative of the target accent. |

## 6. Candidate resources surfaced but **not yet audited** (do not use without verification)

- **Ohio Child Speech Corpus** — surfaced in search as publicly available child speech; details/license unverified this sprint.
- **L2-ARCTIC** — non-native English speech corpus widely used for ASR mispronunciation research; accent-relevant but adult; license to verify.
- **Balbharati QR audio** — official in-book audio complements; rights-reserved; would require authorization.
- **School-recorded Talkora audio (future)** — the most valuable long-term asset: with parental consent, Talkora's own users are the only true in-domain child dataset. Flag for the PM as a consent-framework question, not a research task.

## 7. Suitability matrix (verdicts)

| Resource | Evaluation | Retrieval | Fine-tuning | Child pronunciation scoring |
|---|---|---|---|---|
| Balbharati textbook/QR | ✔ (alignment) | ✔✔ | ✖ (rights) | ✖ |
| Common Voice (CC0) | ✔✔ | ✔ | ✔ (ASR robustness) | ✖ (adult-dominant) |
| AI4Bharat (IndicVoices/Kathbath) | ✔ | ✔ | ✔✔ (hi/mr layers) | ✖ (adult) |
| EFCAMDAT | ✔ (error taxonomy) | ✔✔ | ✖ (license scope) | ✖ (written) |
| CMU Kids | ✔ (if licensed) | ✖ | ✖ | △ (US accent, 6–11) |

**Bottom line:** no open dataset currently provides Maharashtra-accented, Class-1-age, child English speech. The pragmatic Sprint-1 stance is: use CC0/open corpora for ASR/TTS infrastructure and error taxonomy design; use the official textbook for syllabus alignment; and treat **consented, in-house recording** as the only credible future source for child pronunciation assessment.

---

### Sources consulted (2026-10-31)
- [eBalbharati eBook library](https://ebooks.ebalbharati.in/) and [English Balbharati Grade One PDF](https://ebooks.ebalbharati.in/pdfs/103050001.pdf)
- [Mozilla Common Voice DPG profile (CC0)](https://digitalpublicgoods.net/r/mozilla-common-voice-dataset) · [Common Voice languages page](https://commonvoice.mozilla.org/en/languages)
- [AI4Bharat IndicVoices on Hugging Face](https://huggingface.co/datasets/ai4bharat/IndicVoices) · [IndicVoices-R](https://huggingface.co/datasets/AI4Bharat/IndicVoices-R) · [GitHub repo](https://github.com/AI4Bharat/IndicVoices)
- [LDC catalog — CMU Kids LDC97S63](https://catalog.ldc.upenn.edu/LDC97S63)
- [Cambridge Language Sciences resources (EFCAMDAT subcorpus)](https://www.languagesciences.cam.ac.uk/resources) · [EFCAMDAT LDK 2023 paper](https://aclanthology.org/2023.ldk-1.27.pdf)
