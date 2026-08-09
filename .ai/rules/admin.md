---
paths:
  - 'app/Http/Controllers/Admin/Pose*.php'
---

# Admin

## Pose images are always re-encoded through PoseImageProcessor
Never store an uploaded pose photo as-is. `App\Services\PoseImageProcessor` (GD, no extra package) resizes to `config('booth.images.max_width/height')`, converts to WebP, writes a thumbnail, and returns the paths plus dimensions — the tablet must never download a multi-megabyte original.

Bulk upload applies the batch metadata (group size, category, instruction) to every file and never aborts the batch on one bad file: failures are collected per filename and reported back to the admin. Deleting a pose must also delete both stored files via `PoseImageProcessor::delete()`.
