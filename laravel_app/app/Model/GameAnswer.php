<?php
namespace App\Model;

use App\Enum\{Region, GuessResponse};
use Illuminate\Support\Collection;
use App\Model\Database\{
    Player as ModelPlayer,
    Tournament as ModelTournament,
    TournamentResult as ModelTournamentResult,
};

class GameAnswer
{
    /**
     * @param Collection<int, ModelTournament> $_tournaments
     * @param Collection<int, ModelTournamentResult> $_tournamentResults
     */
    function __construct(
        private ModelPlayer $_player,
        private Collection $_tournaments,
        private Collection $_tournamentResults,
    ) {
        $this->_tournaments = $_tournaments->sortBy(
            fn($t) => $t->getStartDate(),
        );
    }

    function getDebutYear() : int
    {
        return $this->_tournaments->first()->getStartDate()->year;
    }

    function getAllRegions() : array
    {
        return $this->_tournaments
            ->map(fn ($t) => $t->getRegion())
            ->filter(fn ($r) => $r !== Region::INT)
            ->unique()
            ->values()
            ->all();
    }

    function getMostRecentRegion() : Region
    {
        return $this->_tournaments
            ->map(fn ($t) => $t->getRegion())
            ->filter(fn ($r) => $r !== Region::INT)
            ->values()
            ->last();
    }

    /** @return string[] */
    function getAllTeams() : array
    {
        return $this->_tournamentResults
            ->map(fn ($tr) => $tr->getTeamUrl())
            ->unique()
            ->values()
            ->all();
    }

    function getMostRecentTeam() : string
    {
        $mostRecentTournament = $this->_tournaments->last();
        $mostRecentTournamentResult = $this->_tournamentResults->first(
            fn ($tr) =>
                $tr->getTournamentUrl() === $mostRecentTournament->getUrl()
        );
        return $mostRecentTournamentResult->getTeamUrl();
    }

    /** @return string[] */
    function getRoles() : array
    {
        return $this->_tournamentResults
            ->map(fn ($tr) => $tr->getPlayerRole())
            ->unique()
            ->values()
            ->all();
    }

    /**  @return array{string, int} */
    function getBestAcheivement() : array
    {
        $bestTournmentResult = $this->_tournamentResults
            ->sortByDesc(fn ($tr) => $tr->getResultScore())
            ->first();

        $tournamentSeriesName = $this->_tournaments
            ->first(fn ($t) =>
                $t->getUrl() === $bestTournmentResult->getTournamentUrl())
            ->getSeriesName();

        return [
            "$tournamentSeriesName {$bestTournmentResult->getReadablePosition()}",
            $bestTournmentResult->getResultScore(),
        ];
    }

    function compareTo(GameAnswer $givenAnsw) : array
    {
        $clues = [];

        $ourDebutYear = $this->getDebutYear();
        $givenDebutYear = $givenAnsw->getDebutYear();
        if ($ourDebutYear === $givenDebutYear) {
            $clues['Debut Year'] = GuessResponse::CORRECT->toString($givenDebutYear);
        } else if ($ourDebutYear < $givenDebutYear) {
            $clues['Debut Year'] = GuessResponse::LOWER->toString($givenDebutYear);
        } else {
            $clues['Debut Year'] = GuessResponse::HIGHER->toString($givenDebutYear);
        }

        $ourRegions = $this->getAllRegions();
        $ourCurrentRegion = $this->getMostRecentRegion();
        $givenRegion = $givenAnsw->getMostRecentRegion();
        if ($ourCurrentRegion === $givenRegion) {
            $clues['Region'] = GuessResponse::CORRECT->toString($givenRegion->value);
        } else if (in_array($givenRegion, $ourRegions)) {
            $clues['Region'] = GuessResponse::PARTIAL->toString($givenRegion->value);
        } else {
            $clues['Region'] = GuessResponse::INCORRECT->toString($givenRegion->value);
        }

        $ourRoles = $this->getRoles();
        $givenRoles = $givenAnsw->getRoles();
        $givenRolesStr = implode(', ', $givenRoles);
        $rolesOverlap = array_intersect(
            $ourRoles,
            $givenRoles,
        );
        if (
            count($ourRoles) === count($rolesOverlap) &&
            count($givenRoles) === count($rolesOverlap)
        ) {
            $clues['Roles'] = GuessResponse::CORRECT->toString($givenRolesStr);
        } else if (count($rolesOverlap) > 0) {
            $clues['Roles'] = GuessResponse::PARTIAL->tostring($givenRolesStr);
        } else {
            $clues['Roles'] = GuessResponse::INCORRECT->tostring($givenRolesStr);
        }

        $ourNationalities = $this->_player->getNationalities();
        $givenNationalities = $givenAnsw->_player->getNationalities();
        $givenNationalitiesStr = implode(', ', $givenNationalities);
        $nationalitiesOverlap = array_intersect(
            $ourNationalities,
            $givenNationalities,
        );
        if (
            count($ourNationalities) === count($nationalitiesOverlap) &&
            count($givenNationalities) === count($nationalitiesOverlap)
        ) {
            $clues['Nationalities'] = GuessResponse::CORRECT->toString($givenNationalitiesStr);
        } else if (count($nationalitiesOverlap) > 0) {
            $clues['Nationalities'] = GuessResponse::PARTIAL->toString($givenNationalitiesStr);
        } else {
            $clues['Nationalities'] = GuessResponse::INCORRECT->toString($givenNationalitiesStr);
        }

        [$ourBestResult, $ourBestResultScore] = $this->getBestAcheivement();
        [$givenBestReslt, $givenBestResultScore] = $givenAnsw->getBestAcheivement();
        if ($ourBestResultScore === $givenBestResultScore) {
            if ($ourBestResult === $givenBestReslt) {
                $clues['Best Achievement'] = GuessResponse::CORRECT->toString($givenBestReslt);
            } else {
                $clues['Best Achievement'] = GuessResponse::PARTIAL->toString($givenBestReslt);
            }
        } else if ($ourBestResultScore < $givenBestResultScore) {
            $clues['Best Achievement'] = GuessResponse::LOWER->toString($givenBestReslt);
        } else {
            $clues['Best Achievement'] = GuessResponse::HIGHER->toString($givenBestReslt);
        }

        $ourTeams = $this->getAllTeams();
        $ourCurrentTeam = $this->getMostRecentTeam();
        $givenCurrentTeam = $givenAnsw->getMostRecentTeam();
        if ($givenCurrentTeam === $ourCurrentTeam) {
            $clues['Team'] = GuessResponse::CORRECT->toString($givenCurrentTeam);
        } else if (in_array($givenCurrentTeam, $ourTeams)) {
            $clues['Team'] = GuessResponse::PARTIAL->toString($givenCurrentTeam);
        } else {
            $clues['Team'] = GuessResponse::INCORRECT->toString($givenCurrentTeam);
        }

        return [
            ...$clues,
            'Result' => $this->_player->getUrl() === $givenAnsw->_player->getUrl()
                ? GuessResponse::CORRECT
                : GuessResponse::INCORRECT,
        ];
    }
}
