<?php

namespace App\Models\Master;

use Illuminate\Database\Eloquent\Model;
use App\Models\Prescription\Prescription;

class Patient extends Model
{
    protected $guarded = [];

    public function prescriptions()
    {
        return $this->hasMany(Prescription::class);
    }
}
