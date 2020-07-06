import {
  h,
  View,
  Text,
  createComponent,
  Fragment,
} from '../src/core';
import { render } from '../src/platform/browser';


const div = (props = {}) => View({ as: 'div', ...props });
const host = document.getElementById('root');
const host2 = document.getElementById('root2');

let nextId = 0;

const generateItems = (count: number) => {
  return Array(count).fill(0).map(x => ({
    id: ++nextId,
    name: nextId,
    selected: false,
  }));
};

const ListItem = createComponent(({ id, slot, selected, onSelect, onRemove }) => {
  return (
    <tr class={selected ? 'selected' : ''}>
      <td class='cell'>{slot}</td>
      <td class='cell'>xxx</td>
      <td class='cell'>yyy</td>
      <td class='cell'>
        <button onClick={() => onSelect(id)}>highlight</button>
        <button onClick={() => onRemove(id)}>remove</button>
      </td>
    </tr>
  );
})

const List = createComponent(({ items }) => {
  const handleRemove = (id: number) => {
    const newItems = items.filter(x => x.id !== id);

    render(App({ items: newItems }), host);
  };
  const handleSelect = (id: number) => {
    const newItems = items.map(x => x.id === id ? (x.selected = !x.selected, x) : x);

    render(App({ items: newItems }), host);
  };

  return (
    <table class='table'>
      <tbody>
      {items.map((x => {
        return (
          <ListItem key={x.id} selected={x.selected} id={x.id} onSelect={handleSelect} onRemove={handleRemove}>
            {x.name}
          </ListItem>
        )
        }))
      }</tbody>
    </table>
  );
}, { displayName: 'List' });

const App = createComponent<{items: Array<any>;}>(({ items = [] }) => {
  const handleCreate = () => {
    render(App({ items: [...generateItems(100000)] }), host);
  };
  const handleAddItems = () => {
    render(App({ items: [...generateItems(1000), ...items] }), host);
  };
  const handleSwap = () => {
    const newItems = [...items];
    newItems[1] = items[items.length - 2];
    newItems[newItems.length - 2] = items[1];

    render(App({ items: newItems }), host);
  };

  return [
    <div style='display: flex'>
      <button onClick={handleCreate}>create</button>
      <button onClick={handleAddItems}>add items</button>
      <button onClick={handleSwap}>swap</button>
    </div>,
    <List items={items} />,
  ]
});

render(App({ items: generateItems(100) }), host);


