import {
  h,
  View,
  Text,
  createComponent,
} from '../src/core';
import { render } from '../src/platform/browser';


const div = (...props) => View({ as: 'div', ...props });
const host = document.getElementById('root');
const portal = document.getElementById('root2');

let nextId = 0;

const generateItems = (count: number) => {
  return Array(count).fill(0).map(x => ({
    id: ++nextId,
    name: nextId,
  }));
};

const ListItem = createComponent(({ key, id, slot, onRemove }) => {
  return (
    <div key={key} class='list-item'>
      <div>slot: {slot}</div>
      <div>
        <button onClick={() => onRemove(id)}>remove</button>
      </div>
    </div>
  );
}, { displayName: 'ListItem' })

const List = createComponent(({ items }) => {
  const handleRemove = (id: number) => {
    const newItems = items.filter(x => x.id !== id);

    render(App({ items: newItems }), host);
  };

  return items.map((x => {
    return (
      <ListItem key={x.id} id={x.id} onRemove={handleRemove}>
        {x.name}
      </ListItem>
    )
  }))
}, { displayName: 'List' });

const App = createComponent(({ items }) => {
  const handleAddItems = () => {
    render(App({ items: [...items, ...generateItems(10)] }), host);
  };
  const handleSwap = () => {
    const newItems = [...items];
    newItems[1] = items[items.length - 2];
    newItems[newItems.length - 2] = items[1];

    render(App({ items: newItems }), host);
  };

  return [
    <div style='display: flex'>
      <button onClick={handleAddItems}>add items</button>
      <button onClick={handleSwap}>swap</button>
    </div>,
    <List items={items} />,
    <div>footer</div>,
  ]
});

render(App({ items: generateItems(10000) }), host);
