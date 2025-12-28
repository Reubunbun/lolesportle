import { type FC, useState } from 'react';
import {
  Text,
  Flex,
  Button,
  TextField,
  Card,
  Spinner,
  Link,
  Table,
} from '@radix-ui/themes';
import { useQuery, useMutation } from '@tanstack/react-query';
import HintCell from './components/HintCell';

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
  const [playerInput, setPlayerInput] = useState<string>('');
  // eslint-disable-next-line
  const [guessHistory, setGuessHistory] = useState<any[]>([]);

  const { isPending, error } = useQuery<GetGameResponse>({
    queryKey: ['gameData'],
    queryFn: () => fetch(`${import.meta.env.VITE_API_URL}/game`).then(res => res.json()),
    refetchOnMount: 'always',
  });

  const makeGuess = useMutation({
    mutationFn: (data: { guess: string }) => fetch(
      `${import.meta.env.VITE_API_URL}/game`,
      {
        method: 'POST',
        body: JSON.stringify({ ...data, region })
      }
    )
      .then(res => res.json())
      .then(res => setGuessHistory(prev => [{guess: playerInput, ...res}, ...prev]))
  });

  if (isPending) {
    return <Spinner />;
  }

  if (error) {
    return <div>error!</div>;
  }

  return (
    <Flex
      direction='column'
      gap='5'
    >
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
      <Flex gap='2'>
        <TextField.Root
          placeholder='Search for a player...'
          style={{ flex: 1 }}
          value={playerInput}
          onChange={e => setPlayerInput(e.target.value)}
        />
        <Button
          style={{ cursor: 'pointer' }}
          onClick={() => makeGuess.mutate({ guess: playerInput })}
          loading={ makeGuess.isPending }
        >Guess</Button>
      </Flex>
      {guessHistory.length > 0 && (
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
            {guessHistory.map((guess, i) => (
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
  );
};

export default Game;
