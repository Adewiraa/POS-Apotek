<?php

namespace App\Models\Prescription;

use Illuminate\Database\Eloquent\Model;
use App\Models\Master\Patient;
use App\Models\Master\Doctor;

class Prescription extends Model
{
    protected $guarded = [];

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function doctor()
    {
        return $this->belongsTo(Doctor::class);
    }

    public function items()
    {
        return $this->hasMany(PrescriptionItem::class);
    }
}
