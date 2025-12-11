import { type FC } from 'react';
import { useQuery } from '@tanstack/react-query';

const Game: FC = () => {
  const { isPending, error, data } = useQuery({
    queryKey: ['gameData'],
    queryFn: () => fetch('https://iq3gv3pj8d.execute-api.eu-west-1.amazonaws.com/prod/game').then(res => res.json()),
    refetchOnMount: 'always',
  });

  if (isPending) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>error!</div>;
  }

  return <div>{data}</div>
};

export default Game;
