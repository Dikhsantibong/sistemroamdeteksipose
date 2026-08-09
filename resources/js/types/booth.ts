export type Category = {
    id: number;
    name: string;
    slug: string;
    active: boolean;
    sort_order: number;
    poses_count?: number;
};

export type PeopleCount = {
    id: number;
    count: number;
    label: string;
    active: boolean;
    sort_order: number;
    poses_count?: number;
};

export type Pose = {
    id: number;
    category_id: number | null;
    name: string;
    people_count: number;
    instruction: string | null;
    image_path: string;
    thumbnail_path: string;
    image_url: string;
    thumbnail_url: string;
    original_filename: string | null;
    width: number | null;
    height: number | null;
    file_size: number | null;
    active: boolean;
    sort_order: number;
    created_at: string;
    category?: Pick<Category, 'id' | 'name'> | null;
};

/** A pose as delivered by the booth API and cached on the tablet. */
export type BoothPose = {
    id: number;
    name: string;
    people_count: number;
    instruction: string | null;
    image_url: string;
    thumbnail_url: string;
    category: { id: number; name: string } | null;
    sort_order: number;
};

export type BoothSettings = {
    recommendation_count: number;
    pose_loop_enabled: boolean;
    hand_gesture_enabled: boolean;
    voice_enabled: boolean;
    manual_navigation_enabled: boolean;
    voice_language: string;
    voice_confidence: number;
    gesture_confidence: number;
    gesture_cooldown: number;
    detection_confidence: number;
    detection_smoothing: number;
    detection_interval: number;
    heartbeat_interval: number;
    content_sync_interval: number;
};

export type BoothEndpoints = {
    configuration: string;
    poses: string;
    contentVersion: string;
    deviceRegister: string;
    deviceHeartbeat: string;
};

export type Device = {
    id: number;
    booth_id: number | null;
    name: string;
    uuid: string;
    last_seen_at: string | null;
    app_version: string | null;
    content_version: string | null;
    active: boolean;
    is_online: boolean;
    booth?: { id: number; name: string } | null;
};

export type Booth = {
    id: number;
    name: string;
};

export type SettingDefinition = {
    key: keyof BoothSettings;
    type: 'string' | 'integer' | 'float' | 'boolean' | 'json';
    group: string;
    label: string;
    description: string;
};

export type Paginated<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: { url: string | null; label: string; active: boolean }[];
};
