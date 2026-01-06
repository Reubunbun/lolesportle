import './HintCell.css';
import { type FC } from 'react';
import {
  Table,
  Text,
  Flex
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
    <Table.Cell width='100px' height='100px'>
      <Flex
        className={hint.hint}
        width='100px'
        height='100px'
        justify='center'
        align='center'
        style={{
          backgroundColor: bgColour,
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '2px',
        }}
        px='2'
      >
        <Text weight='bold' style={{ zIndex: 2, color: hint.hint === 'NEUTRAL' ? undefined : 'white' }}>
          {hint.details}
        </Text>
      </Flex>
    </Table.Cell>
  );
};

export default HintCell;
