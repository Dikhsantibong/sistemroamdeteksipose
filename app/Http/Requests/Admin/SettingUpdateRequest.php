<?php

namespace App\Http\Requests\Admin;

use App\Services\BoothSettings;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class SettingUpdateRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * The rules are derived from the setting definitions in config/booth.php so
     * adding a setting there is the only change needed.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return app(BoothSettings::class)->validationRules();
    }
}
