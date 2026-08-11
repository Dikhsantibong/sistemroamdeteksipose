<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Booth Setting Definitions
    |--------------------------------------------------------------------------
    |
    | Every runtime setting the booth tablet and the admin dashboard rely on is
    | declared here. The values themselves live in the "settings" table so an
    | administrator can change them without a developer. This file only
    | describes the shape of each setting: its type, group and default.
    |
    */

    'settings' => [
        'recommendation_count' => [
            'type' => 'integer',
            'group' => 'recommendation',
            'default' => 10,
            'label' => 'Recommendation Count',
            'description' => 'How many poses are shown in a single session.',
            'rules' => ['required', 'integer', 'min:1', 'max:50'],
        ],
        'pose_loop_enabled' => [
            'type' => 'boolean',
            'group' => 'recommendation',
            'default' => true,
            'label' => 'Loop Poses',
            'description' => 'Wrap from the last pose back to the first one.',
            'rules' => ['required', 'boolean'],
        ],
        'hand_gesture_enabled' => [
            'type' => 'boolean',
            'group' => 'navigation',
            'default' => true,
            'label' => 'Hand Gesture',
            'description' => 'Allow customers to swipe in the air to change pose.',
            'rules' => ['required', 'boolean'],
        ],
        'voice_enabled' => [
            'type' => 'boolean',
            'group' => 'navigation',
            'default' => true,
            'label' => 'Voice Command',
            'description' => 'Allow customers to say "next" or "previous".',
            'rules' => ['required', 'boolean'],
        ],
        'manual_navigation_enabled' => [
            'type' => 'boolean',
            'group' => 'navigation',
            'default' => true,
            'label' => 'Manual Navigation',
            'description' => 'Show the previous and next buttons on the tablet.',
            'rules' => ['required', 'boolean'],
        ],
        'voice_language' => [
            'type' => 'string',
            'group' => 'navigation',
            'default' => 'en-US',
            'label' => 'Voice Language',
            'description' => 'Recognition language used for voice commands.',
            'rules' => ['required', 'string', 'in:en-US,id-ID'],
        ],
        'voice_confidence' => [
            'type' => 'float',
            'group' => 'navigation',
            'default' => 0.4,
            'label' => 'Voice Confidence',
            'description' => 'Below 0.5 the booth also accepts near-misses such as "nexr". Raise it if unrelated words move the slides.',
            'rules' => ['required', 'numeric', 'min:0', 'max:1'],
        ],
        'gesture_confidence' => [
            'type' => 'float',
            'group' => 'navigation',
            'default' => 0.4,
            'label' => 'Gesture Confidence',
            'description' => 'Minimum hand detection confidence. Lower it when customers stand further away.',
            'rules' => ['required', 'numeric', 'min:0', 'max:1'],
        ],
        'gesture_cooldown' => [
            'type' => 'integer',
            'group' => 'navigation',
            'default' => 900,
            'label' => 'Gesture Cooldown (ms)',
            'description' => 'Time to ignore new gestures after one is accepted.',
            'rules' => ['required', 'integer', 'min:200', 'max:5000'],
        ],
        'detection_confidence' => [
            'type' => 'float',
            'group' => 'detection',
            'default' => 0.5,
            'label' => 'Detection Confidence',
            'description' => 'Minimum confidence before a person is counted.',
            'rules' => ['required', 'numeric', 'min:0', 'max:1'],
        ],
        'detection_smoothing' => [
            'type' => 'integer',
            'group' => 'detection',
            'default' => 8,
            'label' => 'Detection Smoothing (frames)',
            'description' => 'How many recent frames are used to decide a stable count.',
            'rules' => ['required', 'integer', 'min:1', 'max:60'],
        ],
        'detection_interval' => [
            'type' => 'integer',
            'group' => 'detection',
            'default' => 300,
            'label' => 'Detection Interval (ms)',
            'description' => 'Delay between detection passes. Higher values save battery.',
            'rules' => ['required', 'integer', 'min:100', 'max:3000'],
        ],
        'heartbeat_interval' => [
            'type' => 'integer',
            'group' => 'device',
            'default' => 120,
            'label' => 'Heartbeat Interval (seconds)',
            'description' => 'How often the tablet reports that it is still alive.',
            'rules' => ['required', 'integer', 'min:30', 'max:3600'],
        ],
        'content_sync_interval' => [
            'type' => 'integer',
            'group' => 'device',
            'default' => 300,
            'label' => 'Content Sync Interval (seconds)',
            'description' => 'How often the tablet checks for new poses and settings.',
            'rules' => ['required', 'integer', 'min:30', 'max:3600'],
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Image Processing
    |--------------------------------------------------------------------------
    |
    | Uploaded pose photos are re-encoded before they are stored so the tablet
    | never downloads a multi-megabyte original.
    |
    */

    'images' => [
        'disk' => 'public',
        'directory' => 'poses',
        'thumbnail_directory' => 'poses/thumbnails',
        'max_width' => 1280,
        'max_height' => 1280,
        'thumbnail_width' => 320,
        'thumbnail_height' => 320,
        'quality' => 82,
        'thumbnail_quality' => 72,
        'max_upload_kilobytes' => 12288,
        'min_dimension' => 200,
        'max_dimension' => 8000,
        'max_batch_files' => 40,
    ],

];
