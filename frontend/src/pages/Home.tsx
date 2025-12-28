import { type FC } from 'react';
import { NavLink } from 'react-router';
import { Text, Flex, Button } from '@radix-ui/themes';
import { ROUTES } from '@/constants';

const Home: FC = () => {
  return (
    <>
      <Text size='4' color='gray' align='center'>
        Test your LoL Esports Knowledge!
      </Text>

      <Flex
        direction='column'
        gap='5'
        wrap='wrap'
        justify='center'
        style={{ maxWidth: '100%' }}
      >
        <Button size='3' variant='soft' style={{ minWidth: '200px' }} asChild>
          <NavLink to={ROUTES.GAME_ALL}>All Regions</NavLink>
        </Button>
        <Button size='3' variant='soft' style={{ minWidth: '200px' }} asChild>
          <NavLink to={ROUTES.GAME_LCK}>LCK</NavLink>
        </Button>
        <Button size='3' variant='soft' style={{ minWidth: '200px' }} asChild>
          <NavLink to={ROUTES.GAME_LPL}>LPL</NavLink>
        </Button>
        <Button size='3' variant='soft' style={{ minWidth: '200px' }} asChild>
          <NavLink to={ROUTES.GAME_LEC}>LEC</NavLink>
        </Button>
        <Button size='3' variant='soft' style={{ minWidth: '200px' }} asChild>
          <NavLink to={ROUTES.GAME_LCS}>LCS</NavLink>
        </Button>
      </Flex>
    </>
  );
};

export default Home;
