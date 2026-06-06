<?php

namespace App\Models\Prescription;

use Illuminate\Database\Eloquent\Model;

class PrescriptionCompound extends Model
{
    protected $guarded = [];

    public function items()
    {
        return $this->hasMany(PrescriptionCompoundItem::class, 'compound_id');
    }
}
