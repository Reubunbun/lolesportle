<?php
namespace App\Model\Database;

use App\Enum\{Region, Series};
use Carbon\Carbon;

class Tournament extends AbstractModel
{
    const COL_URL = 'url';
    const COL_NAME = 'name';
    const COL_START_DATE = 'start_date';
    const COL_END_DATE = 'end_date';
    const COL_IS_INTERNATIONAL = 'is_international';

    private string $url;
    private string $name;
    private Series $series;
    private Region $region;
    private Carbon $startDate;
    private Carbon $endDate;

    static function createFromTableRow(\stdClass $row) : static
    {
        $tournament = new self();
        $tournament->url = $row->{self::COL_URL};
        $tournament->name = $row->{self::COL_NAME};
        $tournament->series = Series::fromTournamentUrl($tournament->url);
        $tournament->region = $tournament->series->getRegion();
        $tournament->startDate = Carbon::parse($row->{self::COL_START_DATE});
        $tournament->endDate = Carbon::parse($row->{self::COL_END_DATE});
        return $tournament;
    }

    function getUrl() : string
    {
        return $this->url;
    }

    function getSeriesName() : string
    {
        return $this->series->value;
    }

    function getStartDate() : Carbon
    {
        return $this->startDate;
    }

    function getEndDate() : Carbon
    {
        return $this->endDate;
    }

    function getRegion() : Region
    {
        return $this->region;
    }
}
