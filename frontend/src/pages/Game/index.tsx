import { type FC, useEffect, useRef, useState } from 'react';
import { Text, Flex, Card, Spinner, Link, Table, Button, Box, Dialog } from '@radix-ui/themes';
import { QuestionMarkCircledIcon, ArrowUpIcon, ArrowDownIcon } from '@radix-ui/react-icons';
import { NavLink } from 'react-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import Confetti from 'react-confetti';
import type { Region, GetGameResponse } from '@/types';
import useSavedGameData from '@/hooks/useSavedGameData';
import lolesportleApi from '@/helpers/lolesportleApi';
import HintCell from './components/HintCell';
import SearchBar from './components/SearchBar';
import { AMBER, RED, ROUTES } from '@/constants';

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
        gap={{ initial: '3', md: '6' }}
      >
        <div>
          {currentGameProgress && currentGameProgress.won
          ? (
            <Card
              variant='surface'
              style={{ backgroundColor: 'var(--gray-a2)' }}
            >
              <Flex p={{ initial: '1', md: '3' }} direction='column' gap='2' justify='center' align='center'>
                <Text size={{ initial: '2', md: '4' }} weight='bold'>🎉 You guessed correctly! 🎉</Text>
                <Text size={{ initial: '2', md: '4' }} weight='medium'>🔥 Your streak for {regionToDisplayText(region)} is now {streak.length} 🔥</Text>
              </Flex>
              <Box style={{ width: '100%', borderTop: '2px solid black' }} />
              <Flex direction='column' align='start' gap='2' pt='2'>
                <Button variant='ghost' asChild>
                  <NavLink to={ROUTES.HOME}>
                    <Text size={{ initial: '1', md: '3' }}>Try a different mode</Text>
                  </NavLink>
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
                <Flex p={{ initial: '0', md: '3' }} direction='column' gap='2' position='relative'>
                  <Dialog.Root>
                    <Dialog.Trigger>
                      <Button
                        variant='ghost'
                        size='4'
                        style={{ position: 'absolute', top: '-4px', right: '0', cursor: 'pointer' }}
                      >
                        <QuestionMarkCircledIcon width={24} height={24} />
                      </Button>
                    </Dialog.Trigger>
                    <Dialog.Content>
                      <Dialog.Title>Column Meanings</Dialog.Title>
                      <Dialog.Description></Dialog.Description>
                      <Box mt='3'>
                        <Text size='2' weight='bold'>Region: </Text>
                        <Text size='1'>
                          The region the player last competed in. <br />
                          <span style={{color: AMBER}}>Orange</span> = The correct answer has played in the same region, but not most recently. <br />
                          <span style={{color: RED}}>Red</span> = The correct answer has never played in the same region.
                        </Text>
                      </Box>
                      <Box mt='3'>
                        <Text size='2' weight='bold'>Team: </Text>
                        <Text size='1'>
                          The team the player last competed for. <br />
                          <span style={{color: AMBER}}>Orange</span> = The correct answer has played for the same team, but not most recently.<br />
                          <span style={{color: RED}}>Red</span> = The correct answer has never played for the same team.
                        </Text>
                      </Box>
                      <Box mt='3'>
                        <Text size='2' weight='bold'>Role(s): </Text>
                        <Text size='1'>
                          All the roles the player has played in throughout their career. <br />
                          <span style={{color: AMBER}}>Orange</span> = The correct answer has played in at least one of the same roles, but the roles don't entirely match.<br />
                          <span style={{color: RED}}>Red</span> = The correct answer has never played in any of the same roles.
                        </Text>
                      </Box>
                      <Box mt='3'>
                        <Text size='2' weight='bold'>Nationality: </Text>
                        <Text size='1'>
                          The nationalities of the player. <br />
                          <span style={{color: AMBER}}>Orange</span> = The correct answer shares at least one nationality, but the nationalities don't entirely match.<br />
                          <span style={{color: RED}}>Red</span> = The correct answer does not share any nationalities.
                        </Text>
                      </Box>
                      <Box mt='3'>
                        <Text size='2' weight='bold'>Debut: </Text>
                        <Text size='1'>
                          The date the player made their professional debut. <br />
                          <span style={{color: RED, display: 'inline-flex', alignItems: 'center'}}>
                            <ArrowUpIcon />
                          </span> = The correct answer debuted more recently.<br />
                          <span style={{color: RED, display: 'inline-flex', alignItems: 'center'}}>
                            <ArrowDownIcon />
                          </span> = The correct answer debuted less recently.
                        </Text>
                      </Box>
                      <Box mt='3' mb='3'>
                        <Text size='2' weight='bold'>Best Achievement: </Text>
                        <Text size='1'>
                          The player's best result in <Link href='https://liquipedia.net/leagueoflegends/S-Tier_Tournaments' target='_blank'>S-Tier competitions</Link> throughout their career. <br />
                          <span style={{color: RED, display: 'inline-flex', alignItems: 'center'}}>
                            <ArrowUpIcon />
                          </span> = The correct answer has achieved a higher accolade.<br />
                          <span style={{color: RED, display: 'inline-flex', alignItems: 'center'}}>
                            <ArrowDownIcon />
                          </span> = The correct answer has achieved a lower accolade.
                        </Text>
                      </Box>
                    </Dialog.Content>
                  </Dialog.Root>
                  <Text size={{ initial: '2', md: '4' }} weight='medium'>
                    Guess today's{region === 'ALL_HARD' ? ' hard mode ' : ' '}
                    {region === 'ALL' || region === 'ALL_HARD' ? 'LoL Esports' : regionToDisplayText(region)}
                    {' '}Player!
                  </Text>
                  <Text size={{ initial: '1', md: '2' }} weight='regular' style={{ lineHeight: '1.4' }}>
                    Eligible players have competed in{' '}
                    {(() => {
                      switch (region) {
                        case 'ALL_HARD':
                          return <>any <Link href='https://liquipedia.net/leagueoflegends/S-Tier_Tournaments' target='_blank'>S-Tier competition</Link> as defined by Liquipedia.</>;
                        case 'ALL':
                          return <>an S-Tier region within the last two years.</>;
                        default:
                          return <>{regionToDisplayText(region)} within the last two years.</>;
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
                alreadyGuessed={(currentGameProgress?.guesses || []).map(g => g.guess)}
              />
            </div>
          )
        }
        {currentGameProgress && currentGameProgress.guesses.length > 0 && (
          <Table.Root className='resultTable' style={{ height: '100%', minHeight: '250px', overflow: 'scroll' }} layout='fixed'>
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
                      <Text size={{ initial: '1', md: '2' }} style={{ fontSize: 'clamp(0.4rem, 1.5vw, 0.9rem)' }}>{colInfo.text}</Text>
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
