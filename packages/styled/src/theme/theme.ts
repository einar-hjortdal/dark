import { type DarkElement, createContext, useContext, useMemo, component } from '@dark-engine/core';

import { type DefaultTheme } from '../';

export type ThemeContextValue = DefaultTheme;

const ThemeContext = createContext<ThemeContextValue>(null, { displayName: 'Theme' });

function useTheme() {
  return useContext(ThemeContext);
}

type ThemeProviderProps = {
  theme: DefaultTheme;
  slot: DarkElement;
};

const ThemeProvider = component<ThemeProviderProps>(({ theme, slot }) => {
  return ThemeContext.Provider({ value: theme, slot });
});

export { ThemeProvider, useTheme };
