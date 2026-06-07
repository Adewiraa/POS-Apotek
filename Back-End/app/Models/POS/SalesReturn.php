<?php

namespace App\Models\POS;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class SalesReturn extends Model
{
    protected $guarded = [];

    public function sale()
    {
        return $this->belongsTo(Sale::class);
    }

    public function items()
    {
        return $this->hasMany(SalesReturnItem::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
