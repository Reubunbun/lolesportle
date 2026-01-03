import { type TournamentRow } from '@shared/repository/sqlite/tournaments';
import { type TournamentResultRow } from '@shared/repository/sqlite/tournamentResults';
import { type TeamRow } from '@shared/repository/sqlite/teams';
import { type PlayerRow } from '@shared/repository/sqlite/players';
import { getSeriesDataByName } from './tournamentSeries';

const GUESS_HINTS = [
    'CORRECT',
    'INCORRECT',
    'PARTIAL',
    'CORRECT_IS_HIGHER',
    'CORRECT_IS_LOWER',
    'NEUTRAL',
] as const;

type GuessHintOptions = typeof GUESS_HINTS[number];
export type GuessHint = {
    hint: GuessHintOptions;
    details: string;
};
type GuessResult = {
    guess: string;
    overall: boolean;
    region: GuessHint;
    team: GuessHint;
    role: GuessHint;
    nationality: GuessHint;
    debut: GuessHint;
    greated_achievement: GuessHint;
};

export default class PlayerProfile {
    private _playerPath: string;
    private _name: string;
    private _currentRegion: string;
    private _historicRegions: string[];
    private _currentTeam: string;
    private _historicTeams: string[];
    private _roles: string[];
    private _nationalities: string[];
    private _debut: string;
    private _greatestAchievement: { label: string; score: number; liquipedia_weight: number };

    constructor(
        playerDbRow: PlayerRow,
        teamDbRows: TeamRow[],
        tournamentDbRows: TournamentRow[],
        tournamentResultsDbRows: TournamentResultRow[],
    ) {
        const tournamentsDataByPath = tournamentDbRows.reduce(
            (prev, curr) => ({...prev,  [curr.path_name]: curr}),
            {} as Record<string, TournamentRow>,
        );

        const allRegions: string[] = [];
        const resultsByStartDate: Record<string, TournamentResultRow> = {};
        const resultsByScore: Record<number, TournamentResultRow[]> = {};
        for (const result of tournamentResultsDbRows) {
            const tournamentData = tournamentsDataByPath[result.tournament_path];
            resultsByStartDate[tournamentData.start_date] = result;

            const seriesData = getSeriesDataByName(tournamentData.series);
            if (!seriesData) {
                resultsByScore[-1] = [ ...(resultsByScore[-1] || []), result ];
                continue;
            }

            if (!result.beat_percent || seriesData.Importance === 0) continue;

            const score = result.beat_percent + seriesData.Importance;
            resultsByScore[score] = [ ...(resultsByScore[score] || []), result ];

            if (seriesData.Region !== 'International') {
                allRegions.push(seriesData.Region);
            }
        }

        const highestScore = Math.max(...Object.keys(resultsByScore).map(Number));
        const bestResult = resultsByScore[highestScore].sort(
            (a,b) => (a.liquipedia_weight || 0) - (b.liquipedia_weight || 0),
        )[0];
        let bestResultLabel =
            tournamentsDataByPath[bestResult.tournament_path].series ??
            tournamentsDataByPath[bestResult.tournament_path].name;

        switch (bestResult.position) {
            case '1':
                bestResultLabel += ' Champion';
                break;
            case '2':
                bestResultLabel += ' Runner Up';
                break;
            case '3':
                bestResultLabel += ' 3rd';
                break;
            default:
                bestResultLabel += ` ${bestResult.position}th`;
        }

        const tournamentDatesDesc = Object.keys(resultsByStartDate)
            .sort((a, b) => (new Date(b)).getTime() - (new Date(a)).getTime());

        let currentTeam: null|string = null;
        let currentRegion: null|string = null;
        for (const date of tournamentDatesDesc) {
            const result = resultsByStartDate[date];
            if (!result) continue;

            const tournament = tournamentsDataByPath[result.tournament_path];
            if (!tournament) continue;

            currentTeam = result.team_path;
            currentRegion = tournament.region;

            if (tournament.region !== 'International') break;
        }

        this._playerPath = playerDbRow.path_name;
        this._name = playerDbRow.name;
        this._currentTeam = teamDbRows.find(t => t.path_name === currentTeam)!.name;
        this._historicTeams = Array.from(new Set(
            teamDbRows.map(t => t.name),
        )).filter(t => t !== this._currentTeam);
        this._currentRegion = currentRegion || 'Unknown';
        this._historicRegions = Array.from(new Set(allRegions)).filter(r => r !== currentRegion);
        this._roles = JSON.parse(playerDbRow.roles || '[]');
        this._nationalities = JSON.parse(playerDbRow.nationalities || '[]');
        this._debut = tournamentDatesDesc.at(-1)!;
        this._greatestAchievement = {
            label: bestResultLabel,
            score: highestScore,
            liquipedia_weight: bestResult.liquipedia_weight || 0,
        };
    }

    guessAgainst(correctProfile: PlayerProfile) : GuessResult {
        const correctDebut = correctProfile._debut;
        const ourDebut = this._debut;

        let debutHint: GuessHintOptions;
        if (correctDebut === ourDebut) {
            debutHint = 'CORRECT';
        } else if (correctDebut < ourDebut) {
            debutHint = 'CORRECT_IS_LOWER';
        } else {
            debutHint = 'CORRECT_IS_HIGHER';
        }

        const correctRegion = correctProfile._currentRegion;
        const ourRegion = this._currentRegion;
        const ourHistoricRegions = this._historicRegions;

        let regionHint: GuessHintOptions;
        if (correctRegion === ourRegion) {
            regionHint = 'CORRECT';
        } else if (ourHistoricRegions.includes(correctRegion)) {
            regionHint = 'PARTIAL';
        } else {
            regionHint = 'INCORRECT';
        }

        const correctTeam = correctProfile._currentTeam;
        const ourTeam = this._currentTeam;
        const ourHistoricTeams = this._historicTeams;

        let teamHint: GuessHintOptions;
        if (correctTeam === ourTeam) {
            teamHint = 'CORRECT';
        } else if (ourHistoricTeams.includes(correctTeam)) {
            teamHint = 'PARTIAL';
        } else {
            teamHint = 'INCORRECT';
        }

        const correctRoles = correctProfile._roles;
        const ourRoles = this._roles;
        const rolesOverlap = ourRoles.filter(r => correctRoles.includes(r));

        let roleHint: GuessHintOptions;
        if (
            correctRoles.length === rolesOverlap.length &&
            ourRoles.length === rolesOverlap.length
        ) {
            roleHint = 'CORRECT';
        } else if (rolesOverlap.length > 0) {
            roleHint = 'PARTIAL';
        } else {
            roleHint = 'INCORRECT';
        }

        const correctNationalities = correctProfile._nationalities;
        const ourNationalities = this._nationalities;
        const nationalitiesOverlap = ourNationalities.filter(n => correctNationalities.includes(n));

        let nationalityHint: GuessHintOptions;
        if (
            correctNationalities.length === nationalitiesOverlap.length &&
            ourNationalities.length === nationalitiesOverlap.length
        ) {
            nationalityHint = 'CORRECT';
        } else if (nationalitiesOverlap.length > 0) {
            nationalityHint = 'PARTIAL';
        } else {
            nationalityHint = 'INCORRECT';
        }

        const correctBestResultLabel = correctProfile._greatestAchievement.label;
        const ourBestResultLabel = this._greatestAchievement.label;
        const correctBestResultScore = correctProfile._greatestAchievement.score;
        const ourBestResultScore = this._greatestAchievement.score;

        let bestAchievementHint: GuessHintOptions;
        if (correctBestResultScore === ourBestResultScore) {
            if (correctBestResultLabel === ourBestResultLabel) {
                bestAchievementHint = 'CORRECT';
            } else {
                bestAchievementHint = 'PARTIAL';
            }
        } else if (correctBestResultScore < ourBestResultScore) {
            bestAchievementHint = 'CORRECT_IS_LOWER';
        } else {
            bestAchievementHint = 'CORRECT_IS_HIGHER';
        }

        return {
            guess: this._name,
            overall: this._playerPath === correctProfile._playerPath,
            region: {
                hint: regionHint,
                details: this._currentRegion,
            },
            team: {
                hint: teamHint,
                details: this._currentTeam,
            },
            role: {
                hint: roleHint,
                details: this._roles.join(', '),
            },
            nationality: {
                hint: nationalityHint,
                details: this._nationalities.join(', '),
            },
            debut: {
                hint: debutHint,
                details: this._debut,
            },
            greated_achievement: {
                hint: bestAchievementHint,
                details: this._greatestAchievement.label,
            },
        };
    }
}
