<?php

namespace App\Models\POS;

use Illuminate\Database\Eloquent\Model;
use App\Models\Master\Product;
use App\Models\Inventory\ProductBatch;

class SaleItem extends Model
{
    protected $guarded = [];

    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    public function batch()
    {
        return $this->belongsTo(ProductBatch::class, 'product_batch_id');
    }

    public function sale()
    {
        return $this->belongsTo(Sale::class, 'sale_id');
    }
}
