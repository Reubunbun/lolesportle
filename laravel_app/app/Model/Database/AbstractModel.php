<?php
namespace App\Model\Database;

use Illuminate\Support\Collection;

abstract class AbstractModel
{
    abstract static function createFromTableRow(\stdClass $row) : static;
    /** @return Collection<int, static> */
    static function createCollectionFromRows(Collection $rows) : Collection
    {
        return $rows->map([static::class, 'createFromTableRow']);
    }
}
