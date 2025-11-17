<?php
namespace App\Repository;

use Illuminate\Support\Facades\DB;
use Illuminate\Database\Query\Builder;
use App\Model\ModelInterface;

/** @template TModel of ModelInterface */
abstract class AbstractRepository
{
    abstract static function getTableName() : string;

    protected function buildQuery(?string $asAlias = null) : Builder
    {
        return DB::table(
            static::getTableName() . ($asAlias ? " AS $asAlias" : "")
        );
    }

    protected function _debugQuery(Builder $query)
    {
        $strSql = $query->toSql();
        foreach ($query->getBindings() as $binding) {
            $strBinding = is_string($binding) ? "'$binding'" : "$binding";
            $strSql = preg_replace('/\?/', $strBinding, $strSql ?? "", 1);
        }

        $strSql = preg_replace(
            "/\b(SELECT|FROM|WHERE|GROUP BY|ORDER BY|LIMIT|OFFSET|AND|OR)\b/i",
            "\n$1",
            $strSql ?? ""
        );
        $strSql = preg_replace('/,/', ",\n  ", $strSql ?? "");

        print_r("$strSql\n\n");

        dd();
    }
}
