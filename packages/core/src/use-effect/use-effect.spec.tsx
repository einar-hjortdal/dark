import { render } from '@dark-engine/platform-browser';

import { component } from '../component';
import { useUpdate } from '../use-update';
import { useEffect } from './use-effect';

let host: HTMLElement = null;

jest.useFakeTimers();

beforeEach(() => {
  host = document.createElement('div');
});

describe('@core/use-effect', () => {
  test('runs async', () => {
    const effectFn = jest.fn();
    const App = component(() => {
      useEffect(() => effectFn(), []);

      return null;
    });

    render(App(), host);
    expect(effectFn).toBeCalledTimes(0);
    jest.runAllTimers();
    expect(effectFn).toBeCalledTimes(1);
  });

  test('fires on mount event', () => {
    const mockFn = jest.fn();

    const $render = (props = {}) => {
      render(App(props), host);
    };

    const App = component(() => {
      useEffect(() => mockFn(), []);

      return null;
    });

    $render();
    jest.runAllTimers();
    expect(mockFn).toBeCalledTimes(1);

    $render();
    jest.runAllTimers();
    expect(mockFn).toBeCalledTimes(1);
  });

  test('works correctly with deps', () => {
    type AppProps = {
      x: number;
    };
    const effectFn = jest.fn();
    const dropFn = jest.fn();

    const $render = (props: AppProps) => {
      render(App(props), host);
    };

    const App = component<AppProps>(({ x }) => {
      useEffect(() => {
        effectFn();
        return () => dropFn();
      }, [x]);

      return null;
    });

    $render({ x: 1 });
    jest.runAllTimers();
    expect(effectFn).toBeCalledTimes(1);
    expect(dropFn).toBeCalledTimes(0);

    $render({ x: 1 });
    jest.runAllTimers();
    expect(effectFn).toBeCalledTimes(1);
    expect(dropFn).toBeCalledTimes(0);

    $render({ x: 2 });
    jest.runAllTimers();
    expect(effectFn).toBeCalledTimes(2);
    expect(dropFn).toBeCalledTimes(1);

    $render({ x: 3 });
    jest.runAllTimers();
    expect(effectFn).toBeCalledTimes(3);
    expect(dropFn).toBeCalledTimes(2);
  });

  test('fires on every render without deps', () => {
    const effectFn = jest.fn();
    const dropFn = jest.fn();

    const $render = (props = {}) => {
      render(App(props), host);
    };

    const App = component(() => {
      useEffect(() => {
        effectFn();
        return () => dropFn();
      });

      return null;
    });

    $render();
    jest.runAllTimers();
    expect(effectFn).toBeCalledTimes(1);
    expect(dropFn).toBeCalledTimes(0);

    $render();
    jest.runAllTimers();
    expect(effectFn).toBeCalledTimes(2);
    expect(dropFn).toBeCalledTimes(1);

    $render();
    jest.runAllTimers();
    expect(effectFn).toBeCalledTimes(3);
    expect(dropFn).toBeCalledTimes(2);
  });

  test('drops effect on unmount event', () => {
    const effectFn = jest.fn();
    const dropFn = jest.fn();

    const App = component(() => {
      useEffect(() => {
        effectFn();
        return () => dropFn();
      }, []);

      return null;
    });

    render(App(), host);
    jest.runAllTimers();
    expect(effectFn).toBeCalledTimes(1);
    expect(dropFn).toBeCalledTimes(0);

    render(null, host);
    jest.runAllTimers();
    expect(effectFn).toBeCalledTimes(1);
    expect(dropFn).toBeCalledTimes(1);

    render(App(), host);
    jest.runAllTimers();
    expect(effectFn).toBeCalledTimes(2);
    expect(dropFn).toBeCalledTimes(1);
  });

  test('can trigger many effects', () => {
    const effectFn1 = jest.fn();
    const dropFn1 = jest.fn();
    const effectFn2 = jest.fn();
    const dropFn2 = jest.fn();

    const $render = (props = {}) => {
      render(App(props), host);
    };

    const App = component(() => {
      useEffect(() => {
        effectFn1();
        return () => dropFn1();
      });
      useEffect(() => {
        effectFn2();
        return () => dropFn2();
      });

      return null;
    });

    $render();
    jest.runAllTimers();
    expect(effectFn1).toBeCalledTimes(1);
    expect(effectFn2).toBeCalledTimes(1);
    expect(dropFn1).toBeCalledTimes(0);
    expect(dropFn2).toBeCalledTimes(0);

    $render();
    jest.runAllTimers();
    expect(effectFn1).toBeCalledTimes(2);
    expect(effectFn2).toBeCalledTimes(2);
    expect(dropFn1).toBeCalledTimes(1);
    expect(dropFn2).toBeCalledTimes(1);

    $render();
    jest.runAllTimers();
    expect(effectFn1).toBeCalledTimes(3);
    expect(effectFn2).toBeCalledTimes(3);
    expect(dropFn1).toBeCalledTimes(2);
    expect(dropFn2).toBeCalledTimes(2);
  });

  test('can work with nested components correctly', () => {
    const effectFn1 = jest.fn();
    const dropFn1 = jest.fn();
    const effectFn2 = jest.fn();
    const dropFn2 = jest.fn();

    const $render = (props = {}) => {
      render(App(props), host);
    };

    const Child = component(() => {
      useEffect(() => {
        effectFn2();
        return () => dropFn2();
      });

      return null;
    });

    const App = component(() => {
      useEffect(() => {
        effectFn1();
        return () => dropFn1();
      });

      return <Child />;
    });

    $render();
    jest.runAllTimers();
    expect(effectFn1).toBeCalledTimes(1);
    expect(effectFn2).toBeCalledTimes(1);
    expect(dropFn1).toBeCalledTimes(0);
    expect(dropFn2).toBeCalledTimes(0);
    expect(effectFn1.mock.invocationCallOrder[0]).toBeLessThan(effectFn2.mock.invocationCallOrder[0]);

    $render();
    jest.runAllTimers();
    expect(effectFn1).toBeCalledTimes(2);
    expect(effectFn2).toBeCalledTimes(2);
    expect(dropFn1).toBeCalledTimes(1);
    expect(dropFn2).toBeCalledTimes(1);
    expect(effectFn1.mock.invocationCallOrder[1]).toBeLessThan(effectFn2.mock.invocationCallOrder[1]);
    expect(dropFn1.mock.invocationCallOrder[0]).toBeLessThan(dropFn2.mock.invocationCallOrder[0]);

    $render();
    jest.runAllTimers();
    expect(effectFn1).toBeCalledTimes(3);
    expect(effectFn2).toBeCalledTimes(3);
    expect(dropFn1).toBeCalledTimes(2);
    expect(dropFn2).toBeCalledTimes(2);
    expect(effectFn1.mock.invocationCallOrder[2]).toBeLessThan(effectFn2.mock.invocationCallOrder[2]);
    expect(dropFn1.mock.invocationCallOrder[1]).toBeLessThan(dropFn2.mock.invocationCallOrder[1]);
  });

  test('can call render #1', () => {
    const mockFn = jest.fn();

    const $render = (props = {}) => {
      render(App(props), host);
    };

    const App = component(() => {
      useEffect(() => {
        $render();
      }, []);

      mockFn();

      return null;
    });

    $render();
    jest.runAllTimers();
    expect(mockFn).toBeCalledTimes(2);
  });

  test('can call render #2', () => {
    const mockFn = jest.fn();

    const $render = (props = {}) => {
      render(App(props), host);
    };

    const App = component(() => {
      const update = useUpdate();

      useEffect(() => {
        update();
      }, []);

      mockFn();

      return null;
    });

    $render();
    jest.runAllTimers();
    expect(mockFn).toBeCalledTimes(2);
  });
});
