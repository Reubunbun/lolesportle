export type Region = 'EU'|'NA'|'Korea'|'China'|'Brazil'|'Taiwan'|'Asia Pacific'|'Southeast Asia'|'International';

export const SERIES = {
    WORLDS: {
        Name: 'Worlds',
        Region: 'International',
        Importance: 17,
    },
    MSI: {
        Name: 'MSI',
        Region: 'International',
        Importance: 16,
    },
    FIRST_STAND: {
        Name: 'First Stand',
        Region: 'International',
        Importance: 15,
    },
    EWC: {
        Name: 'Esports World Cup',
        Region: 'International',
        Importance: 15,
    },
    LCK: {
        Name: 'LCK',
        Region: 'Korea',
        Importance: 8,
    },
    LPL: {
        Name: 'LPL',
        Region: 'China',
        Importance: 7,
    },
    LEC: {
        Name: 'LEC',
        Region: 'EU',
        Importance: 6,
    },
    LCS: {
        Name: 'LCS',
        Region: 'NA',
        Importance: 5
    },
    LTA: {
        Name: 'LTA Championship / Cross-Conference',
        Region: 'International',
        Importance: 5,
    },
    ASI: {
        Name: 'Asia Invitational',
        Region: 'International',
        Importance: 4,
    },
    IEM: {
        Name: 'IEM',
        Region: 'International',
        Importance: 4,
    },
    MSC: {
        Name: 'Mid-Season Cup',
        Region: 'International',
        Importance: 4,
    },
    IGN_PL: {
        Name: 'IGN Pro League',
        Region: 'International',
        Importance: 4,
    },
    LMS: {
        Name: 'LMS',
        Region: 'Taiwan',
        Importance: 2,
    },
    GPL: {
        Name: 'GPL',
        Region: 'Southeast Asia',
        Importance: 2,
    },
    LCP: {
        Name: 'LCP',
        Region: 'Asia Pacific',
        Importance: 2,
    },
    CBLOL: {
        Name: 'CBLOL',
        Region: 'Brazil',
        Importance: 1,
    },
} as const satisfies Record<string, { Name: string; Region: Region; Importance: number }>;

type Series = typeof SERIES[keyof typeof SERIES];

export function getSeriesDataByName(seriesName: string) : Series|null {
    for (const seriesData of Object.values(SERIES)) {
        if (seriesData.Name.toLowerCase() === seriesName.toLowerCase()) {
            return seriesData;
        }
    }

    return null;
}

export function getSeriesFromTournamentPath(tournamentPath: string) : Series|null {
    switch (true) {
        case /^asia_invitational\//i.test(tournamentPath):
            return SERIES.ASI;
        case /^champions\//i.test(tournamentPath):
        case /^lck\//i.test(tournamentPath):
            return SERIES.LCK;
        case /^esports_world_cup\//i.test(tournamentPath):
            return SERIES.EWC;
        case /^first_stand_tournament\//i.test(tournamentPath):
            return SERIES.FIRST_STAND;
        case /^gpl\//i.test(tournamentPath):
        case /^Garena_Premier_League\//i.test(tournamentPath):
            return SERIES.GPL;
        case /^ign_proleague/i.test(tournamentPath):
            return SERIES.IGN_PL;
        case /^intel_extreme_masters\//i.test(tournamentPath):
            return SERIES.IEM;
        case /^lcp\//i.test(tournamentPath):
            return SERIES.LCP;
        case /^lec\//i.test(tournamentPath):
        case /^lcs\/europe\//i.test(tournamentPath):
            return SERIES.LEC;
        case /^lcs\/(north_america|\d{4})\//i.test(tournamentPath):
        case /^lta\/\d{4}\/split_\d\/north/i.test(tournamentPath):
            return SERIES.LCS;
        case /^lms\//i.test(tournamentPath):
            return SERIES.LMS;
        case /^lpl\//i.test(tournamentPath):
            return SERIES.LPL;
        case /^cblol\//i.test(tournamentPath):
        case /^lta\/\d{4}\/split_\d\/south/i.test(tournamentPath):
            return SERIES.CBLOL;
        case /^lta\/\d{4}\/(cross-conference|championship)/i.test(tournamentPath):
            return SERIES.LTA;
        case /^mid-season_cup\//i.test(tournamentPath):
            return SERIES.MSC;
        case /^mid-season_invitational\//i.test(tournamentPath):
            return SERIES.MSI;
        case /^world_championship\//i.test(tournamentPath):
            return SERIES.WORLDS;
        default:
            return null;
    }
}
