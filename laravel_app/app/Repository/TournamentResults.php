<?php
namespace App\Repository;

use Illuminate\Support\Collection;
use App\Model\Database\TournamentResult as ModelTournamentResult;

class TournamentResults extends AbstractRepository
{
    static function getTableName(): string
    {
        return "tournament_results";
    }

    /**
     * @param string[] $playerUrls
     * @return Collection<int, ModelTournamentResult>
     */
    function getAllByPlayerUrls(array $playerUrls) : Collection
    {
        $rows = $this->buildQuery()
            ->whereIn(
                ModelTournamentResult::COL_PLAYER_URL,
                $playerUrls,
            )
            ->get();

        return ModelTournamentResult::createCollectionFromRows($rows);
    }
}
