<?php
namespace App\Enum;

enum Series : string
{
    case LEC = 'LEC';
    case LCS = 'LCS';
    case LCK = 'LCK';
    case LPL = 'LPL';
    case GPL = 'GPL';
    case LCP = 'LCP';
    case LMS = 'LMS';
    case CBLOL = 'CBLOL';
    case IEM = 'IEM';
    case IGN_PL = 'IGN Pro League';
    case MSC = 'Mid-Season Cup';
    case ASIA_INVITATIONAL = 'Asia Invitational';
    case EWC = 'Esports World Cup';
    case FIRST_STAND = 'First Stand';
    case MSI = 'MSI';
    case WORLDS = 'Worlds';

    static function fromTournamentUrl(string $url) : self
    {
        $mainComponents = explode(
            '/',
            str_replace(
                'https://liquipedia.net/leagueoflegends/',
                '',
                $url,
            ),
        );

        $firstComponent = strtolower($mainComponents[0]);
        $detectedSeries = match ($firstComponent) {
            'asia_invitational' => Series::ASIA_INVITATIONAL,
            'champions',
            'lck' => Series::LCK,
            'esports_world_cup' => Series::EWC,
            'first_stand_tournament' => Series::FIRST_STAND,
            'gpl' => Series::GPL,
            'ign_proleague' => Series::IGN_PL,
            'intel_extreme_masters' => Series::IEM,
            'lcp' => Series::LCP,
            'lec' => Series::LEC,
            'lms' => Series::LMS,
            'lpl' => Series::LPL,
            'cblol' => Series::CBLOL,
            'mid-season_cup' => Series::MSC,
            'mid-season_invitational' => Series::MSI,
            'world_championship' => Series::WORLDS,
            default => null,
        };

        if (!is_null($detectedSeries)) {
            return $detectedSeries;
        }

        if ($firstComponent === 'lcs') {
            $secondComponent = strtolower($mainComponents[1] ?? '');
            return $secondComponent === 'europe' ? Series::LEC : Series::LCS;
        }

        if ($firstComponent === 'lta') {
            $lastComponent = strtolower(last($mainComponents));
            return $lastComponent === 'south' ? Series::CBLOL : Series::LCS;
        }

        throw new \Exception(
            "Could not determine series from tournament URL: $url",
        );
    }

    function getRegion() : Region
    {
        return match($this) {
            Series::LEC => Region::EU,
            Series::LCS => Region::NA,
            Series::LCK => Region::KR,
            Series::LPL => Region::CN,
            Series::GPL => Region::SEA,
            Series::LCP => Region::APAC,
            Series::LMS => Region::TW,
            Series::CBLOL => Region::BR,
            Series::ASIA_INVITATIONAL,
            Series::FIRST_STAND,
            Series::IEM,
            Series::MSC,
            Series::EWC,
            Series::MSI,
            Series::WORLDS => Region::INT,
        };
    }

    function getScore() : int
    {
        return match($this) {
            Series::WORLDS => 17,
            Series::MSI => 16,
            Series::FIRST_STAND, Series::EWC => 15,
            Series::LCK => 8,
            Series::LPL => 7,
            Series::LEC => 6,
            Series::LCS => 5,
            Series::ASIA_INVITATIONAL,
            Series::IEM,
            Series::MSC,
            Series::IGN_PL => 4,
            Series::LMS,
            Series::GPL,
            Series::LCP => 2,
            Series::CBLOL => 1,
        };
    }
}
