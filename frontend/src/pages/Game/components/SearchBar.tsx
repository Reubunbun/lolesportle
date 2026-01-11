import { type FC, useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Button,
  Popover,
  TextField
} from '@radix-ui/themes';
import { useMutation } from '@tanstack/react-query';
import lolesportleApi from '@/helpers/lolesportleApi';

function useDebouncedValue<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}

type SearchResponse = {name: string, path_name: string}[];
type Props = {
  onSelectPlayer: (pathName: string) => void;
  isGuessing: boolean;
  alreadyGuessed: string[];
}

const SearchBar: FC<Props> = ({ onSelectPlayer, isGuessing, alreadyGuessed }) => {
  const [playerInput, setPlayerInput] = useState<string>('');
  const debouncedInput = useDebouncedValue(playerInput, 300);
  const [searchResults, setSearchResults] = useState<SearchResponse>([]);
  const [highlightedSearchIndex, setHighlightedSearchIndex] = useState<number>(0);

  const searchPlayers = useMutation({
    mutationFn: (data: { query: string }) => (
      lolesportleApi(
        `players?q=${encodeURIComponent(data.query)}`,
        { method: 'GET' },
      ).then(res => setSearchResults((res.results as SearchResponse).filter(p => !alreadyGuessed.includes(p.name))))
    ),
  });

  function makeGuess(overrideSearchIndex: number|null = null) {
    if (!searchResults.length) {
      return;
    }

    setPlayerInput('');
    setSearchResults([]);
    onSelectPlayer(searchResults[overrideSearchIndex ?? highlightedSearchIndex].path_name);
  }

  useEffect(() => {
    if (debouncedInput.trim().length > 0) {
      searchPlayers.mutate({ query: debouncedInput.trim() });
    } else {
      setSearchResults([]);
    }
  }, [debouncedInput]);

  useEffect(() => {
    setHighlightedSearchIndex(0);
  }, [searchResults.length]);

  return (
    <Popover.Root open={!isGuessing && searchResults.length > 0}>
       <Flex gap='2'>
        <Popover.Trigger>
          <Box style={{ flex: 1 }}>
            <TextField.Root
              placeholder='Search for a player...'
              style={{ backgroundColor: 'var(--gray-1)' }}
              value={playerInput}
              onChange={e => setPlayerInput(e.target.value)}
              onKeyDown={e => {
                if (isGuessing || searchResults.length === 0) return;

                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setHighlightedSearchIndex(i =>
                    Math.min(i + 1, searchResults.length - 1)
                  );
                }

                if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setHighlightedSearchIndex(i =>
                    Math.max(i - 1, 0)
                  );
                }

                if (e.key === 'Enter') {
                  e.preventDefault();
                  makeGuess();
                }
              }}
            />
          </Box>
        </Popover.Trigger>

        <Button loading={isGuessing} onClick={() => makeGuess()} style={{ cursor: 'pointer' }}>Guess</Button>
      </Flex>

      <Popover.Content
        side='bottom'
        align='start'
        style={{ width: '100%', padding: 0 }}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <Box>
          {searchResults.map((player, index) => (
            <Box
              key={player.path_name}
              px='3'
              py='2'
              style={{
                cursor: 'pointer',
                backgroundColor: index === highlightedSearchIndex
                  ? 'var(--accent-9)'
                  : 'transparent',
                color: index === highlightedSearchIndex
                  ? 'var(--accent-1)'
                  : 'inherit',
              }}
              onMouseEnter={() => setHighlightedSearchIndex(index)}
              onPointerDown={(e) => {
                e.preventDefault();
                makeGuess(index);
              }}
            >
              {player.name}
            </Box>
          ))}
        </Box>
      </Popover.Content>
    </Popover.Root>
  );
};

export default SearchBar;
