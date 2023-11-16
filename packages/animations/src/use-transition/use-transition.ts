import {
  type Component,
  type TagVirtualNodeFactory,
  Fragment,
  batch,
  useMemo,
  useUpdate,
  useEffect,
  useLayoutEffect,
  detectIsArray,
} from '@dark-engine/core';

import { type Key, type SpringValue, type SpringItem } from '../shared';
import { type AnimationEventValue, SharedState } from '../shared-state';
import { type BaseItemConfig, type ConfiguratorFn, Controller } from '../controller';
import { type SpringApi } from '../use-springs';
import { uniq } from '../utils';

export type TransitionItemConfig<T extends string> = {
  from: SpringValue<T>;
  enter: SpringValue<T>;
  leave?: SpringValue<T>;
  update?: SpringValue<T>;
  trail?: number;
} & Pick<BaseItemConfig<T>, 'config' | 'immediate'>;

function useTransition<T extends string, I = unknown>(
  items: Array<I>,
  getKey: (x: I) => Key,
  configurator: TransitionConfiguratorFn<T, I>,
): [TransitionFn<T, I>, TransitionApi<T>] {
  const forceUpdate = useUpdate();
  const update = () => batch(forceUpdate);
  const state = useMemo(() => new SharedState<T>(), []);
  const scope = useMemo<Scope<T, I>>(
    () => ({
      ctrlsMap: new Map(),
      itemsMap: new Map(),
      fakesMap: new Map(),
      fromItems: true,
      chain: false,
      updates: [],
      items: [],
      configurator,
    }),
    [],
  );

  scope.configurator = configurator;

  const transition = useMemo<TransitionFn<T, I>>(
    () => (render: TransitionRenderFn<T, I>) => {
      const { ctrlsMap } = scope;
      const elements: Array<TransitionElement> = [];

      for (const [key, ctrl] of ctrlsMap) {
        const item = ctrl.getItem();
        const idx = ctrl.getIdx();
        const spring: TransitionItem<T, I> = {
          ctrl,
          item,
          getValue: () => ctrl.getValue(),
          detectIsSeriesPlaying: () => state.detectIsPlaying(),
        };
        const element = Fragment({ key, slot: render({ spring, item, idx }) });

        if (elements[idx]) {
          const sibling = elements[idx];

          if (detectIsArray(sibling)) {
            sibling.push(element);
          } else {
            elements[idx] = [sibling, element] as unknown as TransitionElement;
          }
        } else {
          elements[idx] = element;
        }
      }

      return elements;
    },
    [],
  );

  const api = useMemo<TransitionApi<T>>(() => {
    return {
      start: fn => {
        scope.fromItems = false;

        if (scope.chain) {
          scope.updates.forEach(x => x());
          scope.updates = [];
        } else {
          state.start(fn);
        }
      },
      chain: (value: boolean) => {
        scope.chain = value;
      },
      cancel: state.cancel.bind(state),
      pause: state.pause.bind(state),
      resume: state.resume.bind(state),
      on: state.on.bind(state),
      once: state.once.bind(state),
    };
  }, []);

  useEffect(() => {
    const loop = () => {
      const configurator: TransitionConfiguratorFn<T, I> = (idx, item) => scope.configurator(idx, item);
      const items$ = uniq(items, getKey);
      const { ctrlsMap, fakesMap, items: prevItems } = scope;
      const { ctrls, itemsMap } = data({ items: items$, getKey, configurator, state, ctrlsMap });
      const { insertionsMap, removesMap, movesMap, stableMap, replaced } = diff(prevItems, items, getKey);
      state.setCtrls(ctrls);
      replaced.forEach(key => ctrlsMap.get(key).setIsReplaced(true));

      state.event('series-start');
      startLoop({ destKey: 'leave', space: fakesMap, state, scope }); // !
      startLoop({ destKey: 'enter', space: insertionsMap, state, scope });
      startLoop({ destKey: 'leave', space: removesMap, state, scope });
      startLoop({ destKey: 'update', space: movesMap, state, scope });
      startLoop({ destKey: 'update', space: stableMap, state, scope });

      scope.items = items$; // !
      scope.itemsMap = itemsMap;
      scope.fromItems = true;
      forceUpdate(); //!
    };

    if (scope.chain) {
      scope.updates.push(loop);
    } else {
      loop();
    }
  }, [items]);

  useLayoutEffect(() => {
    const unmounts: Array<() => void> = [];

    unmounts.push(
      api.on('item-end', e => handleItemEnd(e, scope)),
      api.on('series-end', () => handleSeriesEnd(update, state, scope)),
    );

    return () => unmounts.forEach(x => x());
  }, []);

  useLayoutEffect(() => () => api.cancel(), []);

  return [transition, api];
}

type DataOptions<T extends string, I = unknown> = {
  items: Array<I>;
  getKey: (x: I) => Key;
  state: SharedState<T>;
} & Pick<Scope<T, I>, 'configurator' | 'ctrlsMap'>;

function data<T extends string, I = unknown>(options: DataOptions<T, I>) {
  const { items, getKey, configurator, state, ctrlsMap } = options;
  const itemsMap = new Map<Key, I>();
  const ctrls = items.map((item, idx) => {
    const key = getKey(item);

    itemsMap.set(key, item);

    return getController<T, I>({ idx, item, getKey, configurator, state, ctrlsMap });
  });

  return { ctrls, itemsMap };
}

type GetControllerOptions<T extends string, I = unknown> = {
  idx: number;
  item: I;
} & Pick<DataOptions<T, I>, 'getKey' | 'configurator' | 'state' | 'ctrlsMap'>;

function getController<T extends string, I = unknown>(options: GetControllerOptions<T, I>) {
  const { idx, item, getKey, configurator, state, ctrlsMap } = options;
  const key = getKey(item);
  const ctrl = ctrlsMap.get(key) || new Controller<T, I>(state);

  prepare({ ctrl, key, idx, item, configurator });
  ctrlsMap.set(key, ctrl);

  return ctrl;
}

function extractKeys<I = unknown>(prevItems: Array<I>, nextItems: Array<I>, getKey: (x: I) => Key) {
  const prevKeys: Array<Key> = [];
  const nextKeys: Array<Key> = [];
  const prevKeysMap: Record<Key, boolean> = {};
  const nextKeysMap: Record<Key, boolean> = {};
  const max = Math.max(prevItems.length, nextItems.length);

  for (let i = 0; i < max; i++) {
    const prevItem = prevItems[i];
    const nextItem = nextItems[i];

    if (prevItem) {
      const prevKey = getKey(prevItem);

      if (!prevKeysMap[prevKey]) {
        prevKeysMap[prevKey] = true;
        prevKeys.push(prevKey);
      }
    }

    if (nextItem) {
      const nextKey = getKey(nextItem);

      if (!nextKeysMap[nextKey]) {
        nextKeysMap[nextKey] = true;
        nextKeys.push(nextKey);
      }
    }
  }

  return {
    prevKeys,
    nextKeys,
    prevKeysMap,
    nextKeysMap,
  };
}

function diff<I = unknown>(prevItems: Array<I>, nextItems: Array<I>, getKey: (x: I) => Key) {
  const { prevKeys, nextKeys, prevKeysMap, nextKeysMap } = extractKeys(prevItems, nextItems, getKey);
  let size = Math.max(prevKeys.length, nextKeys.length);
  let p = 0;
  let n = 0;
  const insertionsMap = new Map<Key, number>();
  const removesMap = new Map<Key, number>();
  const movesMap = new Map<Key, number>();
  const stableMap = new Map<Key, number>();
  const replaced = new Set<Key>();

  for (let i = 0; i < size; i++) {
    const nextKey = nextKeys[i - n] ?? null;
    const prevKey = prevKeys[i - p] ?? null;

    if (nextKey !== prevKey) {
      if (nextKey !== null && !prevKeysMap[nextKey]) {
        if (prevKey !== null && !nextKeysMap[prevKey]) {
          insertionsMap.set(nextKey, i);
          removesMap.set(prevKey, i);
          replaced.add(prevKey);
        } else {
          insertionsMap.set(nextKey, i);
          p++;
          size++;
        }
      } else if (!nextKeysMap[prevKey]) {
        removesMap.set(prevKey, i);
        n++;
        size++;
      } else if (nextKeysMap[prevKey] && nextKeysMap[nextKey]) {
        movesMap.set(nextKey, i);
      }
    } else if (nextKey !== null) {
      stableMap.set(nextKey, i);
    }
  }

  return {
    insertionsMap,
    removesMap,
    movesMap,
    stableMap,
    replaced,
  };
}

type StartLoopOptions<T extends string, I = unknown> = {
  destKey: DestinationKey<T>;
  space: Map<Key, number>;
  state: SharedState<T>;
  scope: Scope<T, I>;
};

function startLoop<T extends string, I = unknown>(options: StartLoopOptions<T, I>) {
  const { space, destKey, state, scope } = options;
  const { configurator, ctrlsMap, fakesMap } = scope;
  const ctrls = state.getCtrls();
  const isEnter = destKey === 'enter';
  let idx$ = 0;

  for (const [key, idx] of space) {
    const ctrl = ctrlsMap.get(key);
    const item = ctrl.getItem();
    const config = configurator(idx, item);
    const { trail } = config;
    const to = config[destKey];
    let ctrl$ = ctrl;

    if (isEnter) {
      const isReplaced = ctrl.getIsReplaced();
      const isPlaying = state.detectIsPlaying(key);

      if (isReplaced) {
        if (isPlaying) {
          const fake = new Controller<T, I>(state);
          const fakeKey = fake.markAsFake(key);

          ctrl$ = fake;
          prepare({ ctrl: fake, key: fakeKey, idx, item, configurator });
          ctrlsMap.set(fakeKey, fake);
          fakesMap.set(fakeKey, idx);
          ctrls.push(fake);
        } else {
          ctrl.setIsReplaced(false);
        }
      }
    }

    to && withTrail(trail, idx$, () => ctrl$.start(() => ({ to })));
    idx$++;
  }
}

function withTrail(trail: number, idx: number, fn: () => void) {
  if (trail) {
    setTimeout(() => fn(), idx * trail);
  } else {
    fn();
  }
}

type PrepareOptions<T extends string, I = unknown> = {
  ctrl: Controller<T, I>;
  idx: number;
  key: Key;
  item: I;
  configurator: TransitionConfiguratorFn<T, I>;
};

function prepare<T extends string, I = unknown>(options: PrepareOptions<T, I>) {
  const { ctrl, key, idx, item, configurator } = options;
  const { from, enter, config } = configurator(idx, item);
  const configurator$: ConfiguratorFn<T> = (idx: number) => {
    const { enter, leave, update, trail, ...rest } = configurator(idx, item);

    return { ...rest };
  };

  ctrl.setKey(key);
  ctrl.setIdx(idx);
  ctrl.setItem(item);
  ctrl.setFrom(from);
  ctrl.setTo(enter);
  ctrl.setSpringConfigFn(config);
  ctrl.setConfigurator(configurator$);
}

function handleItemEnd<T extends string, I = unknown>({ key }: AnimationEventValue<T>, scope: Scope<T, I>) {
  const { ctrlsMap, fakesMap, itemsMap } = scope;

  if (ctrlsMap.has(key) && ctrlsMap.get(key).detectIsFake()) {
    ctrlsMap.delete(key);
    fakesMap.delete(key);
  } else if (!itemsMap.has(key)) {
    ctrlsMap.delete(key);
  }
}

function handleSeriesEnd<T extends string, I = unknown>(update: () => void, state: SharedState<T>, scope: Scope<T, I>) {
  const { ctrlsMap, configurator, fromItems } = scope;
  const ctrls: Array<Controller<T, I>> = [];

  if (!fromItems) return;

  for (const [_, ctrl] of ctrlsMap) {
    const { enter } = configurator(ctrl.getIdx(), ctrl.getItem());

    ctrl.replaceValue({ ...enter });
    ctrl.notify();
    ctrls.push(ctrl);
  }

  state.setCtrls(ctrls);
  update();
}

type Scope<T extends string, I = unknown> = {
  items: Array<I>;
  configurator: TransitionConfiguratorFn<T, I>;
  ctrlsMap: Map<Key, Controller<T, I>>;
  itemsMap: Map<Key, I>;
  fakesMap: Map<Key, number>;
  fromItems: boolean;
  chain: boolean;
  updates: Array<() => void>;
};

type DestinationKey<T extends string> = keyof Pick<TransitionItemConfig<T>, 'leave' | 'update' | 'enter'>;

type TransitionElement = Component | TagVirtualNodeFactory;

type TransitionConfiguratorFn<T extends string = string, I = unknown> = (
  idx: number,
  item: I,
) => TransitionItemConfig<T>;

export type TransitionApi<T extends string = string> = {} & Pick<
  SpringApi<T>,
  'start' | 'chain' | 'cancel' | 'pause' | 'resume' | 'on' | 'once'
>;

export type TransitionItem<T extends string = string, I = unknown> = {
  item: I;
} & SpringItem<T>;

export type TransitionRenderFn<T extends string = string, I = unknown> = (options: {
  spring: TransitionItem<T, I>;
  item: I;
  idx: number;
}) => TransitionElement;

export type TransitionFn<T extends string = string, I = unknown> = (
  render: TransitionRenderFn<T, I>,
) => Array<TransitionElement>;

export { useTransition };
