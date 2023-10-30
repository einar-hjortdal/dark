import { detectIsFunction, scope$$, detectIsArray } from '@dark-engine/core';

import type { TagNativeElement } from '../native-element';

type BrowserEventConstructor = (type: string, event: Event) => void;

class SyntheticEvent<E extends Event, T = TagNativeElement> {
  public type = '';
  public sourceEvent: E = null;
  public target: T = null;
  private propagation = true;

  constructor(options: Pick<SyntheticEvent<E, T>, 'sourceEvent' | 'target'>) {
    this.type = options.sourceEvent.type;
    this.sourceEvent = options.sourceEvent;
    this.target = options.target;
  }

  public stopPropagation() {
    this.propagation = false;
    this.sourceEvent.stopPropagation();
  }

  public preventDefault() {
    this.sourceEvent.preventDefault();
  }

  public getPropagation() {
    return this.propagation;
  }
}

function delegateEvent(
  target: Element,
  eventName: string,
  handler: (e: Event) => void | [fn: () => void, ...args: Array<any>],
) {
  const scope$ = scope$$();
  const eventsMap = scope$.getEvents();
  const handlersMap = eventsMap.get(eventName);
  const handler$ = detectIsArray(handler) ? (e: Event) => handler[0](...handler.slice(1), e) : handler;

  if (!handlersMap) {
    const rootHandler = (event: Event) => {
      const handler = eventsMap.get(eventName).get(event.target);
      const target = event.target as TagNativeElement;
      let event$: SyntheticEvent<Event> = null;

      if (detectIsFunction(handler)) {
        event$ = new SyntheticEvent({ sourceEvent: event, target });

        scope$.setIsEventZone(true);
        handler(event$);
        scope$.setIsEventZone(false);
      }

      if (target.parentElement) {
        const shouldPropagate = event$ ? event$.getPropagation() : true;

        if (shouldPropagate) {
          const constructor = event.constructor as BrowserEventConstructor;

          target.parentElement.dispatchEvent(new constructor(event.type, event));
        }
      }
    };

    eventsMap.set(eventName, new WeakMap([[target, handler$]]));
    document.addEventListener(eventName, rootHandler, true);
    scope$.addEventUnsubscriber(() => document.removeEventListener(eventName, rootHandler, true));
  } else {
    handlersMap.set(target, handler$);
  }
}

const detectIsEvent = (attrName: string) => attrName.startsWith('on');

const getEventName = (attrName: string) => attrName.slice(2, attrName.length).toLowerCase();

export { SyntheticEvent, delegateEvent, detectIsEvent, getEventName };
