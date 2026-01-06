import { type FC, useEffect, useRef, useState } from 'react';
import { Text, Flex, Card, Spinner, Link, Table, Button, Box, HoverCard } from '@radix-ui/themes';
import { NavLink } from 'react-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import Confetti from 'react-confetti';
import type { Region, GetGameResponse } from '@/types';
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

type Props = { region: Region };

const Game: FC<Props> = ({ region }) => {
  const [currentGuess, setCurrentGuess] = useState<string>('');
  const [savedGameData, dispatchGameData] = useSavedGameData();
  const [showConfetti, setShowConfetti] = useState<boolean>(false);
  const madeAGuess = useRef<boolean>(false);

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
        payload: { region, gameKey: gameMetaData.gameKey },
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
        style={{
          display: 'grid',
          gridTemplateRows: 'auto 1fr',
          gridTemplateColumns: 'min(95%, 880px)',
        }}
        height='100%'
        align='center'
        justify='center'
        gap='6'
      >
        <div>
          {currentGameProgress && currentGameProgress.won
          ? (
            <Card
              variant='surface'
              style={{ backgroundColor: 'var(--gray-a2)' }}
            >
              <Flex p='3' direction='column' gap='2' justify='center' align='center'>
                <Text size='4' weight='bold'>🎉 You guessed correctly! 🎉</Text>
                <Text size='4' weight='medium'>🔥 Your streak for {regionToDisplayText(region)} is now {streak.length} 🔥</Text>
              </Flex>
              <Box style={{ width: '100%', borderTop: '2px solid black' }} />
              <Flex direction='column' align='start' gap='2' pt='2'>
                <Button variant='ghost' asChild>
                  <NavLink to={ROUTES.HOME}>Try a different mode</NavLink>
                </Button>
                {currentGameProgress.gameKey !== gameMetaData.gameKey && (
                  <Button
                    style={{ cursor: 'pointer' }}
                    variant='ghost'
                    onClick={() => dispatchGameData({
                      type: 'START_NEW_GAME',
                      payload: { region, gameKey: gameMetaData.gameKey },
                    })}
                  >
                    Play game for {gameMetaData.gameKey}
                  </Button>
                )}
              </Flex>
            </Card>
          )
          : (
            <div>
              <Card
                mb='4'
                variant='surface'
                style={{ backgroundColor: 'var(--gray-a2)' }}
              >
                <Flex p='3' direction='column' gap='2'>
                  <Text size='4' weight='medium'>
                    Guess today's{region === 'ALL_HARD' ? ' hard mode ' : ' '}
                    {region === 'ALL' || region === 'ALL_HARD' ? 'LoL Esports' : regionToDisplayText(region)}
                    {' '}Player!
                  </Text>
                  <Text size='2' weight='regular' style={{ lineHeight: '1.4' }}>
                    Eligible players have competed in{' '}
                    {(() => {
                      switch (region) {
                        case 'ALL_HARD':
                          return <>any <Link href='https://liquipedia.net/leagueoflegends/S-Tier_Tournaments' target='_blank'>S-Tier competition</Link> as defined by Liquipedia</>;
                        case 'ALL':
                          return <>an S-Tier region within the last two years</>;
                        default:
                          return <>{regionToDisplayText(region)} within the last two years</>;
                      }
                    })()}
                  </Text>
                  {currentGameProgress?.gameKey !== gameMetaData.gameKey && (
                    <>
                      <Box style={{ width: '100%', borderTop: '2px solid black' }} />
                      <Flex gap='1'>
                        <Text size='2' weight='regular'>Continuing progress from {currentGameProgress?.gameKey} -</Text>
                        <Button
                          style={{ cursor: 'pointer' }}
                          variant='ghost'
                          onClick={() => dispatchGameData({
                            type: 'START_NEW_GAME',
                            payload: { region, gameKey: gameMetaData.gameKey },
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
            </div>
          )
        }
        {currentGameProgress && currentGameProgress.guesses.length > 0 && (
          <Table.Root style={{ height: '100%', overflow: 'scroll' }}>
            <Table.Header>
              <Table.Row
                style={{
                  textAlign: 'center',
                  verticalAlign: 'center',
                  position: 'sticky',
                  top: 0,
                  background: 'var(--gray-a2)',
                  zIndex: 100,
                }}
              >
                <Table.ColumnHeaderCell>Player</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Region Last Played In</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Team Last Played In</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Role(s)</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Nationality</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Debut</Table.ColumnHeaderCell>
                <HoverCard.Root>
                  <HoverCard.Trigger>
                    <Table.ColumnHeaderCell style={{ cursor: 'pointer' }}>Greatest Acheivement*</Table.ColumnHeaderCell>
                  </HoverCard.Trigger>
                  <HoverCard.Content side='top' size='1' maxWidth='400px'>
                    <Text size='2'>
                      The player's best result in <Link href='https://liquipedia.net/leagueoflegends/S-Tier_Tournaments' target='_blank'>S-Tier competitions</Link>. Results from other competitions are not considered.
                    </Text>
                  </HoverCard.Content>
                </HoverCard.Root>
              </Table.Row>
            </Table.Header>
            <Table.Body style={{overflow: 'scroll'}}>
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
        {(gameMetaData && currentGameProgress?.gameKey === gameMetaData.gameKey) && (
          <Flex justify='center' align='end' pb='5' height='100%'>
            <Box width='50%'>
              <Card
                variant='surface'
                style={{ backgroundColor: 'var(--gray)', paddingTop: '5px', paddingBottom: '5px' }}
              >
                <Flex direction='column' align='center'>
                  <Text>Yesterday's result was: {gameMetaData.previousPlayers.results[region]}</Text>
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
