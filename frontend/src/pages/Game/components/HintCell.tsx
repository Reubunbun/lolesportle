import './HintCell.css';
import { type FC } from 'react';
import {
  Table,
  Text,
  Flex
} from '@radix-ui/themes';
import { type GuessHint } from '@/types';

const bgColours: Record<GuessHint['hint'], string> = {
  'CORRECT': 'green',
  'CORRECT_IS_HIGHER': 'red',
  'CORRECT_IS_LOWER': 'red',
  'INCORRECT': 'red',
  'PARTIAL': 'orange',
  'NEUTRAL': 'none',
};

type Props = {
  hint: GuessHint,
};

const HintCell: FC<Props> = ({ hint }) => {
  console.log(hint);
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
          position: "relative",
          overflow: "hidden"
        }}
        px='2'
      >
        <Text weight='bold' style={{ zIndex: 2 }}>
          {hint.details}
        </Text>
      </Flex>
    </Table.Cell>
  );
};

export default HintCell;
