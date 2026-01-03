import { type FC, useEffect, useState } from 'react';
import {
  Text,
  Flex,
  Card,
  Spinner,
  Link,
  Table,
  Button,
  Box,
} from '@radix-ui/themes';
import { NavLink } from 'react-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { type Region } from '@/types';
import useSavedGameData from '@/hooks/useSavedGameData';
import lolesportleApi from '@/helpers/lolesportleApi';
import HintCell from './components/HintCell';
import SearchBar from './components/SearchBar';
import { ROUTES } from '@/constants';

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

type GetGameResponse = { gameKey: string };
type Props = { region: Region };

const Game: FC<Props> = ({ region }) => {
  const [currentGuess, setCurrentGuess] = useState<string>('');
  const [savedGameData, dispatchGameData] = useSavedGameData();

  const { currentGameProgress, streak } = savedGameData[region];

  const {
    data: currentGameKey,
    isPending: isLoadingGameKey,
    error: errorGameKey,
  } = useQuery<GetGameResponse>({
    queryKey: ['gameKey'],
    queryFn: () => lolesportleApi('game', { method: 'GET' }),
    refetchOnMount: 'always',
  });

  const makeGuess = useMutation({
    mutationFn: (data: { guess: string }) => {
      if (!currentGameProgress) {
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
          payload: {  region, guessResult: res},
        }),
      );
    },
  });

  useEffect(() => {
    if (!currentGameKey?.gameKey) return;

    if (
      !currentGameProgress ||
      currentGameProgress.guesses.length === 0 ||
      (
        currentGameProgress.gameKey !== currentGameKey.gameKey &&
        currentGameProgress.won
      )
    ) {
      dispatchGameData({
        type: 'START_NEW_GAME',
        payload: { region, gameKey: currentGameKey.gameKey },
      });
      return;
    }
  }, [currentGameKey?.gameKey]);

  useEffect(() => {
    if (currentGuess === '') {
      return;
    }

    makeGuess.mutate({ guess: currentGuess });
  }, [currentGuess]);

  if (isLoadingGameKey) {
    return <Spinner />;
  }

  if (errorGameKey) {
    return <div>error!</div>;
  }

  return (
    <>
      <Flex direction='column' gap='5' width='100%'>
        {currentGameProgress && currentGameProgress.won
          ? (
            <Card
              variant='surface'
              style={{ backgroundColor: 'var(--gray-a5)' }}
            >
              <Flex p='3' direction='column' gap='2' justify='center' align='center'>
                <Text size='4' weight='bold'>🎉 You guessed correctly! 🎉</Text>
                <Text size='4' weight='medium'>🔥 Your streak for {regionToDisplayText(region)} is now {streak.length} </Text>
              </Flex>
              <Box style={{ width: '100%', borderTop: '2px solid black' }} />
              <Flex direction='column' align='start' gap='2' pt='2'>
                <Button variant='ghost' asChild>
                  <NavLink to={ROUTES.HOME}>Try a different mode</NavLink>
                </Button>
                {currentGameProgress.gameKey !== currentGameKey.gameKey && (
                  <Button
                    style={{ cursor: 'pointer' }}
                    variant='ghost'
                    onClick={() => dispatchGameData({
                      type: 'START_NEW_GAME',
                      payload: { region, gameKey: currentGameKey.gameKey },
                    })}
                  >
                    Play game for {currentGameKey.gameKey}
                  </Button>
                )}
              </Flex>
            </Card>
          )
          : (
            <>
              <Card
                variant='surface'
                style={{ backgroundColor: 'var(--gray-a5)' }}
              >
                <Flex p='3' direction='column' gap='2'>
                  <Text size='4' weight='medium'>
                    Guess today's{region === 'ALL_HARD' ? ' hard mode' : ' '}
                    {region === 'ALL' || region === 'ALL_HARD' ? 'LoL Esports' : regionToDisplayText(region)}
                    Player!
                  </Text>
                  <Text size='2' weight='regular' style={{ lineHeight: '1.4' }}>
                    Eligible players have competed in
                    {(() => {
                      switch (region) {
                        case 'ALL_HARD':
                          return <>any <Link href='https://liquipedia.net/leagueoflegends/S-Tier_Tournaments'>S-Tier competition</Link> as defined by Liquipedia</>;
                        case 'ALL':
                          return <>an S-Tier region within the last two years</>;
                        default:
                          return <>{regionToDisplayText(region)} within the last two year</>;
                      }
                    })()}
                  </Text>
                  {currentGameProgress?.gameKey !== currentGameKey.gameKey && (
                    <>
                      <Box style={{ width: '100%', borderTop: '2px solid black' }} />
                      <Flex gap='1'>
                        <Text size='2' weight='regular'>Continuing progress from {currentGameProgress?.gameKey} -</Text>
                        <Button
                          style={{ cursor: 'pointer' }}
                          variant='ghost'
                          onClick={() => dispatchGameData({
                            type: 'START_NEW_GAME',
                            payload: { region, gameKey: currentGameKey.gameKey },
                          })}
                        >Switch to today's game</Button>
                      </Flex>
                    </>
                  )}
                </Flex>
              </Card>
              <SearchBar
                onSelectPlayer={setCurrentGuess}
                isGuessing={makeGuess.isPending}
              />
            </>
          )
        }
        {currentGameProgress && currentGameProgress.guesses.length > 0 && (
          <Table.Root>
            <Table.Header>
              <Table.Row style={{ textAlign: 'center', verticalAlign: 'center' }}>
                <Table.ColumnHeaderCell>Player</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Region Last Played In</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Team Last Played In</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Role(s)</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Nationality</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Debut</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Greatest Acheivement</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {currentGameProgress.guesses.map((guess, i) => (
                <Table.Row key={i} style={{ height: '100px' }}>
                  <HintCell hint={{ hint: 'NEUTRAL', details: guess.guess }} />
                  <HintCell hint={guess.region} />
                  <HintCell hint={guess.team} />
                  <HintCell hint={guess.role} />
                  <HintCell hint={guess.nationality} />
                  <HintCell hint={guess.debut} />
                  <HintCell hint={guess.greated_achievement} />
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        )}
      </Flex>
    </>
  );
};

export default Game;
