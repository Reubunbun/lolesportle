<?php
namespace App\Console\Commands;

use Illuminate\Console\Command;
use function Laravel\Prompts\search;
use App\Enum\GuessResponse;
use App\Enum\Region;
use App\Repository\{
    Players as PlayersRepository,
    Tournaments as TournamentsRepository,
    TournamentResults as TournamentResultsRepository,
};
use App\Model\{
    Database\Player as ModelPlayer,
    GameAnswer,
};

class Game extends Command
{
    protected $signature = 'game:start';
    protected $description = 'Test the game';

    function __construct(
        private PlayersRepository $_playersRepository,
        private TournamentsRepository $_tournamentsRepository,
        private TournamentResultsRepository $_tournamentResultsRepository,
    )
    {
        parent::__construct();
    }

    function _createAnswerFromPlayer(ModelPlayer $player) : GameAnswer
    {
        $tournamentResults = $this->_tournamentResultsRepository
            ->getAllByPlayerUrls($player->getAllUrls());

        $resultsByTournamentUrl = $tournamentResults
            ->groupBy(fn ($tr) => $tr->getTournamentUrl());

        $tournamentUrls = $resultsByTournamentUrl->keys()->all();

        $tournaments = $this->_tournamentsRepository
            ->getAllByTournamentUrls($tournamentUrls)
            ->sortBy(fn ($t) => $t->getStartDate());

        return new GameAnswer(
            $player,
            $tournaments,
            $tournamentResults,
        );
    }

    function handle()
    {
        $regionOptions = [
            "All Regions" => null,
            "Europe" => Region::EU,
            "North America" => Region::NA,
            "Korea" => Region::KR,
            "China" => Region::CN,
            "Brazil" => Region::BR,
            "Aisa Pacific" => Region::APAC,
        ];

        $regionChoice = search(
            'Restrict to region:',
            fn ($input) => collect($regionOptions)
                ->filter(fn ($r, $name) =>
                    str_contains(
                        strtolower($name),
                        strtolower($input),
                    )
                )
                ->mapWithKeys(fn ($r, $name) => [$name => $name])
                ->all(),
            scroll: count($regionOptions),
        );

        $validPlayers = $this->_playersRepository->getPlayersValidForGame($regionOptions[$regionChoice]);
        $correctAnswer = $this->_createAnswerFromPlayer($validPlayers->random());
        dump($correctAnswer);
        $this->info("\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n");

        /** @var array<string, ModelPlayer[]> */
        $playersByName = [];
        foreach ($validPlayers as $player) {
            if (!isset($playersByName[$player->getName()])) {
                $playersByName[$player->getName()] = [];
            }
            $playersByName[$player->getName()][] = $player;
        }

        /** @var array<string, ModelPlayer> */
        $playersByUniqueName = [];
        foreach ($playersByName as $name => $players) {
            unset($playersByName[$name]);

            if (count($players) === 1) {
                $playersByUniqueName[$name] = $players[0];
                continue;
            }

            foreach ($players as $player) {
                $nationalities = implode(
                    ', ',
                    $player->getNationalities(),
                );

                $uniqueName = "{$name} ({$nationalities})";
                $playersByUniqueName[$uniqueName] = $player;
            }
        }

        $foundCorrectAnswer = false;
        while (!$foundCorrectAnswer) {
            $choice = search(
                'Guess a player',
                fn ($input) => collect(array_keys($playersByUniqueName))
                    ->filter(fn ($p) =>
                        str_contains(
                            strtolower($p),
                            strtolower($input),
                        )
                    )
                    ->sort()
                    ->mapWithKeys(fn ($p) => [$p => $p])
                    ->all(),
                scroll: 20,
            );

            $guessedPlayer = $playersByUniqueName[$choice];
            $guessedAnswer = $this->_createAnswerFromPlayer($guessedPlayer);

            $guessResults = $correctAnswer->compareTo($guessedAnswer);

            foreach ($guessResults as $hint => $result) {
                if ($hint === 'Result') {
                    continue;
                }
                $this->info("{$hint}: {$result}");
            }

            if ($guessResults['Result'] === GuessResponse::CORRECT) {
                $foundCorrectAnswer = true;
            }
        }
    }
}
