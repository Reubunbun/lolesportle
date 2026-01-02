import { type FC } from 'react';
import { NavLink } from 'react-router';
import { Text, Flex, Button } from '@radix-ui/themes';
import { ROUTES } from '@/constants';
import useSavedGameData from '@/hooks/useSavedGameData';

const Home: FC = () => {
  const [ savedGameData ] = useSavedGameData();

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
        <Flex align='center' gap='4' justify='end'>
          {savedGameData.ALL.streak.length > 0 && <>{savedGameData.ALL.streak.length} 🔥</> }
          <Button size='3' variant='soft' style={{ minWidth: '200px' }} asChild>
            <NavLink to={ROUTES.GAME_ALL}>All Regions</NavLink>
          </Button>
        </Flex>
        <Flex align='center' gap='4' justify='end'>
          {savedGameData.KR.streak.length > 0 && <>{savedGameData.KR.streak.length} 🔥</>}
          <Button size='3' variant='soft' style={{ minWidth: '200px' }} asChild>
            <NavLink to={ROUTES.GAME_LCK}>LCK</NavLink>
          </Button>
        </Flex>
        <Flex align='center' gap='4' justify='end'>
          {savedGameData.CH.streak.length > 0 && <>{savedGameData.CH.streak.length} 🔥</>}
          <Button size='3' variant='soft' style={{ minWidth: '200px' }} asChild>
            <NavLink to={ROUTES.GAME_LPL}>LPL</NavLink>
          </Button>
        </Flex>
        <Flex align='center' gap='4' justify='end'>
          {savedGameData.EU.streak.length > 0 && <>{savedGameData.EU.streak.length} 🔥</>}
          <Button size='3' variant='soft' style={{ minWidth: '200px' }} asChild>
            <NavLink to={ROUTES.GAME_LEC}>LEC</NavLink>
          </Button>
        </Flex>
        <Flex align='center' gap='4' justify='end'>
          {savedGameData.NA.streak.length > 0 && <>{savedGameData.NA.streak.length} 🔥</>}
          <Button size='3' variant='soft' style={{ minWidth: '200px' }} asChild>
            <NavLink to={ROUTES.GAME_LCS}>LCS</NavLink>
          </Button>
        </Flex>
      </Flex>
    </>
  );
};

export default Home;
