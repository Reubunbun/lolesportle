import { Players as PlayersRepository } from '@shared/repository/sqlite';

type Dependencies = {
    playersRepo: PlayersRepository,
};

export default class PlayerSearchService {
    constructor(private _deps: Dependencies) {}

    async searchPlayers(searchTerm: string) {
        const teamMatches = await this._deps.playersRepo.getMultipleLastPlayedForteam(searchTerm);
        let nameMatches = await this._deps.playersRepo.getMultipleBySearchTerm(searchTerm);
        nameMatches = nameMatches.filter(pm => !teamMatches.find(tm => tm.path_name === pm.path_name));

        const allMatches = [ ...teamMatches, ...nameMatches ];

        // Check for any names that appear more than once
        const nameToCount: Record<string, number> = {};
        for (const { name } of allMatches) {
            if (!(name in nameToCount)) {
                nameToCount[name] = 1;
                continue;
            }

            nameToCount[name]++;
        }

        for (const player of allMatches) {
            const { name, path_name } = player;

            if (nameToCount[name] > 1) {
                player.name = path_name.replace(/_/g, ' ');
            }
        }

        return allMatches.slice(0, 10);
    }
}
