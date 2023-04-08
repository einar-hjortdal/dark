import { Readable } from 'node:stream';
import {
  type DarkElement,
  ROOT,
  Fiber,
  EffectTag,
  platform,
  flatten,
  TagVirtualNode,
  rootStore,
  wipRootStore,
  currentRootStore,
  nextUnitOfWorkStore,
  mountStore,
  createReplacer,
  unmountRoot,
  isStreamZone,
  emitter,
} from '@dark-engine/core';

import { createNativeElement, applyCommit, finishCommitWork, chunk } from '../dom';
import { scheduleCallback, shouldYeildToHost } from '../scheduler';
import { TagNativeElement } from '../native-element';

let isInjected = false;
let nextRootId = -1;

function inject() {
  platform.createElement = createNativeElement as typeof platform.createElement;
  platform.raf = setTimeout.bind(this);
  platform.caf = setTimeout.bind(this);
  platform.schedule = scheduleCallback;
  platform.shouldYeild = shouldYeildToHost;
  platform.commit = applyCommit;
  platform.finishCommit = finishCommitWork;
  platform.detectIsDynamic = () => false;
  platform.detectIsPortal = () => false;
  platform.unmountPortal = () => {};
  platform.restart = () => {};
  platform.chunk = chunk;
  isInjected = true;
}

function createRenderCallback(element: DarkElement, stream = false) {
  !isInjected && inject();

  const rootId = getNextRootId();
  const callback = () => {
    rootStore.set(rootId);
    isStreamZone.set(stream);
    const fiber = new Fiber().mutate({
      element: new TagNativeElement(ROOT),
      inst: new TagVirtualNode(ROOT, {}, flatten([element || createReplacer()]) as TagVirtualNode['children']),
      tag: EffectTag.C,
    });

    mountStore.reset();
    wipRootStore.set(fiber);
    nextUnitOfWorkStore.set(fiber);
  };

  return { rootId, callback };
}

function renderToString(element: DarkElement): string {
  const { rootId, callback } = createRenderCallback(element);
  platform.schedule(callback, { forceSync: true });
  const { element: nativeElement } = currentRootStore.get() as Fiber<TagNativeElement>;
  const content = nativeElement.renderToString(true);

  unmountRoot(rootId, () => {});

  return content;
}

function renderToStringAsync(element: DarkElement): Promise<string> {
  return new Promise<string>(resolve => {
    const { rootId, callback } = createRenderCallback(element);
    const onCompleted = () => {
      const { element: nativeElement } = currentRootStore.get() as Fiber<TagNativeElement>;
      const content = nativeElement.renderToString(true);

      resolve(content);
      unmountRoot(rootId, () => {});
    };

    platform.schedule(callback, { forceSync: false, onCompleted });
  });
}

type RenderToStreamOptions = {
  bootstrapScripts?: Array<string>;
  chunkSize?: number;
};

function renderToStream(element: DarkElement, options?: RenderToStreamOptions): Readable {
  const { bootstrapScripts = [], chunkSize = 500 } = options || {};
  const stream = new Readable({ encoding: 'utf-8', read() {} });
  const { rootId, callback } = createRenderCallback(element, true);
  let content = '';
  const onCompleted = () => {
    if (content) {
      stream.push(content);
      content = '';
    }
    stream.push(null);
    unmountRoot(rootId, () => {});
    off();
  };
  const off = emitter.on<string>('chunk', chunk => {
    if (chunk === PREPEND_SCRIPTS_CHUNK) {
      content += addScripts(bootstrapScripts);
    }

    content += chunk;

    if (content.length >= chunkSize) {
      stream.push(content);
      content = '';
    }
  });

  Promise.resolve().then(() => platform.schedule(callback, { forceSync: false, onCompleted }));
  stream.push(DOCTYPE);

  return stream;
}

function addScripts(scripts: Array<string>) {
  if (scripts.length === 0) return '';
  let content = '';

  scripts.forEach(script => {
    content += `<script src="${script}" defer></script>`;
  });

  return content;
}

const PREPEND_SCRIPTS_CHUNK = '</body>';
const DOCTYPE = '<!DOCTYPE html>';

const getNextRootId = () => ++nextRootId;

export { renderToString, renderToStringAsync, renderToStream };
