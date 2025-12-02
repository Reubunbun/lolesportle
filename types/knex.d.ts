import { Knex } from "knex";

declare module "knex/types/tables" {
    interface Tables {
        players: {
            id: number;
            page_id: number;
            path_name: string;
            name: string;
            alt_names: string;
            birth_date: string;
            nationalities: string;
            roles: string;
            signature_champions: string;
        };

        teams: {
            id: number;
            page_id: number|null;
            path_name: string;
            name: string;
        };

        tournaments: {
            id: number;
            page_id: number;
            path_name: string;
            name: string;
            alt_names: string;
            series: string;
            start_date: string;
            end_date: string;
            no_participants: number;
            has_been_checked: boolean;
        };

        tournament_results: {
            id: number;
            tournament_path: string;
            player_path: string;
            team_path: string;
            position: string;
            beat_percent: number;
            liquipedia_weight: number;
        };
    }
}
