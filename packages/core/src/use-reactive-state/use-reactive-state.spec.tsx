/** @jsx h */
import { dom } from '@test-utils';
import { render } from '@dark-engine/platform-browser';
import { h } from '../element';
import { createComponent } from '../component/component';
import { useReactiveState } from './use-reactive-state';

let host: HTMLElement = null;

jest.useFakeTimers();

beforeEach(() => {
  host = document.createElement('div');
});

describe('[use-reactive-state]', () => {
  test('can trigger render and update state correctly', () => {
    const content = (count: number) => dom`
      <div>${count}</div>
    `;

    type State = { count: number };

    let state: State;

    const App = createComponent(() => {
      state = useReactiveState<State>({ count: 0 });

      return <div>{state.count}</div>;
    });

    render(App(), host);
    expect(host.innerHTML).toBe(content(0));

    state.count++;
    jest.runAllTimers();
    expect(host.innerHTML).toBe(content(1));

    state.count++;
    jest.runAllTimers();
    expect(host.innerHTML).toBe(content(2));
  });

  test('can works with nested objects', () => {
    const content = (count: number) => dom`
      <div>${count}</div>
    `;

    type State = {
      child: {
        child: {
          count: number;
        };
      };
    };

    let state: State;

    const App = createComponent(() => {
      state = useReactiveState<State>({
        child: {
          child: {
            count: 0,
          },
        },
      });

      return <div>{state.child.child.count}</div>;
    });

    render(App(), host);
    expect(host.innerHTML).toBe(content(0));

    state.child.child.count++;
    jest.runAllTimers();
    expect(host.innerHTML).toBe(content(1));

    state.child.child.count++;
    jest.runAllTimers();
    expect(host.innerHTML).toBe(content(2));
  });

  test('can works with arrays', () => {
    const content = (count: number) => dom`
      <div>${count}</div>
    `;

    type State = Array<number>;

    let state: State;

    const App = createComponent(() => {
      state = useReactiveState<State>([]);

      return <div>{state.length}</div>;
    });

    render(App(), host);
    expect(host.innerHTML).toBe(content(0));

    state.push(0);
    jest.runAllTimers();
    expect(host.innerHTML).toBe(content(1));

    state.push(0);
    jest.runAllTimers();
    expect(host.innerHTML).toBe(content(2));
  });

  test('throws exception when initial state is no defined', () => {
    let error = null;

    const App = createComponent(() => {
      try {
        useReactiveState(null);
      } catch (err) {
        error = err;
      }

      return null;
    });

    render(App(), host);
    expect(error).toBeTruthy();
  });
});
