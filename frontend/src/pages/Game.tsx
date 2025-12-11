import { type FC } from 'react';
import {
  Text,
  Flex,
  Button,
  TextField,
  Card,
  Spinner,
  Link,
} from '@radix-ui/themes';
import { useQuery } from '@tanstack/react-query';

type GetGameResponse = { gameKey: string };

const Game: FC = () => {
  const { isPending, error, data } = useQuery<GetGameResponse>({
    queryKey: ['gameData'],
    queryFn: () => fetch('https://iq3gv3pj8d.execute-api.eu-west-1.amazonaws.com/prod/game').then(res => res.json()),
    refetchOnMount: 'always',
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
          <Text size='4' weight='medium'>Guess today's LoL Esports Player!</Text>
          <Text size='2' weight='regular' style={{ lineHeight: '1.4' }}>
            Eligible players have competed in an <Link href='https://liquipedia.net/leagueoflegends/S-Tier_Tournaments'>S-Tier competition</Link> within the last two years
          </Text>
        </Flex>
      </Card>
      <Flex gap='2'>
        <TextField.Root placeholder='Search for a player...' style={{ flex: 1 }} />
        <Button style={{ cursor: 'pointer' }}>Guess</Button>
      </Flex>
    </Flex>
  );
};

export default Game;
