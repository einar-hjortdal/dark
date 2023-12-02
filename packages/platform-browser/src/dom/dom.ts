import {
  type Fiber,
  type VirtualNode,
  type TagVirtualNode,
  type TextVirtualNode,
  type CommentVirtualNode,
  type PlainVirtualNode,
  type Callback,
  ATTR_REF,
  ATTR_BLACK_LIST,
  EFFECT_TAG_CREATE,
  EFFECT_TAG_UPDATE,
  EFFECT_TAG_DELETE,
  EFFECT_TAG_SKIP,
  MASK_MOVE,
  MASK_FLUSH,
  MASK_SHADOW,
  detectIsUndefined,
  detectIsBoolean,
  detectIsObject,
  keyBy,
  NodeType,
  detectIsTagVirtualNode,
  detectIsTextVirtualNode,
  detectIsPlainVirtualNode,
  getFiberWithElement,
  collectElements,
  walk,
  dummyFn,
  $$scope,
  applyRef,
} from '@dark-engine/core';

import { detectIsPortal } from '../portal';
import { delegateEvent, detectIsEvent, getEventName } from '../events';
import { SVG_TAG_NAMES, VOID_TAG_NAMES, ATTR_STYLE, ATTR_CLASS, ATTR_CLASS_NAME } from '../constants';
import type {
  NativeElement,
  TagNativeElement,
  TextNativeElement,
  CommentNativeElement,
  NativeNode,
  AttributeValue,
} from '../native-element';

let moves: Array<Callback> = [];
let patches: Array<Callback> = [];
let trackUpdate: (nativeElement: NativeElement) => void = null;
const svgTagNamesMap = keyBy(SVG_TAG_NAMES.split(','), x => x);
const voidTagNamesMap = keyBy(VOID_TAG_NAMES.split(','), x => x);

const createNativeElementMap = {
  [NodeType.TAG]: (vNode: VirtualNode): TagNativeElement => {
    const tagNode = vNode as TagVirtualNode;
    const name = tagNode.name;

    return detectIsSvgElement(name)
      ? document.createElementNS('http://www.w3.org/2000/svg', name)
      : document.createElement(name);
  },
  [NodeType.TEXT]: (vNode: VirtualNode): TextNativeElement => {
    return document.createTextNode((vNode as TextVirtualNode).value);
  },
  [NodeType.COMMENT]: (vNode: VirtualNode): CommentNativeElement => {
    return document.createComment((vNode as CommentVirtualNode).value);
  },
};

function createNativeElement(node: VirtualNode): NativeElement {
  return createNativeElementMap[node.type](node);
}

function detectIsSvgElement(tagName: string) {
  return Boolean(svgTagNamesMap[tagName]);
}

function detectIsVoidElement(tagName: string) {
  return Boolean(voidTagNamesMap[tagName]);
}

function setObjectStyle(element: TagNativeElement, style: object) {
  const keys = Object.keys(style);

  for (const key of keys) {
    element.style.setProperty(key, String(style[key]));
  }
}

function addAttributes(element: NativeElement, node: TagVirtualNode) {
  const attrNames = Object.keys(node.attrs);
  const tagElement = element as TagNativeElement;

  for (const attrName of attrNames) {
    const attrValue = node.attrs[attrName];

    if (attrName === ATTR_REF) {
      applyRef(attrValue, element);
      continue;
    }

    if (attrName === ATTR_CLASS || attrName === ATTR_CLASS_NAME) {
      toggleAttribute(tagElement, ATTR_CLASS, attrValue);
      continue;
    }

    if (attrName === ATTR_STYLE && attrValue && detectIsObject(attrValue)) {
      setObjectStyle(tagElement, attrValue);
      continue;
    }

    if (detectIsEvent(attrName)) {
      delegateEvent(tagElement, getEventName(attrName), attrValue);
    } else if (!detectIsUndefined(attrValue) && !ATTR_BLACK_LIST[attrName]) {
      const stop = patchProperties({
        tagName: node.name,
        element: tagElement,
        attrValue,
        attrName,
      });

      !stop && tagElement.setAttribute(attrName, attrValue);
    }
  }
}

function updateAttributes(element: NativeElement, prevNode: TagVirtualNode, nextNode: TagVirtualNode) {
  const attrNames = getAttributeNames(prevNode, nextNode);
  const tagElement = element as TagNativeElement;

  for (const attrName of attrNames) {
    const prevAttrValue = prevNode.attrs[attrName];
    const nextAttrValue = nextNode.attrs[attrName];

    if (attrName === ATTR_REF) {
      applyRef(prevAttrValue, element);
      continue;
    }

    if ((attrName === ATTR_CLASS || attrName === ATTR_CLASS_NAME) && prevAttrValue !== nextAttrValue) {
      toggleAttribute(tagElement, ATTR_CLASS, nextAttrValue);
      continue;
    }

    if (attrName === ATTR_STYLE && nextAttrValue && prevAttrValue !== nextAttrValue && detectIsObject(nextAttrValue)) {
      setObjectStyle(tagElement, nextAttrValue);
      continue;
    }

    if (!detectIsUndefined(nextAttrValue)) {
      if (detectIsEvent(attrName)) {
        prevAttrValue !== nextAttrValue && delegateEvent(tagElement, getEventName(attrName), nextAttrValue);
      } else if (!ATTR_BLACK_LIST[attrName] && prevAttrValue !== nextAttrValue) {
        const stop = patchProperties({
          tagName: nextNode.name,
          element: tagElement,
          attrValue: nextAttrValue,
          attrName,
        });

        !stop && tagElement.setAttribute(attrName, nextAttrValue);
      }
    } else {
      tagElement.removeAttribute(attrName);
    }
  }
}

function toggleAttribute(element: TagNativeElement, name: string, value: string) {
  value ? element.setAttribute(name, value) : element.removeAttribute(name);
}

function getAttributeNames(prevNode: TagVirtualNode, nextNode: TagVirtualNode) {
  const attrNames = new Set<string>();
  const prevAttrs = Object.keys(prevNode.attrs);
  const nextAttrs = Object.keys(nextNode.attrs);
  const size = Math.max(prevAttrs.length, nextAttrs.length);

  for (let i = 0; i < size; i++) {
    attrNames.add(prevAttrs[i] || nextAttrs[i]);
  }

  return attrNames;
}

type PatchPropertiesOptions = {
  tagName: string;
  element: TagNativeElement;
  attrName: string;
  attrValue: AttributeValue;
};

function patchProperties(options: PatchPropertiesOptions): boolean {
  const { tagName, element, attrName, attrValue } = options;
  const fn = patchPropertiesSpecialCasesMap[tagName];
  let stop = fn ? fn(element, attrName, attrValue) : false;

  if (canSetProperty(element, attrName)) {
    element[attrName] = attrValue;
  }

  if (!stop && detectIsBoolean(attrValue)) {
    stop = !attrName.includes('-');
  }

  return stop;
}

function canSetProperty(element: TagNativeElement, key: string) {
  const prototype = Object.getPrototypeOf(element);
  const descriptor = Object.getOwnPropertyDescriptor(prototype, key);

  return Boolean(descriptor?.set);
}

const patchPropertiesSpecialCasesMap: Record<
  string,
  (element: NativeElement, attrName: string, attrValue: AttributeValue) => boolean
> = {
  input: (element: HTMLInputElement, attrName: string, attrValue: AttributeValue) => {
    if (attrName === 'value') {
      patches.push(() => {
        detectIsBoolean(attrValue) ? (element.checked = attrValue) : (element.value = String(attrValue));
      });
    } else if (attrName === 'autoFocus') {
      patches.push(() => {
        element.autofocus = Boolean(attrValue);
        element.autofocus && element.focus();
      });
    }

    return false;
  },
  textarea: (element: HTMLTextAreaElement, attrName: string, attrValue: AttributeValue) => {
    if (attrName === 'value') {
      element.innerText = String(attrValue);

      return true;
    }

    return false;
  },
};

function commitCreation(fiber: Fiber<NativeElement>) {
  const parentFiber = getFiberWithElement<NativeElement, TagNativeElement>(fiber.parent);
  const parentElement = parentFiber.element;
  const childNodes = parentElement.childNodes;

  if ($$scope().getIsHydrateZone()) {
    const nativeElement = childNodes[fiber.eidx] as NativeElement;

    if (
      detectIsTextVirtualNode(fiber.inst) &&
      nativeElement instanceof Text &&
      fiber.inst.value.length !== nativeElement.length
    ) {
      nativeElement.splitText(fiber.inst.value.length);
    }

    fiber.element = nativeElement;
  } else {
    if (!(fiber.mask & MASK_SHADOW)) {
      if (childNodes.length === 0 || fiber.eidx > childNodes.length - 1) {
        !detectIsVoidElement((parentFiber.inst as TagVirtualNode).name) &&
          appendNativeElement(fiber.element, parentElement);
      } else {
        insertNativeElement(fiber.element, parentElement.childNodes[fiber.eidx], parentElement);
      }
    }
  }

  detectIsTagVirtualNode(fiber.inst) && addAttributes(fiber.element, fiber.inst);
}

function commitUpdate(fiber: Fiber<NativeElement>) {
  const element = fiber.element;
  const prevInstance = fiber.alt.inst as VirtualNode;
  const nextInstance = fiber.inst as VirtualNode;

  detectIsPlainVirtualNode(nextInstance)
    ? (prevInstance as PlainVirtualNode).value !== nextInstance.value && (element.textContent = nextInstance.value)
    : updateAttributes(element, prevInstance as TagVirtualNode, nextInstance as TagVirtualNode);
}

function commitDeletion(fiber: Fiber<NativeElement>) {
  const parentFiber = getFiberWithElement<NativeElement, TagNativeElement>(fiber.parent);

  if (fiber.mask & MASK_FLUSH) {
    parentFiber.element.innerHTML && (parentFiber.element.innerHTML = '');
    return;
  }

  walk<NativeElement>(fiber, (fiber, skip) => {
    if (fiber.element) {
      !(fiber.mask & MASK_SHADOW) &&
        !detectIsPortal(fiber.inst) &&
        removeNativeElement(fiber.element, parentFiber.element);
      return skip();
    }
  });
}

function move(fiber: Fiber<NativeElement>) {
  const sourceNodes = collectElements(fiber, x => x.element);
  const sourceNode = sourceNodes[0];
  const parentElement = sourceNode.parentElement;
  const sourceFragment = new DocumentFragment();
  const elementIdx = fiber.eidx;
  let idx = 0;
  const move = () => {
    for (let i = 1; i < sourceNodes.length; i++) {
      removeNativeElement(parentElement.childNodes[elementIdx + 1], parentElement);
    }

    replaceNativeElement(sourceFragment, parentElement.childNodes[elementIdx], parentElement);
  };

  for (const node of sourceNodes) {
    insertNativeElement(document.createComment(`${elementIdx}:${idx}`), node, parentElement);
    appendNativeElement(node, sourceFragment);
    idx++;
  }

  moves.push(move);
}

const commitMap: Record<string, (fiber: Fiber<NativeElement>) => void> = {
  [EFFECT_TAG_CREATE]: (fiber: Fiber<NativeElement>) => {
    if (!fiber.element || detectIsPortal(fiber.inst)) return;
    trackUpdate && trackUpdate(fiber.element);
    commitCreation(fiber);
  },
  [EFFECT_TAG_UPDATE]: (fiber: Fiber<NativeElement>) => {
    fiber.mask & MASK_MOVE && (move(fiber), (fiber.mask &= ~MASK_MOVE));
    if (!fiber.element || detectIsPortal(fiber.inst)) return;
    trackUpdate && trackUpdate(fiber.element);
    commitUpdate(fiber);
  },
  [EFFECT_TAG_DELETE]: commitDeletion,
  [EFFECT_TAG_SKIP]: dummyFn,
};

function commit(fiber: Fiber<NativeElement>) {
  commitMap[fiber.tag](fiber);
}

function finishCommit() {
  moves.forEach(x => x());
  patches.forEach(x => x());
  moves = [];
  patches = [];
}

function setTrackUpdate(fn: typeof trackUpdate) {
  trackUpdate = fn;
}

const appendNativeElement = (element: NativeNode, parent: NativeNode) => parent.appendChild(element);

const insertNativeElement = (element: NativeNode, sibling: NativeNode, parent: TagNativeElement) => {
  parent.insertBefore(element, sibling);
};

const insertNativeElementByIndex = (element: NativeNode, idx: number, parent: TagNativeElement) => {
  parent.insertBefore(element, parent.childNodes[idx]);
};

const replaceNativeElement = (element: NativeNode, candidate: NativeNode, parent: TagNativeElement) => {
  parent.replaceChild(element, candidate);
};

const removeNativeElement = (element: NativeNode, parent: TagNativeElement) => parent.removeChild(element);

export { createNativeElement, commit, finishCommit, setTrackUpdate, insertNativeElementByIndex };
