import DailyPlayer from '@shared/repository/dynamoDb/dailyPlayer';
import PlayerSelectService from './playerSelectService';
import { type ValidRegions } from './guessService';

type Dependencies = {
    dailyPlayerRepo: DailyPlayer,
    playerSelectService: PlayerSelectService,
}

export default class DailyPlayerService {
    constructor(private _deps: Dependencies) {}

    async getCurrentDateKeyAndHints() {
        const todaysPlayers = (await this._deps.dailyPlayerRepo.getMostRecentPlayers(1))[0];
        return {
            gameKey: todaysPlayers.date,
            hints: {
                'ALL': todaysPlayers.playerPathAll.hints,
                'ALL_HARD': todaysPlayers.playerPathHard.hints,
                'EU': todaysPlayers.playerPathEU.hints,
                'NA': todaysPlayers.playerPathNA.hints,
                'KR': todaysPlayers.playerPathKR.hints,
                'CH': todaysPlayers.playerPathCH.hints,
            }
        };
    }

    async getPreviousPlayers() : Promise<{gameKey: string, results: Record<ValidRegions, string>}> {
        const previousPlayers = (await this._deps.dailyPlayerRepo.getMostRecentPlayers(2))[1];

        return {
            gameKey: previousPlayers.date,
            results: {
                'ALL': previousPlayers.playerPathAll.path,
                'ALL_HARD': previousPlayers.playerPathHard.path,
                'EU': previousPlayers.playerPathEU.path,
                'NA': previousPlayers.playerPathNA.path,
                'KR': previousPlayers.playerPathKR.path,
                'CH': previousPlayers.playerPathCH.path,
            },
        };
    }

    private async _insertPlayersForDay(date: string) {
        const dailyPlayerTable = new DailyPlayer();
        const lastWeekOfPlayers = await dailyPlayerTable.getMostRecentPlayers(7);

        const yearNow = (new Date()).getUTCFullYear();
        const minDateEnded = `${yearNow - 2}-01-01`;

        const playerForAll = await this._deps.playerSelectService.getRandomPlayerForRegion(
            lastWeekOfPlayers.map(row => row.playerPathAll.path),
            minDateEnded,
        );
        const hintForAll = await this._deps.playerSelectService.getHintsForPlayer(playerForAll);

        const playerForHard = await this._deps.playerSelectService.getRandomPlayerForRegion(
            lastWeekOfPlayers.map(row => row.playerPathHard.path),
        );
        const hintForHard = await this._deps.playerSelectService.getHintsForPlayer(playerForHard);

        const playerForEU = await this._deps.playerSelectService.getRandomPlayerForRegion(
            lastWeekOfPlayers.map(row => row.playerPathEU.path),
            minDateEnded,
            'EU',
        );
        const hintForEU = await this._deps.playerSelectService.getHintsForPlayer(playerForEU);

        const playerForNA = await this._deps.playerSelectService.getRandomPlayerForRegion(
            lastWeekOfPlayers.map(row => row.playerPathNA.path),
            minDateEnded,
            'NA',
        );
        const hintForNA = await this._deps.playerSelectService.getHintsForPlayer(playerForNA);

        const playerForCH = await this._deps.playerSelectService.getRandomPlayerForRegion(
            lastWeekOfPlayers.map(row => row.playerPathCH.path),
            minDateEnded,
            'China',
        );
        const hintForCH = await this._deps.playerSelectService.getHintsForPlayer(playerForCH);

        const playerForKR = await this._deps.playerSelectService.getRandomPlayerForRegion(
            lastWeekOfPlayers.map(row => row.playerPathKR.path),
            minDateEnded,
            'Korea',
        );
        const hintForKR = await this._deps.playerSelectService.getHintsForPlayer(playerForKR);

        console.log({
            playerForAll,
            hintForAll,
            playerForHard,
            hintForHard,
            playerForEU,
            hintForEU,
            playerForNA,
            hintForNA,
            playerForCH,
            hintForCH,
            playerForKR,
            hintForKR,
        });

        await dailyPlayerTable.insert({
            date: date,
            playerPathAll: {
                path: playerForAll,
                hints: {
                    tournament: hintForAll.tournamentHint,
                    team: hintForAll.teamHint,
                    player: hintForAll.playerHint,
                },
            },
            playerPathHard: {
                path: playerForHard,
                hints: {
                    tournament: hintForHard.tournamentHint,
                    team: hintForHard.teamHint,
                    player: hintForHard.playerHint
                },
            },
            playerPathEU: {
                path: playerForEU,
                hints: {
                    tournament: hintForEU.tournamentHint,
                    team: hintForEU.teamHint,
                    player: hintForEU.playerHint,
                },
            },
            playerPathNA: {
                path: playerForNA,
                hints: {
                    tournament: hintForNA.tournamentHint,
                    team: hintForNA.teamHint,
                    player: hintForNA.playerHint,
                },
            },
            playerPathCH: {
                path: playerForCH,
                hints: {
                    tournament: hintForCH.tournamentHint,
                    team: hintForCH.teamHint,
                    player: hintForCH.playerHint,
                },
            },
            playerPathKR: {
                path: playerForKR,
                hints: {
                    tournament: hintForKR.tournamentHint,
                    team: hintForKR.teamHint,
                    player: hintForKR.playerHint,
                },
            },
        });
    }

    async insertPlayersOfTheDay() {
        const dailyPlayerTable = new DailyPlayer();

        const todaysDate = (new Date()).toISOString().split('T')[0];
        const existingToday = await dailyPlayerTable.getByDate(todaysDate);
        if (!existingToday) {
            await this._insertPlayersForDay(todaysDate);
        }

        const yesterdaysDate = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const existingYesterday = await dailyPlayerTable.getByDate(yesterdaysDate);
        if (!existingYesterday) {
            await this._insertPlayersForDay(yesterdaysDate);
        }
    }
}
