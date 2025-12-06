import type { Tables } from 'knex/types/tables';
import S3 from './s3';

type Player = Pick<
    Tables['players'],
    'path_name'
        | 'name'
        | 'alt_names'
        | 'nationalities'
        | 'signature_champions'
        | 'birth_date'
        | 'roles'
>;

type Team = Pick<Tables['teams'], 'path_name' | 'name'>;

type Tournament = Pick<
    Tables['tournaments'],
    'path_name'
        | 'name'
        | 'series'
        | 'start_date'
        | 'end_date'
        | 'no_participants'
>;

type TournamentResult = Pick<
    Tables['tournament_results'],
        'tournament_path'
            | 'player_path'
            | 'team_path'
            | 'position'
            | 'beat_percent'
            | 'liquipedia_weight'
>;

export type JsonFiles = {
    'players.json': Record<string, Player>; // Players keyed by path
    'teams.json': Record<string, Team>; // Teams keyed by path
    'tournaments.json': Record<string, Tournament>; // Tournaments keyed by path
    'resultsByPlayer.json': Record<string, TournamentResult[]>; // Results keyed by player path
    'resultsByTeam.json': Record<string, TournamentResult[]>; // Results keyed by team path
};

export async function uploadDump<K extends keyof JsonFiles>(fileName: K, json: JsonFiles[K]) {
    await (new S3()).uploadFile(
        JSON.stringify(json),
        `jsonDumps/${fileName}`,
    );
}

export async function downloadDump<K extends keyof JsonFiles>(fileName: K) : Promise<JsonFiles[K]> {
    const contents = await (new S3()).getFileContents(fileName);
    return JSON.parse(contents);
}
