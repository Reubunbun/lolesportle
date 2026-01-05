import { type FC, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { NavLink } from 'react-router';
import { Text, Flex, Button, Spinner } from '@radix-ui/themes';
import { ROUTES } from '@/constants';
import lolesportleApi from '@/helpers/lolesportleApi';
import useSavedGameData from '@/hooks/useSavedGameData';

type GetGameResponse = { gameKey: string };

const Home: FC = () => {
  const [ savedGameData, dispatch ] = useSavedGameData();

  const {
    data: currentGameKey,
    isPending: isLoadingGameKey,
    error: errorGameKey,
  } = useQuery<GetGameResponse>({
    queryKey: ['gameKey'],
    queryFn: () => lolesportleApi('game', { method: 'GET' }),
    refetchOnMount: 'always',
  });

  useEffect(() => {
    if (currentGameKey && currentGameKey.gameKey) {
      dispatch({ type: 'CHECK_STREAKS', payload: { gameKey: currentGameKey.gameKey } });
    }
  }, [currentGameKey]);

  if (isLoadingGameKey) {
    return <Spinner />;
  }

  return (
    <Flex
      direction='column'
      align='center'
      gap='8'
    >
      <Text size='4' color='gray' align='center'>
        Test your LoL Esports Knowledge!
      </Text>

      {isLoadingGameKey && <Spinner />}

      {errorGameKey && <Text>Internal server error - please try refreshing</Text>}

      {currentGameKey && (
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
          <Flex align='center' gap='4' justify='end'>
            {savedGameData.ALL_HARD.streak.length > 0 && <>{savedGameData.ALL_HARD.streak.length} 🔥</>}
            <Button size='3' variant='soft' style={{ minWidth: '200px' }} asChild>
              <NavLink to={ROUTES.GAME_HARD}>All Regions - Hard</NavLink>
            </Button>
          </Flex>
        </Flex>
      )}
    </Flex>
  );
};

export default Home;
