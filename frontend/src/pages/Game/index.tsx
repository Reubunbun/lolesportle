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
import { useSavedGameData } from '@/hooks/useLocalStorage';
import HintCell from './components/HintCell';
import SearchBar from './components/SearchBar';

function regionToTournament (region: string) {
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
type Props = { region: string };

const Game: FC<Props> = ({ region }) => {
  const [currentGuess, setCurrentGuess] = useState<string>('');
  const [savedGameData, setSavedGameData] = useSavedGameData();
  const [showOldGameToast, setShowOldGameToast] = useState(false);

  const {
    data: currentDateKey,
    isPending: isLoadingDateKey,
    error: errorDateKey,
  } = useQuery<GetGameResponse>({
    queryKey: ['gameData'],
    queryFn: () => fetch(`${import.meta.env.VITE_API_URL}/game`).then(res => res.json()),
    refetchOnMount: 'always',
  });

  const makeGuess = useMutation({
    mutationFn: (data: { guess: string }) => fetch(
      `${import.meta.env.VITE_API_URL}/game`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, region, dateKey: savedGameData.currentGameProgress!.dateKey }),
      },
    )
      .then(res => {
        if (!res.ok) {
          return console.error(res.statusText);
        }
        return res.json();
      })
      .then(res => {
        if (res) {
          setSavedGameData(prev => ({
            ...prev,
            currentGameProgress: {
              dateKey: prev.currentGameProgress!.dateKey,
              guesses: [res, ...(prev.currentGameProgress?.guesses || [])],
              won: res.overall,
            },
          }));
        }
      }),
  });

  useEffect(() => {
    console.log(currentDateKey);

    if (!currentDateKey?.gameKey) return;

    if (
      !savedGameData.currentGameProgress ||
      savedGameData.currentGameProgress.guesses.length === 0 ||
      savedGameData.currentGameProgress.won
    ) {
      setSavedGameData(prev => ({
        ...prev,
        currentGameProgress: {
          dateKey: currentDateKey!.gameKey,
          guesses: [],
          won: false,
        },
      }));

      return;
    }

    if (
      savedGameData.currentGameProgress.dateKey === currentDateKey.gameKey ||
      showOldGameToast
    ) return;

    setShowOldGameToast(true);
  }, [currentDateKey?.gameKey]);

  useEffect(() => {
    if (currentGuess === '') {
      return;
    }

    makeGuess.mutate({ guess: currentGuess });
  }, [currentGuess]);

  if (isLoadingDateKey) {
    return <Spinner />;
  }

  if (errorDateKey) {
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
        {(savedGameData.currentGameProgress?.guesses || []).length > 0 && (
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
              {savedGameData.currentGameProgress!.guesses.map((guess, i) => (
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
            Continuing game for {savedGameData.currentGameProgress?.dateKey}
          </Toast.Description>

          <Toast.Action asChild altText="Switch to today's game">
            <Button
              size='2'
              variant='soft'
              style={{ cursor: 'pointer' }}
              onClick={() => {
                setSavedGameData(prev => ({
                  ...prev,
                  currentGameProgress: {
                    dateKey: currentDateKey!.gameKey,
                    guesses: [],
                    won: false,
                  },
                }));
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
