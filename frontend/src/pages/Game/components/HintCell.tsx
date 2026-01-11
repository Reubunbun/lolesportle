import './HintCell.css';
import { type FC, useState, useEffect } from 'react';
import { Table, Text, Flex, Box } from '@radix-ui/themes';
import { type GuessHint } from '@/types';

const RED = 'var(--red-9)';
const AMBER = '#cc9923';
const GREEN = 'var(--grass-9)';

const bgColours: Record<GuessHint['hint'], string> = {
  'CORRECT': GREEN,
  'CORRECT_IS_HIGHER': RED,
  'CORRECT_IS_LOWER': RED,
  'INCORRECT': RED,
  'PARTIAL': AMBER,
  'NEUTRAL': 'var(--gray-9)',
};

type Props = {
  hint: GuessHint['hint'],
  details: string,
  colNum: number,
  playAnim: boolean,
};

const HintCell: FC<Props> = ({ hint, details, colNum, playAnim }) => {
  const [isShown, setIsShown] = useState<boolean>(!playAnim);

  useEffect(() => {
    setTimeout(() => setIsShown(true), 100);
  }, []);

  return (
    <Table.Cell
      p='0'
      style={{
        textAlign: 'center',
        verticalAlign: 'middle',
        opacity: isShown ? 1 : 0,
        transition: 'opacity 1s ease',
        transitionDelay: `${colNum * 450}ms`,
      }}
    >
      <Flex justify='center' align='center' py='2'>
        <Box
          className={hint}
          width={{ initial: '97%', md: '92%', lg: '87%' }}
          style={{
            aspectRatio: '1 / 1',
            backgroundColor: bgColours[hint],
            borderRadius: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text
            weight='bold'
            size={{ initial: '1', md: '2' }}
            style={{
              fontSize: 'clamp(0.5rem, 2vw, 0.95rem)',
              color: hint === 'NEUTRAL' ? undefined : 'white',
            }}
          >
            {details}
          </Text>
        </Box>
      </Flex>
    </Table.Cell>
  );
};

export default HintCell;
