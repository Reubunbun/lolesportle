import { type FC, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { NavLink } from 'react-router';
import { Text, Flex, Button, Spinner } from '@radix-ui/themes';
import { ROUTES } from '@/constants';
import lolesportleApi from '@/helpers/lolesportleApi';
import useSavedGameData from '@/hooks/useSavedGameData';
import type { Region, GetGameResponse } from '@/types';

const LINKS: { region: Region, routesTo: string, display: string }[] = [
  { region: 'ALL', routesTo: ROUTES.GAME_ALL, display: 'All Regions' },
  { region: 'KR', routesTo: ROUTES.GAME_LCK, display: 'LCK' },
  { region: 'CH', routesTo: ROUTES.GAME_LPL, display: 'LPL' },
  { region: 'EU', routesTo: ROUTES.GAME_LEC, display: 'LEC' },
  { region: 'NA', routesTo: ROUTES.GAME_LCS, display: 'LCS' },
  { region: 'ALL_HARD', routesTo: ROUTES.GAME_HARD, display: 'All Regions (Hard)' },
];

const Home: FC = () => {
  const [ savedGameData, dispatch ] = useSavedGameData();

  const {
    data: gameMetaData,
    isPending: isLoadingGameMeta,
    error: errorGameMeta,
  } = useQuery<GetGameResponse>({
    queryKey: ['gameKey'],
    queryFn: () => lolesportleApi('game', { method: 'GET' }),
    refetchOnMount: 'always',
  });

  useEffect(() => {
    if (gameMetaData) {
      dispatch({
        type: 'CHECK_STREAKS',
        payload: {
          currentGameKey: gameMetaData.gameKey,
          previousGameKey: gameMetaData.previousPlayers.gameKey,
        },
      });
    }
  }, [gameMetaData]);

  if (isLoadingGameMeta) {
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

      {isLoadingGameMeta && <Spinner />}

      {errorGameMeta && <Text>Internal server error - please try refreshing</Text>}

      {gameMetaData && (
        <Flex direction='column' gap='5'>
          {LINKS.map(linkData => (
            <div
              key={linkData.routesTo}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto 1fr',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>
                {savedGameData[linkData.region].streak.length > 0 &&
                  <>{savedGameData[linkData.region].streak.length} 🔥</>}
              </span>

              <Button size='3' variant='soft' style={{ minWidth: '200px', backgroundColor: 'var(--accent-3)' }} asChild>
                <NavLink to={linkData.routesTo}>{linkData.display}</NavLink>
              </Button>

              <div />
            </div>
          ))}
        </Flex>
      )}
    </Flex>
  );
};

export default Home;
