---
paths:
  - 'resources/js/hooks/booth/**'
---

# Booth

## All booth input methods dispatch through one navigation controller
Hand gesture, voice command and the manual buttons must never change the displayed pose directly. They all call `dispatch(action, source)` from `usePoseNavigation` with `NEXT_POSE` / `PREVIOUS_POSE`. Adding a new input (bluetooth remote, foot pedal) means adding one more caller, nothing else.

Camera frames and speech transcripts are processed in memory only — never record, store or upload them. MediaPipe wasm (`public/mediapipe/wasm`) and models (`public/models`) are served from this app, not a CDN, so detection keeps working offline.
