# Dark

Dark is component-based UI rendering engine for javascript apps without dependencies and written in Typescript 💫

## Notice
This project was written in my free time as a hobby. I challenged myself: can I write something similar to React without third-party dependencies and alone. It took me about 4 years to bring it to an acceptable quality (but this is not accurate). It would probably take you much less time to do it. I rewrote it many times from scratch because I didn't like a lot of it. In the end, I decided to bring it to release, since the "ideal" is still unattainable. In addition, it is necessary to bring the work started to the end. I didn't get to do a lot of what I wanted to do. That is life. You can use the code at your own risk.

## Installation
npm:
```
npm install @dark-engine/core @dark-engine/platform-browser
```
yarn:
```
yarn add @dark-engine/core @dark-engine/platform-browser
```
## API overview
The public API is partially similar to the React API and includes 2 packages - core and browser support.

```tsx
import {
  h,
  View,
  Text,
  Comment,
  Fragment,
  createComponent,
  createContext,
  memo,
  lazy,
  forwardRef,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useError,
  useImperativeHandle,
  useMemo,
  useReducer,
  useRef,
  useState,
} from '@dark-engine/core';
import { render, createPortal } from '@dark-engine/platform-browser';
```
## Shut up and show me your code!

For example this is timer component

```tsx
import {
  h,
  createComponent,
  useState,
  useEffect,
  TagVirtualNodeFactory,
} from '@dark-engine/core';
import { render } from '@dark-engine/platform-browser';

type TimerProps = {
  slot?: (value: number) => TagVirtualNodeFactory;
};

const Timer = createComponent<TimerProps>(({ slot }) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timerId = setInterval(() => {
      setSeconds(x => x + 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, []);

  return slot(seconds);
});

const App = createComponent(() => {
  return [
    <div>Timer component is just logic without view...</div>,
    <Timer>{(seconds: number) => <div>timer: {seconds}</div>}</Timer>,
  ];
});

render(<App />, document.getElementById('root'));
```

Here's the same code but without using JSX

```tsx
import {
  View,
  Text,
  createComponent,
  useState,
  useEffect,
  TagVirtualNodeFactory,
} from '@dark-engine/core';
import { render } from '@dark-engine/platform-browser';

const div = props => View({ ...props, as: 'div' });

type TimerProps = {
  slot?: (value: number) => TagVirtualNodeFactory;
};

const Timer = createComponent<TimerProps>(({ slot }) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timerId = setInterval(() => {
      setSeconds(x => x + 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, []);

  return slot(seconds);
});

const App = createComponent(() => {
  return [
    div({
      slot: Text('Timer component is just logic without view...')
    }),
    Timer({
      slot: (seconds: number) => div({
        slot: Text(`timer: ${seconds}`),
      }),
    }),
  ];
});

render(App(), document.getElementById('root'));
```

## A little more about the API...

#### h
This is the function you need to enable JSX support and write in a React-like style. If you are writing in typescript you need to enable custom JSX support in tsconfig.json like this:
```json
{
  "compilerOptions": {
    "jsx": "react",
    "jsxFactory": "h"
  }
}

```
```tsx
import { h } from '@dark-engine/core';

render(<h1>Hello world</h1>, document.getElementById('root'));
```

#### View, Text, Comment
These are the basic entities corresponding to tags, text and comments if you are not using JSX.

```tsx
const h1 = props => View({ ...props, as: 'h1' });

render(
  [
    h1({ slot: Text('Hello world') }),
    Comment('I am comment in DOM'),
  ],
  document.getElementById('root')
);
```

#### createComponent
This is a fundamental function that creates components with their own logic and possibly nested components.

```tsx
type SkyProps = {
  color: string;
};

const Sky = createComponent<SkyProps>(({ color }) => {
  return <div style={`color: ${color}`}>My color is {color}</div>;
});

render(<Sky color='deepskyblue' />, document.getElementById('root'));
```

A component can return an array of elements or components:

```tsx
const App = createComponent(props => {
  return [
    <header>Header</header>,
    <div>Content</div>,
    <footer>Footer</footer>,
  ];
});
```

You can also use Fragment as an alias for an array:

```tsx
return (
  <Fragment>
    <header>Header</header>
    <div>Content</div>
    <footer>Footer</footer>
  </Fragment>
);
```

If a child element is passed to the component, it will appear in props as slot:

```tsx
const App = createComponent(({ slot }) => {
  return [
    <header>Header</header>,
    <div>{slot}</div>,
    <footer>Footer</footer>,
  ];
});

render(<App>Content</App>, document.getElementById('root'));
```

#### memo
This buddy is needed in order to optimize rerendering performance and tell Dark when to skip rendering.

```tsx
const HardComponent = createComponent(() => {
  console.log('HardComponent render!');

  return <div>I'm too complicated</div>;
});

const MemoHardComponent = memo(HardComponent);

const App = createComponent(() => {
  console.log('App render!');

  useEffect(() => {
    setInterval(() => {
      render(<App />, document.getElementById('root'));
    }, 1000);
  }, []);

  return [<div>app</div>, <MemoHardComponent />];
});

render(<App />, document.getElementById('root'));
```
```
App render!
HardComponent render!
App render!
App render!
App render!
...
```
As the second argument, it takes a function that answers the question of when to re-render the component:

```tsx
const MemoComponent = memo(Component, (prevProps, nextProps) => prevProps.one !== nextProps.one);
```

### Hooks
Hooks are needed to bring components to life: give them an internal state, start some actions, and so on. The basic rule for using hooks is to use them at the top level of the component, i.e. do not nest them inside other functions, cycles, conditions. This is a necessary condition, because hooks are not magic, but work based on array indices.

#### useState
This is a hook to store the state and call to update a piece of the interface.

```tsx
const App = createComponent(() => {
  const [count, setCount] = useState(0);

  const handleClick = () => setCount(count + 1);

  return [
    <div>count: {count}</div>,
    <button onClick={handleClick}>Click me</button>,
  ];
});
```

Setter can pass function as argument:

```tsx
const handleClick = () => setCount(x => x + 1);
```

#### useEffect
Needed to run side effects in a component, such as asynchronous requests to the server or calling timers.

```tsx
const App = createComponent(() => {
  const [albums, setAlbums] = useState<Array<Album>>([]);

  useEffect(() => {
    fetch('https://jsonplaceholder.typicode.com/albums')
      .then(x => x.json())
      .then(x => setAlbums(x.splice(0, 10)));
  }, []);

  if (albums.length === 0) return <div>loading...</div>;

  return (
    <ul>
      {albums.map(x => (
        <li key={x.id}>{x.title}</li>
      ))}
    </ul>
  );
});
```
The second argument to this hook is an array of dependencies that tells it when to restart. This parameter is optional, then the effect will be restarted on every render.

#### useMemo 
It's needed to draw complex parts of the interface, if their rerender may depend on external variables. Or for complex calculations that can be remembered. Stores the last result of a calculation in memory. Also accepts an array of dependencies.

```tsx
const memoizedValue = useMemo(() => Math.random(), []);
const memoizedUI = useMemo(() => <div>I will rerender when dependencies change</div>, []);

return [<div>{memoizedValue}</div>, memoizedUI];
```

#### useCallback
useCallback saves the last value of the function so as not to cause a re-render of the memoized component that receives this callback.

```tsx
 const handleClick = useCallback(() => setCount(count + 1), [count]);

 return (
    <button onClick={handleClick}>add</button>
  );
```

#### useRef
Needed to catch a link to a DOM element or another component.

```tsx
const rootRef = useRef<HTMLInputElement>(null);

useEffect(() => {
  rootRef.current.focus();
}, []);

return <input ref={rootRef} />;
```

#### useImperativeHandle
This hook needed to populate a component ref with an object, Used in conjunction with forwardRef.

```tsx
type DogRef = {
  growl: () => void;
};

const Dog = forwardRef<{}, DogRef>(
  createComponent((_, ref) => {
    useImperativeHandle(
      ref,
      () => ({
        growl: () => console.log('rrrr!'),
      }),
      [],
    );

    return <div>I'm dog</div>;
  }),
);

const App = createComponent(() => {
  const dogRef = useRef<DogRef>(null);

  useEffect(() => {
    dogRef.current.growl();
  }, []);

  return <Dog ref={dogRef} />;
});
```

#### useError
Catches rendering errors:

```tsx
const BrokenComponent = createComponent<BrokenComponent>(({ hasError }) => {
  if (hasError) {
    throw new Error('oh no!');
  }

  return <div>BrokenComponent</div>;
});

const App = createComponent(() => {
  const [hasError, setHasError] = useState(false);
  const error = useError();

  useEffect(() => {
    setTimeout(() => {
      setHasError(true);
    }, 5000);
  }, []);

  if (error) {
    return <div>Something went wrong!</div>;
  }

  return (
    <div>
      <div>Text 1</div>
      <BrokenComponent hasError={hasError} />
    </div>
  );
});
```

# LICENSE

MIT © [Alex Plex](https://github.com/atellmer)
