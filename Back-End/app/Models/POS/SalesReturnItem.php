<?php

namespace App\Models\POS;

use Illuminate\Database\Eloquent\Model;
use App\Models\Master\Product;
use App\Models\Inventory\ProductBatch;

class SalesReturnItem extends Model
{
    protected $guarded = [];

    public function salesReturn()
    {
        return $this->belongsTo(SalesReturn::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function productBatch()
    {
        return $this->belongsTo(ProductBatch::class);
    }
}
