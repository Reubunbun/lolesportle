<?php
namespace App\Model\Database;

use App\Enum\Series;

class TournamentResult extends AbstractModel
{
    const COL_TOURNAMENT_URL = 'tournament_url';
    const COL_PLAYER_URL = 'player_url';
    const COL_TEAM_URL = 'team_url';
    const COL_ROLE = 'role';
    const COL_POSITION = 'position';
    const COL_BEAT_PERCENT = 'beat_percent';

    private string $_tournamentUrl;
    private string $_teamUrl;
    private string $_role;
    private int $_position;
    private float $_beatPercent;

    static function createFromTableRow(\stdClass $row) : static
    {
        $tournamentResult = new self();
        $tournamentResult->_tournamentUrl =
            $row->{self::COL_TOURNAMENT_URL};
        $tournamentResult->_teamUrl =
            $row->{self::COL_TEAM_URL};
        $tournamentResult->_role =
            $row->{self::COL_ROLE};
        $tournamentResult->_position =
            $row->{self::COL_POSITION};
        $tournamentResult->_beatPercent =
            $row->{self::COL_BEAT_PERCENT};
        return $tournamentResult;
    }

    function getReadablePosition() : string
    {
        return match ($this->_position) {
            1 => 'Champion',
            2 => '2nd',
            3 => '3rd',
            21 => '21st',
            22 => '22nd',
            23 => '23rd',
            default => "{$this->_position}th",
        };
    }

    function getResultScore() : int
    {
        $series = Series::fromTournamentUrl($this->_tournamentUrl);
        return $this->_beatPercent + $series->getScore();
    }

    function getTournamentUrl() : string
    {
        return $this->_tournamentUrl;
    }

    function getTeamUrl() : string
    {
        return $this->_teamUrl;
    }

    function getPlayerRole() : string
    {
        return $this->_role;
    }
}
