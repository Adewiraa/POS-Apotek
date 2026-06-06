<?php

namespace App\Models\Procurement;

use Illuminate\Database\Eloquent\Model;

class PurchaseReturn extends Model
{
    protected $guarded = [];

    public function items()
    {
        return $this->hasMany(PurchaseReturnItem::class);
    }
}
