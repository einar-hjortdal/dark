import { requestIdleCallback } from '@shopify/jest-dom-mocks';

import { EMPTY_NODE } from '@dark-engine/core/constants';

const dom = (strings: TemplateStringsArray, ...args: Array<string | number | boolean>) => {
  const markup = strings
    .map((x, idx) => x + (typeof args[idx] !== 'undefined' ? args[idx] : ''))
    .join('')
    .replace(/\s*(?=\<).*?\s*/gm, '')
    .trim();

  return markup;
};

const waitNextIdle = () => requestIdleCallback.runIdleCallbacks();

const createEmptyCommentString = () => `<!--${EMPTY_NODE}-->`;

const createTestHostNode = () => document.createElement('div');

const fireEvent = (element: Element, eventName: string) => {
  const event = new Event(eventName, {
    bubbles: true,
    cancelable: true,
  });

  element.dispatchEvent(event);
};

const click = (element: Element) => fireEvent(element, 'click');

export { dom, waitNextIdle, createEmptyCommentString, createTestHostNode, fireEvent, click };
