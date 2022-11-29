/** @jsx h */
import { h, createComponent, useInsertionEffect, useLayoutEffect, useEffect } from '@dark-engine/core';
import { createRoot } from './create-root';

let host: HTMLElement = null;

jest.useFakeTimers();

beforeEach(() => {
  host = document.createElement('div');
});

describe('[create-root]', () => {
  test('has render and unmount methods', () => {
    const App = createComponent(() => {
      return null;
    });
    const root = createRoot(host);

    root.render(App());
    expect(root.render).toBeInstanceOf(Function);
    expect(root.unmount).toBeInstanceOf(Function);
  });

  test('unmount clears all effects and unmounts root node correctly', () => {
    const dropFn = jest.fn();

    const Child = createComponent(() => {
      useInsertionEffect(() => {
        return () => dropFn();
      }, []);

      useLayoutEffect(() => {
        return () => dropFn();
      }, []);

      useEffect(() => {
        return () => dropFn();
      }, []);

      return <div>child</div>;
    });

    const App = createComponent(() => {
      useInsertionEffect(() => {
        return () => dropFn();
      }, []);

      useLayoutEffect(() => {
        return () => dropFn();
      }, []);

      useEffect(() => {
        return () => dropFn();
      }, []);

      return (
        <div>
          <Child />
          <Child />
          <Child />
        </div>
      );
    });

    const root = createRoot(host);

    root.render(App());
    jest.runAllTimers();
    root.unmount();
    expect(dropFn).toBeCalledTimes(12);
    expect(host.innerHTML).toBe('');
    expect(root.unmount).not.toThrowError();
  });
});
