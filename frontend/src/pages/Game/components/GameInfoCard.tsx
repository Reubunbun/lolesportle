import { type FC } from 'react';
import { Card, Flex, Dialog, Text, Button, Box, Link, HoverCard } from '@radix-ui/themes';
import { QuestionMarkCircledIcon, ArrowUpIcon, ArrowDownIcon, CrossCircledIcon } from '@radix-ui/react-icons';
import { RED, AMBER } from '@/constants';
import type { Region, Hints } from '@/types';

const HINTS: { hintKey: keyof Hints; formatted: string, revealsAt: number, description: (i: string) => string }[] = [
  { hintKey: 'tournament', revealsAt: 3, formatted: 'Tournament', description: (i) => `The player competed in ${i}` },
  { hintKey: 'team', revealsAt: 6, formatted: 'Team', description: (i) => `The player competed for ${i}` },
  { hintKey: 'player', revealsAt: 9, formatted: 'Player', description: (i) => `The player competed with ${i}` },
];

type Props = {
  region: Region;
  regionDisplay: string;
  numGuesses: number;
  gameHints: Hints;
  previousGame?: {
    date: string;
    onClickStart: () => void;
  },
};

const GameInfoCard: FC<Props> = ({ region, regionDisplay, numGuesses, gameHints, previousGame }) => {
  return (
    <Card
      mb='4'
      variant='surface'
      style={{ backgroundColor: 'var(--gray-a2)' }}
    >
      <Flex px={{ initial: '0', md: '1' }} direction='column' gap='2' position='relative'>
        <Dialog.Root>
          <Dialog.Trigger>
            <Button
              variant='ghost'
              size='4'
              style={{ position: 'absolute', top: '-4px', right: '0', cursor: 'pointer' }}
            >
              <QuestionMarkCircledIcon width={24} height={24} />
            </Button>
          </Dialog.Trigger>
          <Dialog.Content maxWidth='800px' style={{ overflowX: 'hidden'}}>
            <Dialog.Close>
              <Box position='absolute' top='4px' right='6px'>
                <Button variant='ghost' style={{ cursor: 'pointer' }}>
                  <CrossCircledIcon width={24} height={24} />
                </Button>
              </Box>
            </Dialog.Close>
            <Dialog.Title>Column Meanings</Dialog.Title>
            <Box mt='3'>
              <Text size='2' weight='bold'>Region: </Text>
              <Text size='2'>
                The region the player last competed in. <br />
                <span style={{color: AMBER}}>Orange</span> = The correct answer has played in the same region, but not most recently. <br />
                <span style={{color: RED}}>Red</span> = The correct answer has never played in the same region.
              </Text>
            </Box>
            <Box mt='3'>
              <Text size='2' weight='bold'>Team: </Text>
              <Text size='2'>
                The team the player last competed for. <br />
                <span style={{color: AMBER}}>Orange</span> = The correct answer has played for the same team, but not most recently.<br />
                <span style={{color: RED}}>Red</span> = The correct answer has never played for the same team.
              </Text>
            </Box>
            <Box mt='3'>
              <Text size='2' weight='bold'>Role(s): </Text>
              <Text size='2'>
                All the roles the player has played in throughout their career. <br />
                <span style={{color: AMBER}}>Orange</span> = The correct answer has played in at least one of the same roles, but the roles don't entirely match.<br />
                <span style={{color: RED}}>Red</span> = The correct answer has never played in any of the same roles.
              </Text>
            </Box>
            <Box mt='3'>
              <Text size='2' weight='bold'>Nationality: </Text>
              <Text size='2'>
                The nationalities of the player. <br />
                <span style={{color: AMBER}}>Orange</span> = The correct answer shares at least one nationality, but the nationalities don't entirely match.<br />
                <span style={{color: RED}}>Red</span> = The correct answer does not share any nationalities.
              </Text>
            </Box>
            <Box mt='3'>
              <Text size='2' weight='bold'>Debut: </Text>
              <Text size='2'>
                The date the player made their debut in an <Link href='https://liquipedia.net/leagueoflegends/S-Tier_Tournaments' target='_blank'>S-Tier tournament</Link>. <br />
                <span style={{color: RED, display: 'inline-flex', alignItems: 'center'}}>
                  <ArrowUpIcon />
                </span> = The correct answer debuted more recently.<br />
                <span style={{color: RED, display: 'inline-flex', alignItems: 'center'}}>
                  <ArrowDownIcon />
                </span> = The correct answer debuted less recently.
              </Text>
            </Box>
            <Box mt='3' mb='3'>
              <Text size='2' weight='bold'>Best Achievement: </Text>
              <Text size='2'>
                The player's best result in <Link href='https://liquipedia.net/leagueoflegends/S-Tier_Tournaments' target='_blank'>S-Tier tournament</Link> throughout their career. <br />
                <span style={{color: RED, display: 'inline-flex', alignItems: 'center'}}>
                  <ArrowUpIcon />
                </span> = The correct answer has achieved a higher accolade.<br />
                <span style={{color: RED, display: 'inline-flex', alignItems: 'center'}}>
                  <ArrowDownIcon />
                </span> = The correct answer has achieved a lower accolade.
              </Text>
            </Box>
          </Dialog.Content>
        </Dialog.Root>
        <Text size={{ initial: '2', md: '4' }} weight='medium'>
          Guess today's{region === 'ALL_HARD' ? ' hard mode ' : ' '}
          {region === 'ALL' || region === 'ALL_HARD' ? 'LoL Esports' : regionDisplay}
          {' '}Player!
        </Text>
        <Text size={{ initial: '1', md: '2' }} weight='regular' style={{ lineHeight: '1.4' }}>
          Eligible players have competed in{' '}
          {(() => {
            switch (region) {
              case 'ALL_HARD':
                return <>any <Link href='https://liquipedia.net/leagueoflegends/S-Tier_Tournaments' target='_blank'>S-Tier competition</Link> as defined by Liquipedia.</>;
              case 'ALL':
                return <>an S-Tier region within the last two years.</>;
              default:
                return <>{regionDisplay} within the last two years.</>;
            }
          })()}
        </Text>
        {previousGame && (
          <>
            <Box style={{ width: '100%', borderTop: '1px solid var(--gray-12)' }} mt={{initial: '0', md: '1' }} />
            <Flex gap='1'>
              <Text size='2' weight='regular'>Continuing progress from a previous game -</Text>
              <Button
                style={{ cursor: 'pointer' }}
                variant='ghost'
                onClick={previousGame.onClickStart}
              >Switch to today's game</Button>
            </Flex>
          </>
        )}
        {!previousGame && <Box style={{ width: '100%', borderTop: '1px solid var(--gray-12)' }} mt={{initial: '0', md: '1' }} />}
        <Flex justify='start' gap={{ initial: '3', md: '6' }}>
          {HINTS.map((hintInfo, i) => {
            if (numGuesses < hintInfo.revealsAt) {
              return (
                <HoverCard.Root key={hintInfo.hintKey}>
                  <HoverCard.Trigger>
                    <Button
                      variant='ghost'
                      disabled={true}
                      style={{ cursor: 'not-allowed' }}
                    >Hint {i + 1}</Button>
                  </HoverCard.Trigger>
                  <HoverCard.Content size='1' side='top'>
                    <Box>
                      <Text>Hint will reveal in {hintInfo.revealsAt - numGuesses} guesses</Text>
                    </Box>
                  </HoverCard.Content>
                </HoverCard.Root>
              );
            }

            return (
              <Dialog.Root key={hintInfo.hintKey}>
                <Dialog.Trigger>
                  <Button
                    variant='ghost'
                    style={{ cursor: 'pointer' }}
                  >Hint {i + 1}</Button>
                </Dialog.Trigger>
                <Dialog.Content style={{ overflowX: 'hidden'}}>
                  <Dialog.Close>
                    <Box position='absolute' top='4px' right='6px'>
                      <Button variant='ghost' style={{ cursor: 'pointer' }}>
                        <CrossCircledIcon width={24} height={24} />
                      </Button>
                    </Box>
                  </Dialog.Close>
                  <Dialog.Title>{hintInfo.formatted} Hint</Dialog.Title>
                  <Dialog.Description>{hintInfo.description(gameHints[hintInfo.hintKey])}</Dialog.Description>
                </Dialog.Content>
              </Dialog.Root>
            );
          })}
        </Flex>
      </Flex>
    </Card>
  );
};

export default GameInfoCard;
