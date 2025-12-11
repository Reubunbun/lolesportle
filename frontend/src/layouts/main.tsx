import { type FC } from 'react';
import { Text, Flex, Container, Box } from '@radix-ui/themes';
import { NavLink, Outlet } from 'react-router';
import { ROUTES } from '@/constants';

const Layout: FC = () => {
  return (
    <Flex direction='column' style={{ height: '100vh', overflow: 'hidden' }}>
      <Container size='3' style={{ flex: 1 }}>
        <Flex direction='column' gap='8' align='center' py='6'>
          <Text size='9' weight='bold' align='center' asChild>
            <NavLink
              to={ROUTES.HOME}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >Lolesportle</NavLink>
          </Text>

          <Outlet />
        </Flex>
      </Container>

      <Box
        style={{
          borderTop: '1px solid var(--gray-a6)',
          backgroundColor: 'var(--gray-a2)'
        }}
      >
        <Container size='3'>
          <Flex py='4' justify='center' align='center'>
            <Text size='2' color='gray' align='center'>
              Data provided by{' '}
              <a
                href='https://liquipedia.net'
                target='_blank'
                rel='noopener noreferrer'
                style={{ color: 'var(--accent-11)' }}
              >
                Liquipedia
              </a>
              {' '}under{' '}
              <a
                href='https://liquipedia.net/commons/Liquipedia:Copyrights'
                target='_blank'
                rel='noopener noreferrer'
                style={{ color: 'var(--accent-11)' }}
              >
                CC BY-SA 3.0
              </a>
            </Text>
          </Flex>
        </Container>
      </Box>
    </Flex>
  );
};

export default Layout;
