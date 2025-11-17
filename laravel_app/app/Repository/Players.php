<?php
namespace App\Repository;

use App\Enum\Region;
use Carbon\Carbon;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;
use App\Model\Database\{
    Player as ModelPlayer,
    Tournament as ModelTournament,
    TournamentResult as ModelTournamentResult,
};
use Illuminate\Support\Collection;

class Players extends AbstractRepository
{
    static function getTableName(): string
    {
        return "players";
    }

    /** @return string[] */
    function getAltUrlsForPlayer(string $playerMainUrl) : array
    {
        return $this->buildQuery()
            ->select(ModelPlayer::COL_URL)
            ->where(
                ModelPlayer::COL_LINKED_PLAYER,
                '=',
                $playerMainUrl,
            )
            ->pluck(ModelPlayer::COL_URL)
            ->all();
    }

    /** @return Collection<int, ModelPlayer> */
    function getPlayersValidForGame(?Region $regionLock = null) : Collection
    {
        $colActualPlayerUrl = "COALESCE(" .
            ModelPlayer::COL_LINKED_PLAYER . "," .
            ModelPlayer::COL_URL .
        ")";

        $rows = $this->buildQuery()
            ->where(ModelPlayer::COL_PAGE_MISSING, '=', false)
            ->whereExists(fn (Builder $q) => $q
                ->selectRaw(1)
                ->from(TournamentResults::getTableName())
                ->where(
                    DB::raw($colActualPlayerUrl),
                    '=',
                    DB::raw(ModelTournamentResult::COL_PLAYER_URL)
                )
                ->whereIn(
                    ModelTournamentResult::COL_TOURNAMENT_URL,
                    fn (Builder $q2) =>
                        $q2->select(ModelTournament::COL_URL)
                            ->from(Tournaments::getTableName())
                            ->whereBetween(
                                ModelTournament::COL_START_DATE,
                                [Carbon::now()->subYears(2), Carbon::now()],
                            )
                            ->where(
                                ModelTournament::COL_IS_INTERNATIONAL,
                                '=',
                                false,
                            )
                            ->when(
                                $regionLock !== null,
                                fn (Builder $q3) => $q3->where(
                                    ModelTournament::COL_URL,
                                    'RLIKE',
                                    $regionLock->getTournamentRegex(),
                                ),
                            ),
                )
            )
            ->selectRaw("DISTINCT $colActualPlayerUrl AS effective_url");

        return $this->buildQuery()
            ->whereIn(ModelPlayer::COL_URL, $rows->pluck('effective_url')->all())
            ->get()
            ->map(
                fn ($row) => ModelPlayer::createFromTableRow(
                    $row,
                    $this->getAltUrlsForPlayer($row->{ModelPlayer::COL_URL}),
                ),
            );
    }
}
