/**
 * The single vocabulary every input method speaks.
 *
 * Hand gestures, voice commands and the manual buttons all dispatch one of
 * these actions to the navigation controller. No input source touches the UI
 * directly, so adding a bluetooth remote later means adding one more caller.
 */
export type NavigationAction = 'NEXT_POSE' | 'PREVIOUS_POSE';

export type NavigationSource = 'gesture' | 'voice' | 'manual';

/** The states the booth moves through, from a cold start to showing a pose. */
export type BoothState =
    | 'IDLE'
    | 'STANDBY'
    | 'INITIALIZING'
    | 'DETECTING'
    | 'STABLE'
    | 'LOADING_RECOMMENDATIONS'
    | 'SHOWING_POSE'
    | 'ERROR';
