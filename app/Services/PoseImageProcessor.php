<?php

namespace App\Services;

use GdImage;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Re-encode uploaded pose photos into a small, web friendly format.
 *
 * The booth tablet is a low powered Android device on a booth network, so the
 * original upload is never served to it. Every upload is resized, converted to
 * WebP and paired with a thumbnail for the dashboard listing.
 */
class PoseImageProcessor
{
    /**
     * Store an optimized image and thumbnail for the given upload.
     *
     * @return array{image_path: string, thumbnail_path: string, width: int, height: int, file_size: int}
     */
    public function store(UploadedFile $file): array
    {
        $config = $this->config();

        $source = $this->readImage($file);
        $source = $this->applyExifOrientation($source, $file);

        $image = $this->resizeToFit($source, $config['max_width'], $config['max_height']);
        $thumbnail = $this->resizeToFit($image, $config['thumbnail_width'], $config['thumbnail_height']);

        $basename = (string) Str::ulid();
        $imagePath = $config['directory']."/{$basename}.webp";
        $thumbnailPath = $config['thumbnail_directory']."/{$basename}.webp";

        $imageContents = $this->encodeWebp($image, $config['quality']);
        $thumbnailContents = $this->encodeWebp($thumbnail, $config['thumbnail_quality']);

        $disk = Storage::disk($config['disk']);
        $disk->put($imagePath, $imageContents);
        $disk->put($thumbnailPath, $thumbnailContents);

        $result = [
            'image_path' => $imagePath,
            'thumbnail_path' => $thumbnailPath,
            'width' => imagesx($image),
            'height' => imagesy($image),
            'file_size' => strlen($imageContents),
        ];

        $this->release($source, $image, $thumbnail);

        return $result;
    }

    /**
     * Delete the stored image and thumbnail for a pose.
     */
    public function delete(string $imagePath, string $thumbnailPath): void
    {
        Storage::disk($this->config()['disk'])->delete([$imagePath, $thumbnailPath]);
    }

    /**
     * Get the image processing configuration.
     *
     * @return array<string, mixed>
     */
    protected function config(): array
    {
        return config('booth.images');
    }

    /**
     * Decode the uploaded file into a GD image resource.
     */
    protected function readImage(UploadedFile $file): GdImage
    {
        $contents = file_get_contents($file->getRealPath());

        if ($contents === false) {
            throw new RuntimeException('The uploaded file could not be read.');
        }

        $image = @imagecreatefromstring($contents);

        if ($image === false) {
            throw new RuntimeException('The uploaded file is not a supported image.');
        }

        imagepalettetotruecolor($image);

        return $image;
    }

    /**
     * Free every distinct GD resource exactly once.
     *
     * resizeToFit() returns its argument untouched when no scaling is needed,
     * so the same resource can appear more than once.
     */
    protected function release(GdImage ...$images): void
    {
        $released = [];

        foreach ($images as $image) {
            if (in_array($image, $released, true)) {
                continue;
            }

            imagedestroy($image);
            $released[] = $image;
        }
    }

    /**
     * Rotate the image so it matches the orientation recorded by the camera.
     */
    protected function applyExifOrientation(GdImage $image, UploadedFile $file): GdImage
    {
        if (! function_exists('exif_read_data') || ! in_array($file->getMimeType(), ['image/jpeg', 'image/tiff'], true)) {
            return $image;
        }

        $exif = @exif_read_data($file->getRealPath());

        $degrees = match ($exif['Orientation'] ?? null) {
            3 => 180,
            6 => -90,
            8 => 90,
            default => 0,
        };

        if ($degrees === 0) {
            return $image;
        }

        $rotated = imagerotate($image, $degrees, 0);

        if ($rotated === false) {
            return $image;
        }

        imagedestroy($image);

        return $rotated;
    }

    /**
     * Scale the image down so it fits inside the given box, preserving aspect ratio.
     *
     * Images that already fit are returned untouched so nothing is upscaled.
     */
    protected function resizeToFit(GdImage $image, int $maxWidth, int $maxHeight): GdImage
    {
        $width = imagesx($image);
        $height = imagesy($image);

        $ratio = min($maxWidth / $width, $maxHeight / $height, 1);

        $targetWidth = max(1, (int) round($width * $ratio));
        $targetHeight = max(1, (int) round($height * $ratio));

        if ($targetWidth === $width && $targetHeight === $height) {
            return $image;
        }

        $resized = imagecreatetruecolor($targetWidth, $targetHeight);

        imagealphablending($resized, false);
        imagesavealpha($resized, true);
        imagecopyresampled($resized, $image, 0, 0, 0, 0, $targetWidth, $targetHeight, $width, $height);

        return $resized;
    }

    /**
     * Encode a GD image as WebP and return the raw bytes.
     */
    protected function encodeWebp(GdImage $image, int $quality): string
    {
        ob_start();
        imagewebp($image, null, $quality);
        $contents = ob_get_clean();

        if ($contents === false || $contents === '') {
            throw new RuntimeException('The image could not be encoded.');
        }

        return $contents;
    }
}
