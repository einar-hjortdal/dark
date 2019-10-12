import { createComponent, h, Text, View } from '../src/core';
import { renderComponent } from '../src/platform/browser';

const div = (props = {}) => View({ ...props, as: 'div' });
const button = (props = {}) => View({ ...props, as: 'button' });
const input = (props = {}) => View({ ...props, as: 'input', isVoid: true });

const list = [...Array(100).fill(0)];

const Component = createComponent(({ text }) => {
  return div({
    children: [
      button({
        onClick: () => {
          list.pop();
          renderComponent(App({ isOpen: true, count: text }), document.getElementById('app'));
        },
        children: [Text(text)],
      }),
    ],
  });
});

const Portal = createComponent(({ value = '' }) => {
  return [Text(`portal: ${value}`)];
});

const domElement = document.getElementById('app');
const domElement2 = document.getElementById('app2');

const Container = createComponent(({ slot }) => {
  // return div({
  //   style: 'color: red',
  //   slot: slot(5)
  // });

  return (
    <div style='color: red'>
      {slot(5)}
    </div>
  );
})

const App = createComponent(({ value = '' }) => {
  // const renderInput = () => {
  //   return (
  //     <input
  //       value={value}
  //       onInput={(e) => renderComponent(App({ value: e.target.value }), domElement)}
  //     />
  //   );
  // };

  //renderComponent(Portal({ value }), domElement2);  

  // return (
  //   Container({
  //     slot: (v) => div({ slot: Text(v) }),
  //   })
  // );

  return [
    <Container>
      {(v) => <div>{v}</div>}
    </Container>,
    <Container>
      {(v) => <div>{v}</div>}
    </Container>
  ];
});

renderComponent(App(), domElement);

// setTimeout(() => {
//   renderComponent(App({ isOpen: false }), document.getElementById('app'));
// }, 2000)

// setTimeout(() => {
//   renderComponent(App({ isOpen: true }), document.getElementById('app'));
// }, 4000)
