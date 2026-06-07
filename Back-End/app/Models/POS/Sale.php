<?php

namespace App\Models\POS;

use Illuminate\Database\Eloquent\Model;

class Sale extends Model
{
    protected $guarded = [];

    public function items()
    {
        return $this->hasMany(SaleItem::class);
    }

    public function prescription()
    {
        return $this->belongsTo(\App\Models\Prescription\Prescription::class);
    }
}
