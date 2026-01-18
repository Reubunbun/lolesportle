import { type FC } from 'react';
import { Card, Flex, Text, Button, Box } from '@radix-ui/themes';
import { NavLink } from 'react-router';
import { ROUTES } from '@/constants';

type Props = {
  region: string;
  streak: number;
  todaysGame?: {
    date: string;
    onClickStart: () => void;
  };
};

const GameWonCard: FC<Props> = ({ region, streak, todaysGame }) => {
  return (
    <Card
      variant='surface'
      style={{ backgroundColor: 'var(--gray-a2)' }}
    >
      <Flex p={{ initial: '1', md: '3' }} direction='column' gap='2' justify='center' align='center'>
        <Text size={{ initial: '2', md: '4' }} weight='bold'>🎉 You guessed correctly! 🎉</Text>
        <Text size={{ initial: '2', md: '4' }} weight='medium'>🔥 Your streak for {region} is now {streak} 🔥</Text>
      </Flex>
      <Box style={{ width: '100%', borderTop: '2px solid black' }} />
      <Flex direction='column' align='start' gap='2' pt='2'>
        <Button variant='ghost' asChild>
          <NavLink to={ROUTES.HOME}>
            <Text size={{ initial: '1', md: '3' }}>Try a different mode</Text>
          </NavLink>
        </Button>
        {todaysGame && (
          <Button
            style={{ cursor: 'pointer' }}
            variant='ghost'
            onClick={todaysGame.onClickStart}
          >
            Play game for {todaysGame.date}
          </Button>
        )}
      </Flex>
    </Card>
  );
}

export default GameWonCard;
