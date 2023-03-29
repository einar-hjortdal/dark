import { type Atom, Text, component, memo, Flag, atom, useAtom, Guard, useReactiveState } from '@dark-engine/core';
import { type SyntheticEvent as E, createRoot, table, tbody, tr, td, div, button } from '@dark-engine/platform-browser';

const flag = { [Flag.NM]: true };

const createMeasurer = () => {
  let startTime;
  let lastMeasureName: string;
  const start = (name: string) => {
    startTime = performance.now();
    lastMeasureName = name;
  };
  const stop = () => {
    const last = lastMeasureName;

    if (lastMeasureName) {
      setTimeout(() => {
        lastMeasureName = null;
        const stopTime = performance.now();
        const diff = stopTime - startTime;

        console.log(`${last}: ${diff}`);
      });
    }
  };

  return {
    start,
    stop,
  };
};

const measurer = createMeasurer();

let nextId = 0;
const buildData = (count: number, prefix = ''): Array<DataItem> => {
  return Array(count)
    .fill(0)
    .map(() => ({
      id: ++nextId,
      name$: atom(`item: ${nextId} ${prefix}`),
    }));
};

type DataItem = { id: number; name$: Atom<string> };

type HeaderProps = {
  onCreate: (e: E<MouseEvent>) => void;
  onPrepend: (e: E<MouseEvent>) => void;
  onAppend: (e: E<MouseEvent>) => void;
  onInsertDifferent: (e: E<MouseEvent>) => void;
  onUpdateAll: (e: E<MouseEvent>) => void;
  onSwap: (e: E<MouseEvent>) => void;
  onClear: (e: E<MouseEvent>) => void;
};

const Header = component<HeaderProps>(
  ({ onCreate, onPrepend, onAppend, onInsertDifferent, onUpdateAll, onSwap, onClear }) => {
    return div({
      style:
        'width: 100%; height: 64px; background-color: blueviolet; display: flex; align-items: center; padding: 16px;',
      slot: [
        button({
          slot: Text('create 10000 rows'),
          onClick: onCreate,
        }),
        button({
          slot: Text('Prepend 1000 rows'),
          onClick: onPrepend,
        }),
        button({
          slot: Text('Append 1000 rows'),
          onClick: onAppend,
        }),
        button({
          slot: Text('insert different'),
          onClick: onInsertDifferent,
        }),
        button({
          slot: Text('update every 10th row'),
          onClick: onUpdateAll,
        }),
        button({
          slot: Text('swap rows'),
          onClick: onSwap,
        }),
        button({
          slot: Text('clear rows'),
          onClick: onClear,
        }),
      ],
    });
  },
);

const MemoHeader = memo(Header, () => false);

type RowProps = {
  item: DataItem;
  selected$: Atom<number>;
  onRemove: (id: number, e: E<MouseEvent>) => void;
  onHighlight: (id: number, e: E<MouseEvent>) => void;
};

const Row = component<RowProps>(({ item, selected$, onRemove, onHighlight }) => {
  const { id } = item;
  const [name, selected] = useAtom([[item.name$], [selected$, (p, n) => p === id || n === id]]);

  return tr({
    class: selected === id ? 'selected' : undefined,
    flag,
    slot: [
      td({ class: 'cell', slot: Text(name) }),
      Guard({
        slot: [
          td({ class: 'cell', slot: Text('qqq') }),
          td({ class: 'cell', slot: Text('xxx') }),
          td({
            class: 'cell',
            slot: [
              button({
                onClick: [onRemove, id],
                slot: Text('remove'),
              }),
              button({
                onClick: [onHighlight, id],
                slot: Text('highlight'),
              }),
            ],
          }),
        ],
      }),
    ],
  });
});

const MemoRow = memo(Row, () => false);

type State = {
  listX: Array<DataItem>;
  selected$: Atom<number>;
};

const App = component(() => {
  const state = useReactiveState<State>({ selected$: atom(), listX: [] }, { forceSync: true });
  const { selected$ } = state;

  const handleCreate = (e: E<MouseEvent>) => {
    measurer.start('create');
    e.stopPropagation();
    state.listX = buildData(10000);
    measurer.stop();
  };
  const handlePrepend = (e: E<MouseEvent>) => {
    measurer.start('prepend');
    e.stopPropagation();
    const list = [...buildData(1000, '!!!'), ...state.listX];

    state.listX = list;
    measurer.stop();
  };
  const handleAppend = (e: E<MouseEvent>) => {
    measurer.start('append');
    e.stopPropagation();
    const list = [...state.listX, ...buildData(1000, '!!!')];

    state.listX = list;
    measurer.stop();
  };
  const handleInsertDifferent = (e: E<MouseEvent>) => {
    measurer.start('insert different');
    e.stopPropagation();
    const list = [...state.listX];

    list.splice(0, 0, ...buildData(5, '***'));
    list.splice(8, 0, ...buildData(2, '***'));

    state.listX = list;
    measurer.stop();
  };
  const handleSwap = (e: E<MouseEvent>) => {
    if (state.listX.length === 0) return;
    measurer.start('swap');
    e.stopPropagation();
    const list = [...state.listX];
    const temp = list[1];

    list[1] = list[list.length - 2];
    list[list.length - 2] = temp;

    state.listX = list;
    measurer.stop();
  };
  const handleClear = (e: E<MouseEvent>) => {
    measurer.start('clear');
    e.stopPropagation();
    state.listX = [];
    state.selected$.set(undefined);
    measurer.stop();
  };
  const handleRemove = (id: number, e: E<MouseEvent>) => {
    measurer.start('remove');
    e.stopPropagation();
    const list = [...state.listX];
    const idx = list.findIndex(x => x.id === id);

    idx !== -1 && list.splice(idx, 1);

    state.listX = list;
    state.selected$.set(undefined);
    measurer.stop();
  };
  const handleUpdateAll = (e: E<MouseEvent>) => {
    measurer.start('update every 10th');
    e.stopPropagation();

    for (let i = 0; i < state.listX.length; i += 10) {
      const item = state.listX[i];

      item.name$.set(item.name$.get() + '!!!');
    }

    measurer.stop();
  };
  const handleHightlight = (id: number, e: E<MouseEvent>) => {
    measurer.start('highlight');
    e.stopPropagation();
    state.selected$.set(id);
    measurer.stop();
  };

  return [
    MemoHeader({
      onCreate: handleCreate,
      onPrepend: handlePrepend,
      onAppend: handleAppend,
      onInsertDifferent: handleInsertDifferent,
      onUpdateAll: handleUpdateAll,
      onSwap: handleSwap,
      onClear: handleClear,
    }),
    table({
      class: 'table',
      slot: tbody({
        slot: state.listX.map(item => {
          return MemoRow({
            key: item.id,
            item,
            selected$,
            onRemove: handleRemove,
            onHighlight: handleHightlight,
          });
        }),
      }),
    }),
  ];
});

createRoot(document.getElementById('root')).render(App());
