import './HintCell.css';
import { type FC } from 'react';
import {
  Table,
  Text,
  Flex,
  Box,
} from '@radix-ui/themes';
import { type GuessHint } from '@/types';

const RED = '#e52f2e';
const AMBER = '#cc9923';
const GREEN = '#30a46c';

const bgColours: Record<GuessHint['hint'], string> = {
  'CORRECT': GREEN,
  'CORRECT_IS_HIGHER': RED,
  'CORRECT_IS_LOWER': RED,
  'INCORRECT': RED,
  'PARTIAL': AMBER,
  'NEUTRAL': 'var(--gray-9)',
};

type Props = {
  hint: GuessHint,
};

const HintCell: FC<Props> = ({ hint }) => {
  const bgColour = bgColours[hint.hint];

  return (
    <Table.Cell
      p='0'
      style={{
        textAlign: 'center',
        verticalAlign: 'middle',
      }}
    >
      <Flex justify='center' align='center' py='2'>
        <Box
          style={{
            aspectRatio: '1 / 1',
            width: '95%',
            backgroundColor: bgColour,
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
              color: hint.hint === 'NEUTRAL' ? undefined : 'white',
            }}
          >
            {hint.details}
          </Text>
        </Box>
      </Flex>
    </Table.Cell>
  );
};

export default HintCell;
