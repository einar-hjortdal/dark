import { requestIdleCallback, animationFrame } from '@shopify/jest-dom-mocks';

import { render } from './render';
import { createComponent } from '../../../core/component/component';
import { View, Text, Comment } from '../../../core/view/view';
import { dom } from '../../../../test/utils';


type Item = { id: number; name: string };

let host: HTMLElement = null;
const div = (props = {}) => View({ ...props, as: 'div' });

let nextId = 0;

const generateItems = (count: number) => {
  return Array(count).fill(0).map(x => ({
    id: ++nextId,
    name: nextId.toString(),
  }));
}

beforeAll(() => {
  jest.useFakeTimers();
  animationFrame.mock();
  requestIdleCallback.mock();
});

beforeEach(() => {
  nextId = 0;
  host = document.createElement('div');
});

test('[Render]: render do not throws error', () => {
  const Component = createComponent(() => null);
  const compile = () => {
    render(Component(), host);
  };

  expect(compile).not.toThrowError();
});

test('[Render]: render text correctly', () => {
  const content = 'hello';
  const Component = createComponent(() => Text(content));

  render(Component(), host);
  expect(host.innerHTML).toBe(content);
});

test('[Render]: render tag correctly', () => {
  const content = '<div></div>';
  const Component = createComponent(() => div());

  render(Component(), host);
  expect(host.innerHTML).toBe(content);
});

test('[Render]: render comment correctly', () => {
  const content = 'some comment';
  const Component = createComponent(() => Comment(content));

  render(Component(), host);
  expect(host.innerHTML).toBe(`<!--${content}-->`);
});

test('[Render]: render array of items correctly', () => {
  const content = dom`
    <div></div>
    <div></div>
    <div></div>
  `;
  const Component = createComponent(
    () => [div(), div(), div()],
  );

  render(Component(), host);
  expect(host.innerHTML).toBe(content);
});

test('[Render]: conditional rendering works correctly', () => {
  type AppProps = {
    items: Array<Item>;
    one: boolean;
  };

  const ListItem = createComponent(({ slot }) => {
    return div({
      slot,
    });
  })

  const ListOne = createComponent<{ items: AppProps['items'] }>(({ items }) => {
    return items.map((x => {
      return ListItem({
        key: x.id,
        slot: Text(x.name),
      })
    }))
  });

  const ListTwo = createComponent<{ items: AppProps['items'] }>(({ items }) => {
    return items.map((x => {
      return ListItem({
        key: x.id,
        slot: Text(x.name),
      })
    }))
  });

  const App = createComponent<AppProps>(({ one, items }) => {
    return [
      div({ slot: Text('header') }),
      one
        ? ListOne({ items })
        : ListTwo({ items }),
      div({ slot: Text('footer') }),
    ]
  });

  let items = generateItems(3);

  render(App({ one: true, items }), host);

  const content = (items: AppProps['items']) => dom`
    <div>header</div>
    ${items.map(x => `<div>${x.name}</div>`).join('')}
    <div>footer</div>
  `;

  expect(host.innerHTML).toBe(content(items));

  jest.advanceTimersByTime(10);

  items = generateItems(3);
  render(App({ one: false, items }), host);
  expect(host.innerHTML).toBe(content(items));

  jest.advanceTimersByTime(10);

  items = generateItems(4);
  render(App({ one: true, items }), host);
  expect(host.innerHTML).toBe(content(items));

  jest.advanceTimersByTime(10);

  items = generateItems(2);
  render(App({ one: false, items }), host);
  expect(host.innerHTML).toBe(content(items));
});

describe('[Render]: adding/removing/swap nodes', () => {
  type AppProps = {
    items: Array<Item>;
  };
  const itemAttrName = 'data-item';
  let items = [];

  const ListItem = createComponent(({ slot }) => {
    return div({
      [itemAttrName]: true,
      slot,
    });
  })

  const List = createComponent<AppProps>(({ items }) => {
    return items.map((x => {
      return ListItem({
        key: x.id,
        slot: Text(x.name),
      })
    }))
  });

  const App = createComponent<AppProps>(({ items }) => {
    return [
      div({ slot: Text('header') }),
      List({ items }),
      div({ slot: Text('footer') }),
    ]
  });

  const renderApp = () => render(App({ items }), host);

  const content = (items: Array<Item>) => dom`
    <div>header</div>
    ${items.map(x => `<div ${itemAttrName}="true">${x.name}</div>`).join('')}
    <div>footer</div>
  `;

  const addItemsToEnd = (count: number) => {
    items = [...items, ...generateItems(count)];
  };
  const addItemsToStart = (count: number) => {
    items = [...generateItems(count), ...items];
  };
  const removeItem = (id: number) => {
    items = items.filter(x => x.id !== id);
  };
  const swapItems = () => {
    const newItems = [...items];

    newItems[1] = items[items.length - 2];
    newItems[newItems.length - 2] = items[1];
    items = newItems;
  };

  test('nodes added correctly', () => {
    items = generateItems(5);
    renderApp();
    expect(host.innerHTML).toBe(content(items));

    jest.advanceTimersByTime(100);
    addItemsToEnd(5);
    renderApp();
    expect(host.innerHTML).toBe(content(items));

    jest.advanceTimersByTime(100);
    addItemsToStart(5)
    renderApp();
    expect(host.innerHTML).toBe(content(items));
  });

  test('nodes not recreated after adding', () => {
    items = generateItems(5);
    renderApp();

    const nodes = Array.from(host.querySelectorAll(`[${itemAttrName}]`));
    const node = nodes[0];
    const expected = node.textContent;
    const count = 4;

    jest.advanceTimersByTime(100);
    addItemsToStart(count);
    renderApp();

    const newNodes = Array.from(host.querySelectorAll(`[${itemAttrName}]`));
    const newNode = newNodes[count];

    expect(node).toBe(newNode);
    expect(node.textContent).toBe(expected);
  });

  test('nodes removed correctly', () => {
    items = generateItems(10);
    renderApp();
    expect(host.innerHTML).toBe(content(items));

    jest.advanceTimersByTime(100);
    removeItem(6);
    renderApp();
    expect(host.innerHTML).toBe(content(items));

    jest.advanceTimersByTime(100);
    removeItem(5);
    removeItem(1);
    renderApp();
    expect(host.innerHTML).toBe(content(items));

    jest.advanceTimersByTime(100);
    items = [];
    renderApp();
    expect(host.innerHTML).toBe(content(items));
  });

  test('nodes not recreated after removing', () => {
    items = generateItems(10);
    renderApp();

    const nodes = Array.from(host.querySelectorAll(`[${itemAttrName}]`));
    const node = nodes[8];
    const expected = node.textContent;

    jest.advanceTimersByTime(100);
    removeItem(6);
    renderApp();
    const newNodes = Array.from(host.querySelectorAll(`[${itemAttrName}]`));

    expect(node).toBe(newNodes[7]);
    expect(node.textContent).toBe(expected);
  });

  test('nodes swapped correctly', () => {
    items = generateItems(10);
    renderApp();

    const nodes = Array.from(host.querySelectorAll(`[${itemAttrName}]`));
    const nodeOne = nodes[1];
    const nodeTwo = nodes[8];

    expect(nodeOne.textContent).toBe('2');
    expect(nodeTwo.textContent).toBe('9');

    swapItems();
    renderApp();

    const newNodes = Array.from(host.querySelectorAll(`[${itemAttrName}]`));
    const newNodeOne = newNodes[8];
    const newNodeTwo = newNodes[1];

    expect(newNodeOne.textContent).toBe('2');
    expect(newNodeTwo.textContent).toBe('9');
  });

})
