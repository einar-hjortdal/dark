// import { type DarkElement, component, lazy, Suspense, memo, useState, useTransition } from '@dark-engine/core';
// import { type DarkJSX, createRoot } from '@dark-engine/platform-browser';
// import { type Routes, Router, NavLink } from '@dark-engine/web-router';
// import { createGlobalStyle, styled } from '@dark-engine/styled';

// const NormalTab1 = component(() => (console.log('tab 1'), (<normal-tab-1>tab 1</normal-tab-1>)));
// const NormalTab2 = component(() => (console.log('tab 2'), (<normal-tab-2>tab 2</normal-tab-2>)));
// const SlowTab = memo(
//   component(() => {
//     const items = [];

//     console.log('slow');

//     for (let i = 0; i < 100; i++) {
//       items.push(<SlowItem key={i} />);
//     }

//     return <slow-tab>slow {items}</slow-tab>;
//   }),
// );
// const SlowItem = component(() => {
//   const t = performance.now() + 10;

//   while (performance.now() < t) {
//     //
//   }

//   return null;
// });
// const App = component(() => {
//   const [isPending, startTransition] = useTransition();
//   const [idx, setIdx] = useState(0);

//   return (
//     <div style={isPending ? 'background-color: red' : undefined}>
//       <button onClick={() => setIdx(0)}>tab 1</button>
//       <button onClick={() => setIdx(1)}>tab 2</button>
//       <button onClick={() => startTransition(() => setIdx(2))}>slow tab</button>
//       <br />
//       {idx === 0 && <NormalTab1 />}
//       {idx === 1 && <NormalTab2 />}
//       {idx === 2 && <SlowTab />}
//     </div>
//   );
// });

import { type DarkElement, component, lazy, Suspense, memo, scheduler, useSyncExternalStore } from '@dark-engine/core';
import { type DarkJSX, createRoot } from '@dark-engine/platform-browser';
import { type Routes, Router, NavLink } from '@dark-engine/web-router';
import { createGlobalStyle, styled } from '@dark-engine/styled';

import { PageTransition } from './page-transition';
import { Pending } from './pending';

function getSnapshot() {
  return navigator.onLine;
}

function subscribe(callback) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);

  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function useOnlineStatus() {
  const isOnline = useSyncExternalStore(subscribe, getSnapshot);

  return isOnline;
}

const Home = lazy(() => import('./home'));
const About = lazy(() => import('./about'));
const Contacts = lazy(() => import('./contacts'));
const routes: Routes = [
  {
    path: 'home',
    component: Home,
  },
  {
    path: 'about',
    component: About,
  },
  {
    path: 'contacts',
    component: Contacts,
  },
  {
    path: '**',
    redirectTo: 'home',
  },
];

const SlowItem = component(
  () => {
    const t = performance.now() + 5;

    while (performance.now() < t) {
      //
    }

    return null;
  },
  { displayName: 'SlowItem' },
);

const SlowContent = component(
  () => {
    console.log('---SLOW---');
    return (
      <>
        {Array(100)
          .fill(null)
          .map(() => (
            <SlowItem />
          ))}
      </>
    );
  },
  { displayName: 'SlowContent' },
);

type ConcurrentProps = {
  slot: DarkElement;
};

const Concurrent = memo(
  component<ConcurrentProps>(
    ({ slot }) => {
      console.log('---CONCURRENT---');
      return slot;
    },
    { displayName: 'Concurrent' },
  ),
  () => scheduler.detectIsTransition(),
);

type ShellProps = {
  slot: DarkElement;
};

const Shell = component<ShellProps>(
  ({ slot }) => {
    const isOnline = useOnlineStatus();

    return (
      <PageTransition>
        {isOnline ? 'Online' : 'Offline'}
        <Concurrent>
          <header>
            <NavLink to='/home'>Home</NavLink>
            <NavLink to='/about'>About</NavLink>
            <NavLink to='/contacts'>Contacts</NavLink>
            <Pending overlay />
          </header>
          <Suspense fallback={<Spinner />}>
            <main>{slot}</main>
          </Suspense>
          {/* <SlowContent /> */}
        </Concurrent>
      </PageTransition>
    );
  },
  { displayName: 'Shell' },
);

const App = component(() => {
  return (
    <>
      <GlobalStyle />
      <Router routes={routes} mode='concurrent'>
        {slot => <Shell>{slot}</Shell>}
      </Router>
    </>
  );
});

const Spinner = component(() => <div>Loading...</div>, { displayName: 'Spinner' });

const GlobalStyle = createGlobalStyle`
  * {
      box-sizing: border-box;
    }

  html {
    font-size: 14px;
  }

  html, body {
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: 'Roboto';
    background-color: #fff;
    overflow-y: scroll;
    overflow-x: hidden;
  }

  header {
    width: 100%;
    background-color: #03a9f4;
    padding: 6px;
    color: #fff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
    display: flex;
    align-items: center;
  }

  header a {
    color: #fff;
    text-transform: uppercase;
    font-size: 0.9rem;
  }

  header a:hover {
    color: #fff59d;
  }

  main {
    width: 100%;
    padding: 16px;
    display: flex;
  }

  a {
    margin: 4px;
    text-decoration: none;
    transition: color 0.2s ease-in-out;
  }

  h1 {
    margin: 0;
    margin-bottom: 16px;
  }

  img {
    width: 600px;
    min-height: 300px;
    max-width: 100%;
    margin: 20px auto;
    background-color: #eeeeee;
    object-fit: cover;
  }

  article {
    margin: 0 auto;
    max-width: 1024px;
    display: flex;
    flex-flow: column nowrap;
  }

  #root {
    width: 100%;
    height: 100%;
    display: grid;
    grid-template-rows: 48px 1fr;
  }

  .active-link {
    color: #ffeb3b;
    text-decoration: underline;
  }

  .active-link:hover {
    color: #ffeb3b;
  }

  p {
    line-height: 2;
  }
`;

createRoot(document.getElementById('root')).render(<App />);
