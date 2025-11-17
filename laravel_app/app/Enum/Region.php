<?php
namespace App\Enum;

enum Region : string
{
    case EU = 'EU';
    case NA = 'NA';
    case KR = 'Korea';
    case CN = 'China';
    case BR = 'Brazil';
    case TW = 'Taiwan';
    case APAC = 'Asia Pacific';
    case SEA = 'Southeast Asia';
    case INT = 'International';

    function getTournamentRegex() : string
    {
        $patterns = match($this) {
            Region::KR => ["\/LCK\/", "\/champions\/"],
            Region::CN => ["\/LPL\/"],
            Region::EU => ["\/LEC\/", "\/LCS\/Europe\/"],
            Region::NA => ["\/LCS\/(North_America|[0-9]+)\/", "\/LTA\/.+\/North$"],
            Region::BR => ["\/CBLOL\/", "\/LTA\/.+\/South$"],
            Region::TW => ["\/LMS\/"],
            Region::APAC => ["\/LCP\/", "\/LMS\/", "\/GPL\/"],
            Region::SEA => ["\/GPL\/"],
            Region::INT => [
                "\/worlds\/",
                "\/msi\/",
                "\/iem\/",
                "\/ewc\/",
                "\/first-stand\/",
                "\/asia-invitational\/",
                "\/msc\/",
            ],
        };

        return implode('|', $patterns);
    }
}
