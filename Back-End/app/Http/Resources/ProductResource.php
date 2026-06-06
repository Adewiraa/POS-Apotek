<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'barcode' => $this->barcode,
            'name' => $this->name,
            'generic_name' => $this->generic_name,
            'category' => $this->category ? $this->category->name : null,
            'unit' => $this->unit ? $this->unit->short_name : null,
            'classification' => $this->classification,
            'price' => (float) $this->selling_price,
            'is_active' => (bool) $this->is_active,
            // Include active stock calculation (optional, handled by cache or query)
            // 'total_stock' => $this->batches->sum('qty_available')
        ];
    }
}
