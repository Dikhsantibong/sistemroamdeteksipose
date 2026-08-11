<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PoseBulkActionRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'action' => [
                'required',
                'string',
                Rule::in(['activate', 'deactivate', 'categorize', 'delete']),
            ],
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', Rule::exists('poses', 'id')],
            'category_id' => ['nullable', 'integer', Rule::exists('categories', 'id')],
        ];
    }

    /**
     * Get the requested bulk action.
     */
    public function action(): string
    {
        return $this->string('action')->value();
    }

    /**
     * Get the category to move the poses into.
     *
     * A missing value means "no category", which is how an administrator clears
     * the category from a batch of poses.
     */
    public function categoryId(): ?int
    {
        return $this->filled('category_id')
            ? (int) $this->input('category_id')
            : null;
    }

    /**
     * Get the poses the action applies to.
     *
     * @return list<int>
     */
    public function poseIds(): array
    {
        return array_values(
            $this->collect('ids')
                ->map(fn (mixed $id): int => (int) $id)
                ->all(),
        );
    }
}
