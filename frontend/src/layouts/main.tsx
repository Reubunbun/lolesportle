import { type FC } from 'react';
import { SunIcon, MoonIcon } from '@radix-ui/react-icons';
import { Text, Flex, Container, Box, Button } from '@radix-ui/themes';
import { NavLink, Outlet } from 'react-router';
import type { Theme } from '@/types';
import { ROUTES } from '@/constants';

type Props = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const Layout: FC<Props> = ({ theme, setTheme }) => {
  const gradient = theme === 'dark'
    ? 'rgba(0,0,0,0.85), rgba(0,0,0,0.85)'
    : 'rgba(217,217,217,0.9), rgba(217,217,217,0.7)';

  return (
    <Flex
      direction='column'
      style={{
        backgroundColor: theme === 'light' ? 'var(--gray-6)' : undefined,
        backgroundImage: `linear-gradient(${gradient}), url("/esports_bg.webp")`,
        backgroundSize: 'cover, cover',
        backgroundPosition: 'center, center',
        backgroundRepeat: 'no-repeat, no-repeat',
      }}
      position='relative'
      height='100dvh'
    >
      <Box style={{ flexShrink: 0 }}>
        <Container size='3' px='2'>
          <Flex py='5' justify='end'>
            <Button
              variant='ghost'
              size='4'
              style={{ cursor: 'pointer' }}
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            >
              {theme === 'light'
                ? <MoonIcon width={28} height={28} />
                : <SunIcon width={28} height={28} />}
            </Button>
          </Flex>

          <Flex justify='center' pb='6'>
            <Text
              size='9'
              weight='bold'
              asChild
              style={{
                color: 'var(--accent-9)',
                fontSize: 'clamp(3.25rem, 4vw, 4rem)',
                letterSpacing: '0.075em',
                textShadow: `
                  0 0 2px var(--accent-9),
                  0 0 2px var(--accent-9),
                  0 0 10px var(--accent-9)
                `,
              }}
            >
              <NavLink
                to={ROUTES.HOME}
                style={{ textDecoration: 'none' }}
              >
                LoLEsportle
              </NavLink>
            </Text>
          </Flex>
        </Container>
      </Box>

      <Box
        style={{
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        <Outlet />
      </Box>

      <Box
        style={{
          flexShrink: 0,
          borderTop: '1px solid var(--gray-a6)',
          backgroundColor: theme === 'light' ?  'rgb(217,217,217)' : 'var(--gray-2)',
        }}
      >
        <Container size='3'>
          <Flex py='4' justify='center'>
            <Text size='2' color='gray'>
              Data provided by{' '}
              <a
                href='https://liquipedia.net'
                target='_blank'
                rel='noopener noreferrer'
                style={{ color: 'var(--accent-9)' }}
              >
                Liquipedia
              </a>{' '}
              under{' '}
              <a
                href='https://liquipedia.net/commons/Liquipedia:Copyrights'
                target='_blank'
                rel='noopener noreferrer'
                style={{ color: 'var(--accent-9)' }}
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
