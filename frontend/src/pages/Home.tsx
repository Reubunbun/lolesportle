import { type FC } from 'react';
import { Link } from 'react-router';
import { Text, Flex, Button } from '@radix-ui/themes';
import { ROUTES } from '@/constants';

const Home: FC = () => {
  return (
    <>
      <Text size='4' color='gray' align='center'>
        Test your LoL Esports Knowledge
      </Text>

      <Flex
        direction='column'
        gap='5'
        wrap='wrap'
        justify='center'
        style={{ maxWidth: '100%' }}
      >
        <Button size='3' variant='soft' style={{ minWidth: '200px' }} asChild>
          <Link to={ROUTES.GAME}>All Regions</Link>
        </Button>
        <Button size='3' variant='soft' style={{ minWidth: '200px' }} asChild>
          <Link to='/'>LCK</Link>
        </Button>
        <Button size='3' variant='soft' style={{ minWidth: '200px' }} asChild>
          <Link to='/'>LPL</Link>
        </Button>
        <Button size='3' variant='soft' style={{ minWidth: '200px' }} asChild>
          <Link to='/'>LEC</Link>
        </Button>
        <Button size='3' variant='soft' style={{ minWidth: '200px' }} asChild>
          <Link to='/'>LCS</Link>
        </Button>
      </Flex>
    </>
  );
};

export default Home;
