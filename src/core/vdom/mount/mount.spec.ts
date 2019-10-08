import { createComponent } from '@core/component';
import { EMPTY_NODE, Text, View, VirtualNode } from '../vnode';
import { mountVirtualDOM } from './mount';

const div = (props = {}) => View({ ...props, as: 'div' });

test('[mount vdom]: mount children correctly', () => {
  const Component = createComponent(() => {
    return div();
  });

  const App = createComponent(() => {
    return div({
      children: [
        Text('hello'),
        ...Array(4)
          .fill(0)
          .map((_, idx) => Component()),
      ],
    });
  });

  const vdom = mountVirtualDOM(App()) as VirtualNode;

  expect(vdom.children.length).toBe(5);
});

describe('[mount vdom]: mount children correctly with arrays', () => {
  const Item = createComponent(() => {
    return div();
  });

  const ListTwo = createComponent(() => {
    return [Text('one'), Text('two'), Item()];
  });

  const ListOne = createComponent(() => {
    return [ListTwo(), ListTwo()];
  });

  const App = createComponent(() => {
    return div({
      children: [ListOne(), ListOne()],
    });
  });

  const vdom = mountVirtualDOM(App()) as VirtualNode;

  test('right numbers of children', () => {
    expect(vdom.children.length).toBe(12);
  });
  test('mounting components recursively', () => {
    expect(vdom.children.every(vNode => vNode.isVirtualNode === true)).toBe(true);
  });
});

test('[mount vdom]: mount empty result', () => {
  const App = createComponent(() => {
    return null;
  });

  const vdom = mountVirtualDOM(App()) as VirtualNode;

  expect(vdom.text).toBe(EMPTY_NODE);
});
