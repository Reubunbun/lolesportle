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

type GetGameResponse = { gameKey: string };

const Game: FC = () => {
  const { isPending, error } = useQuery<GetGameResponse>({
    queryKey: ['gameData'],
    queryFn: () => fetch('https://iq3gv3pj8d.execute-api.eu-west-1.amazonaws.com/prod/game').then(res => res.json()),
    refetchOnMount: 'always',
  });

  const makeGuess = useMutation({
    mutationFn: (data: { guess: string }) => fetch(
      'https://iq3gv3pj8d.execute-api.eu-west-1.amazonaws.com/prod/game',
      {
        method: 'POST',
        body: JSON.stringify(data)
      }
    ).then(res => res.json())
  });

  console.log(makeGuess.data);

  const [playerInput, setPlayerInput] = useState<string>('');

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
          <Text size='4' weight='medium'>Guess today's LoL Esports Player!</Text>
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
      <Table.Root>
        <Table.Header>
          <Table.Row style={{ textAlign: 'center', verticalAlign: 'center' }}>
            <Table.ColumnHeaderCell >Player</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Region</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Team</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Role</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Nationality</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Debut</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Greatest Acheivement</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <Table.Row style={{ height: '100px' }}>
            <HintCell hint={{ hint: 'NEUTRAL', details: 'Faker' }} />
            <HintCell hint={{ hint: 'CORRECT', details: 'Korea' }} />
            <HintCell hint={{ hint: 'CORRECT_IS_HIGHER', details: 'T1' }} />
            <HintCell hint={{ hint: 'CORRECT_IS_LOWER', details: 'Mid' }} />
            <HintCell hint={{ hint: 'INCORRECT', details: 'South Korean' }} />
            <HintCell hint={{ hint: 'PARTIAL', details: '2013' }} />
            <HintCell hint={{ hint: 'CORRECT', details: 'Worlds Champion' }} />
          </Table.Row>
        </Table.Body>
      </Table.Root>
    </Flex>
  );
};

export default Game;
