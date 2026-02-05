import { type FC, useEffect, useRef, useState } from 'react';
import { Text, Flex, Card, Spinner, Table, Box } from '@radix-ui/themes';
import { useQuery, useMutation } from '@tanstack/react-query';
import Confetti from 'react-confetti';
import type { Region, GetGameResponse } from '@/types';
import useSavedGameData from '@/hooks/useSavedGameData';
import lolesportleApi from '@/helpers/lolesportleApi';
import { HintCell, SearchBar, GameWonCard, GameInfoCard } from './components';

function regionToDisplayText(region: Region) {
  switch(region) {
    case 'KR':
      return 'LCK';
    case 'CH':
      return 'LPL';
    case 'EU':
      return 'LEC';
    case 'NA':
      return 'LCS';
    case 'ALL':
      return 'All Regions';
    case 'ALL_HARD':
      return 'All Regions - Hard Mode';
  }
};

const TABLE_COLS = [
  {text: 'Player'},
  {text: 'Region'},
  {text: 'Team'},
  {text: 'Role(s)'},
  {text: 'Nationality'},
  {text: 'Debut'},
  {text: 'Best Achievement'},
];

type Props = { region: Region };

const Game: FC<Props> = ({ region }) => {
  const [currentGuess, setCurrentGuess] = useState<string>('');
  const [savedGameData, dispatchGameData] = useSavedGameData();
  const [showConfetti, setShowConfetti] = useState<boolean>(false);
  const madeAGuess = useRef<boolean>(false);
  const guessesFromPrevious = useRef<string[]>(
    (savedGameData[region].currentGameProgress?.guesses || []).map(g => g.guess),
  );

  const { currentGameProgress, streak } = savedGameData[region];

  const {
    data: gameMetaData,
    isPending: isLoadingGameMeta,
    error: errorGameMeta,
  } = useQuery<GetGameResponse>({
    queryKey: ['gameKey'],
    queryFn: () => lolesportleApi('game', { method: 'GET' }),
    refetchOnMount: 'always',
  });

  const makeGuess = useMutation({
    mutationFn: (data: { guess: string }) => {
      if (!currentGameProgress || !gameMetaData) {
        throw new Error('Made guess without starting game');
      }

      return lolesportleApi(
        'game',
        {
          method: 'POST',
          body: JSON.stringify({
            ...data, region,
            dateKey: currentGameProgress.gameKey
          }),
        },
      ).then(
        res => dispatchGameData({
          type: 'SET_GUESS_RESULT',
          payload: {
            region,
            guessResult: res,
            currentGameKey: gameMetaData.gameKey,
            previousGameKey: gameMetaData.previousPlayers.gameKey,
          },
        }),
      );
    },
  });

  useEffect(() => {
    if (!gameMetaData?.gameKey) return;

    if (
      !currentGameProgress ||
      currentGameProgress.guesses.length === 0 ||
      (
        currentGameProgress.gameKey !== gameMetaData.gameKey &&
        currentGameProgress.won
      )
    ) {
      dispatchGameData({
        type: 'START_NEW_GAME',
        payload: { region, gameKey: gameMetaData.gameKey, hints: gameMetaData.hints[region] },
      });
      return;
    }
  }, [gameMetaData?.gameKey]);

  useEffect(() => {
    if (currentGuess === '') {
      return;
    }

    madeAGuess.current = true;
    makeGuess.mutate({ guess: currentGuess });
  }, [currentGuess]);

  useEffect(() => {
    if (currentGameProgress?.won && madeAGuess.current) {
      setShowConfetti(true);

      const timeoutId = setTimeout(() => setShowConfetti(false), 10_000);
      return () => clearTimeout(timeoutId);
    }
  }, [currentGameProgress?.won]);

  if (isLoadingGameMeta) {
    return <Flex width='100%' justify='center'><Spinner /></Flex>;
  }

  if (errorGameMeta) {
    return <Flex width='100%' justify='center'><Text>Internal server error - please try refreshing or check back later</Text></Flex>;
  }

  return (
    <>
      {showConfetti &&
        <div style={{ position: 'absolute', top: 0, left: 0, zIndex: 1000 }}><Confetti /></div>}
      <Flex
        asChild
        direction='column'
        width='min(95%, 880px)'
        gap={{ initial: '3', md: '6' }}
      >
        <div>
          {currentGameProgress && currentGameProgress.won
          ? (
            <div>
              <GameWonCard
                region={regionToDisplayText(region)}
                streak={streak.length}
                todaysGame={
                  currentGameProgress.gameKey !== gameMetaData!.gameKey
                    ? {
                        date: gameMetaData!.gameKey,
                        onClickStart: () => dispatchGameData({
                          type: 'START_NEW_GAME',
                          payload: { region, gameKey: gameMetaData!.gameKey, hints: gameMetaData!.hints[region] },
                        }),
                      }
                    : undefined
                }
              />
            </div>
          )
          : (
            <div>
              <GameInfoCard
                region={region}
                regionDisplay={regionToDisplayText(region)}
                numGuesses={(currentGameProgress?.guesses || []).length}
                gameHints={(currentGameProgress?.hints || { tournament: '', team: '', player: '' })}
                previousGame={
                  currentGameProgress &&
                  currentGameProgress?.gameKey !== gameMetaData.gameKey
                    ? {
                      date: currentGameProgress.gameKey,
                      onClickStart: () => dispatchGameData({
                        type: 'START_NEW_GAME',
                        payload: { region, gameKey: gameMetaData.gameKey, hints: gameMetaData.hints[region] },
                      }),
                    }
                    : undefined
                }
              />
              <SearchBar
                onSelectPlayer={setCurrentGuess}
                isGuessing={makeGuess.isPending}
                alreadyGuessed={(currentGameProgress?.guesses || []).map(g => g.guess)}
              />
            </div>
          )
        }
        {currentGameProgress && currentGameProgress.guesses.length > 0 && (
          <Table.Root className='resultTable' layout='fixed'>
             <colgroup>
              <col span={TABLE_COLS.length} style={{ width: `${100 / TABLE_COLS.length}%` }} />
            </colgroup>
            <Table.Header>
              <Table.Row
                style={{
                  textAlign: 'center',
                  verticalAlign: 'center',
                  position: 'sticky',
                  top: 0,
                  background: 'var(--gray-2)',
                  zIndex: 100,
                }}
              >
                {TABLE_COLS.map(colInfo =>
                  <Table.ColumnHeaderCell key={colInfo.text} style={{ verticalAlign: 'bottom' }}>
                    <Text size={{ initial: '1', md: '2' }} style={{ fontSize: 'clamp(0.4rem, 1.5vw, 0.9rem)' }}>
                      {colInfo.text}
                    </Text>
                  </Table.ColumnHeaderCell>
                )}
              </Table.Row>
            </Table.Header>
            <Table.Body style={{overflow: 'scroll'}}>
              {currentGameProgress.guesses.map(guess => {
                const playAnim = !guessesFromPrevious.current.includes(guess.guess);
                return (
                  <Table.Row key={guess.guess}>
                    <HintCell playAnim={playAnim} colNum={0} hint={'NEUTRAL'} details={guess.guess} />
                    <HintCell playAnim={playAnim} colNum={1} hint={guess.region.hint} details={guess.region.details} />
                    <HintCell playAnim={playAnim} colNum={2} hint={guess.team.hint} details={guess.team.details} />
                    <HintCell playAnim={playAnim} colNum={3} hint={guess.role.hint} details={guess.role.details} />
                    <HintCell playAnim={playAnim} colNum={4} hint={guess.nationality.hint} details={guess.nationality.details} />
                    <HintCell playAnim={playAnim} colNum={5} hint={guess.debut.hint} details={guess.debut.details} />
                    <HintCell playAnim={playAnim} colNum={6} hint={guess.greated_achievement.hint} details={guess.greated_achievement.details} />
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table.Root>
        )}
        {(gameMetaData && currentGameProgress?.gameKey === gameMetaData.gameKey) && (
          <Flex justify='center' align='end' pb='5' height='100%'>
            <Box width='max(50%, 300px)'>
              <Card
                variant='surface'
                style={{ backgroundColor: 'var(--gray)', paddingTop: '5px', paddingBottom: '5px' }}
              >
                <Flex direction='column' align='center'>
                  <Text>Yesterday's result was: {gameMetaData.previousPlayers.results[region].replace(/_/g, ' ')}</Text>
                </Flex>
              </Card>
            </Box>
          </Flex>
        )}
        </div>
      </Flex>
    </>
  );
};

export default Game;
