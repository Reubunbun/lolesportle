<?php
namespace App\Repository;

use Illuminate\Support\Collection;
use App\Model\Database\Tournament as ModelTournament;

/** @template-extends AbstractRepository<ModelTournament> */
class Tournaments extends AbstractRepository
{
    static function getTableName(): string
    {
        return "tournaments";
    }

    function getModelClass(): string
    {
        return ModelTournament::class;
    }

    /**
     * @param string[] $tournamentUrls
     * @return Collection<int, ModelTournament>
     */
    function getAllByTournamentUrls(array $tournamentUrls) : Collection
    {
        $rows = $this->buildQuery()
            ->whereIn(
                ModelTournament::COL_URL,
                $tournamentUrls,
            )
            ->get();

        return ModelTournament::createCollectionFromRows($rows);
    }
}
