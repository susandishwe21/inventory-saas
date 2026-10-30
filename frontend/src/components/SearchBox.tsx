import { useEffect, useRef, useState } from 'react';
import { Icon } from './icons';

const DELAY_MS = 300; // wait until the user stops typing

type Props = {
  value: string; // the current search (from the URL)
  onSearch: (text: string) => void; // called 300 ms after typing stops, with the trimmed text
  placeholder?: string;
};

// Search input with debounce: typing updates the box right away, but searches only after a short pause
export function SearchBox({ value, onSearch, placeholder = 'Search' }: Props) {
  const [text, setText] = useState(value);
  const [prevValue, setPrevValue] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // The search changed from outside (Back button, "Clear filters"): show it in the box.
  // Setting state while rendering is React's recommended way to follow a prop.
  if (value !== prevValue) {
    setPrevValue(value);
    if (value !== text.trim()) setText(value);
  }

  // Don't search after the page is gone
  useEffect(() => () => clearTimeout(timer.current), []);

  function handleChange(next: string) {
    setText(next);
    clearTimeout(timer.current); // every key press restarts the wait
    timer.current = setTimeout(() => onSearch(next.trim()), DELAY_MS);
  }

  function clear() {
    clearTimeout(timer.current);
    setText('');
    onSearch('');
  }

  return (
    <div className="relative w-full sm:w-64">
      <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-slate-400">
        <Icon name="search" className="size-4" />
      </span>
      <input
        type="search"
        className="input py-1.5 pr-8 pl-8 [&::-webkit-search-cancel-button]:hidden"
        placeholder={placeholder}
        aria-label={placeholder}
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && clear()}
      />
      {text && (
        <button
          type="button"
          onClick={clear}
          aria-label="Clear search"
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600"
        >
          <Icon name="close" className="size-4" />
        </button>
      )}
    </div>
  );
}
