import { createComponent } from '../component';
import { useEffect } from '../use-effect';
import { currentFiberStore } from '../scope';
import { useContext } from '../use-context';
import { detectIsFunction } from '../helpers';
import type { Context, ContexProviderProps } from './types';
import type { DarkElement } from '../shared';

function createContext<T>(defaultValue: T): Context<T> {
  let displayName = 'Context';
  const context: Context<T> = {
    displayName,
    defaultValue,
    Provider: null,
    Consumer: null,
  };

  mutateContext(context, defaultValue, displayName);

  Object.defineProperty(context, 'displayName', {
    get: () => displayName,
    set: (newValue: string) => {
      displayName = newValue;
      mutateContext(context, defaultValue, displayName);
    },
  });

  return context;
}

function mutateContext<T>(context: Context<T>, defaultValue: T, displayName: string) {
  context.Provider = createProvider(context, defaultValue, displayName);
  context.Consumer = createConsumer(context, displayName);
}

function createProvider<T>(context: Context<T>, defaultValue: T, displayName: string) {
  return createComponent<ContexProviderProps<T>>(
    ({ value = defaultValue, slot }) => {
      const fiber = currentFiberStore.get();

      if (!fiber.provider) {
        fiber.provider = new Map();
      }

      if (!fiber.provider.get(context)) {
        fiber.provider.set(context, {
          subscribers: [],
          value,
        });
      }

      const provider = fiber.provider.get(context);

      useEffect(() => {
        for (const subscriber of provider.subscribers) {
          subscriber(value);
        }
      }, [value]);

      provider.value = value;

      return slot;
    },
    { displayName: `${displayName}.Provider` },
  );
}

type ConsumerProps<T> = {
  slot: (value: T) => DarkElement;
};

function createConsumer<T>(context: Context<T>, displayName: string) {
  return createComponent<ConsumerProps<T>>(
    ({ slot }) => {
      const value = useContext(context);

      return detectIsFunction(slot) ? slot(value) : null;
    },
    { displayName: `${displayName}.Consumer` },
  );
}

export { createContext };
