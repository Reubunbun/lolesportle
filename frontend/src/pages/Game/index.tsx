import './styles.css';
import { type FC, useEffect, useState } from 'react';
import {
  Text,
  Flex,
  Card,
  Spinner,
  Link,
  Table,
  Button,
} from '@radix-ui/themes';
import { Toast } from 'radix-ui';
import { useQuery, useMutation } from '@tanstack/react-query';
import { type Region } from '@/types';
import useSavedGameData from '@/hooks/useSavedGameData';
import lolesportleApi from '@/helpers/lolesportleApi';
import HintCell from './components/HintCell';
import SearchBar from './components/SearchBar';

function regionToTournament (region: Region) {
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
    default:
      return 'LoL Esports';
  }
};

type GetGameResponse = { gameKey: string };
type Props = { region: Region };

const Game: FC<Props> = ({ region }) => {
  const [currentGuess, setCurrentGuess] = useState<string>('');
  const [showOldGameToast, setShowOldGameToast] = useState(false);
  const [savedGameData, dispatchGameData] = useSavedGameData();

  const { currentGameProgress } = savedGameData[region];

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

    if (!currentGameProgress || currentGameProgress.guesses.length === 0) {
      dispatchGameData({
        type: 'START_NEW_GAME',
        payload: { region, gameKey: currentGameKey.gameKey },
      });
      return;
    }

    if (
      currentGameProgress.gameKey === currentGameKey.gameKey ||
      showOldGameToast
    ) return;

    setShowOldGameToast(true);
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
    <Toast.Provider>
      <Flex direction='column' gap='5'>
        <Card
          variant='surface'
          style={{ backgroundColor: 'var(--gray-a5)' }}
        >
          <Flex p='3' direction='column' gap='2'>
            <Text size='4' weight='medium'>Guess today's {regionToTournament(region)} Player!</Text>
            <Text size='2' weight='regular' style={{ lineHeight: '1.4' }}>
              Eligible players have competed in an <Link href='https://liquipedia.net/leagueoflegends/S-Tier_Tournaments'>S-Tier competition</Link> within the last two years
            </Text>
          </Flex>
        </Card>
        <SearchBar
          onSelectPlayer={setCurrentGuess}
          isGuessing={makeGuess.isPending}
        />
        {currentGameProgress && currentGameProgress.guesses.length > 0 && (
          <Table.Root>
            <Table.Header>
              <Table.Row style={{ textAlign: 'center', verticalAlign: 'center' }}>
                <Table.ColumnHeaderCell>Player</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Last Played In Region</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Last Played In Team</Table.ColumnHeaderCell>
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

      <Toast.Root
        open={showOldGameToast}
        onOpenChange={setShowOldGameToast}
        className='toast-root toast-attention'
        duration={Infinity}
      >
        <div className='toast-stripe' />

        <div className='toast-content'>
          <Toast.Description className='toast-description'>
            Continuing game for {currentGameProgress?.gameKey}
          </Toast.Description>

          <Toast.Action asChild altText="Switch to today's game">
            <Button
              size='2'
              variant='soft'
              style={{ cursor: 'pointer' }}
              onClick={() => {
                dispatchGameData({
                  type: 'START_NEW_GAME',
                  payload: { region, gameKey: currentGameKey.gameKey },
                });

                setShowOldGameToast(false);
              }}
            >
              Switch to today
            </Button>
          </Toast.Action>

           <Toast.Close asChild>
            <button className='toast-close' aria-label='Dismiss'>
              ×
            </button>
          </Toast.Close>
        </div>
      </Toast.Root>

      <Toast.Viewport className='toast-viewport' />
    </Toast.Provider>
  );
};

export default Game;
