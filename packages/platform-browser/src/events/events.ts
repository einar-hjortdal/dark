import { detectIsFunction, eventsStore } from '@dark-engine/core';
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

type DelegateEventOptions = {
  target: Element;
  eventName: string;
  handler: (e: Event) => void;
};

function delegateEvent(options: DelegateEventOptions) {
  const { target, eventName, handler } = options;
  const eventsMap = eventsStore.get();
  const handlerMap = eventsMap.get(eventName);

  if (!handlerMap) {
    const rootHandler = (event: Event) => {
      const fireEvent = eventsMap.get(eventName).get(event.target);
      const target = event.target as TagNativeElement;
      let syntheticEvent: SyntheticEvent<Event> = null;

      if (detectIsFunction(fireEvent)) {
        syntheticEvent = new SyntheticEvent({
          sourceEvent: event,
          target,
        });
        fireEvent(syntheticEvent);
      }

      if (syntheticEvent ? syntheticEvent.getPropagation() : target.parentElement) {
        target.parentElement.dispatchEvent(new (event.constructor as BrowserEventConstructor)(event.type, event));
      }
    };

    eventsMap.set(eventName, new WeakMap([[target, handler]]));
    document.addEventListener(eventName, rootHandler, true);
    eventsStore.addUnsubscriber(() => document.removeEventListener(eventName, rootHandler, true));
  } else {
    handlerMap.set(target, handler);
  }
}

const detectIsEvent = (attrName: string) => attrName.startsWith('on');

const getEventName = (attrName: string) => attrName.slice(2, attrName.length).toLowerCase();

export { SyntheticEvent, delegateEvent, detectIsEvent, getEventName };
