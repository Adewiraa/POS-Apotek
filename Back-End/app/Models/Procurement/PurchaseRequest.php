<?php

namespace App\Models\Procurement;

use Illuminate\Database\Eloquent\Model;

class PurchaseRequest extends Model
{
    protected $guarded = [];

    public function items()
    {
        return $this->hasMany(PurchaseRequestItem::class);
    }
}
