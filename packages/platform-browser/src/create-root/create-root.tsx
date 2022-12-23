import { type DarkElement, unmountRoot } from '@dark-engine/core';
import { render, roots } from '../render';

function createRoot(container: Element) {
  return {
    render: (element: DarkElement) => render(element, container),
    unmount: () => unmount(container),
  };
}

function unmount(container: Element) {
  const rootId = roots.get(container);

  unmountRoot(rootId, () => {
    roots.delete(container);
    container.innerHTML = '';
  });
}

export { createRoot, unmount };
