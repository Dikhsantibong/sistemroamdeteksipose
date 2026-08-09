<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\File;

class PoseUploadRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $images = config('booth.images');

        return [
            'people_count' => ['required', 'integer', Rule::exists('people_counts', 'count')],
            'category_id' => ['nullable', 'integer', Rule::exists('categories', 'id')],
            'instruction' => ['nullable', 'string', 'max:500'],
            'active' => ['required', 'boolean'],
            'images' => ['required', 'array', 'min:1', 'max:'.$images['max_batch_files']],
            'images.*' => [
                'required',
                File::image()
                    ->max($images['max_upload_kilobytes'])
                    ->dimensions(Rule::dimensions()
                        ->minWidth($images['min_dimension'])
                        ->minHeight($images['min_dimension'])
                        ->maxWidth($images['max_dimension'])
                        ->maxHeight($images['max_dimension'])),
            ],
        ];
    }

    /**
     * Get the validation messages that apply to the request.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'images.max' => 'You can upload at most :max images at a time.',
            'images.*.dimensions' => 'The image dimensions are outside the supported range.',
        ];
    }
}
