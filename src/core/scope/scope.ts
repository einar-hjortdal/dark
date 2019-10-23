import { VirtualNode } from '../vdom';

type ScopeType = {
  registery: Map<number, AppType>;
  uid: number;
};

type AppType = {
  nativeElement: HTMLElement;
  vdom: VirtualNode;
  eventStore: Map<
    string,
    WeakMap<any, Function>
  >;
  portals: Record<string, {
    vNode: VirtualNode,
    unmountContainer: Function;
    time: number;
  }>
};

const scope = createScope();
const getRegistery = () => scope.registery;
const setRegistery = (registery: Map<number, any>) => (scope.registery = registery);
const getAppUid = (): number => scope.uid;
const setAppUid = (uid: number) => (scope.uid = uid);
const getVirtualDOM = (uid: number): VirtualNode => ({ ...getRegistery().get(uid).vdom });

function createScope(): ScopeType {
  return {
    registery: new Map(),
    uid: 0,
  };
}

function createApp(nativeElement: HTMLElement): AppType {
  return {
    nativeElement,
    vdom: null,
    eventStore: new Map(),
    portals: {},
  };
}

export {
  ScopeType,
  AppType,
  getRegistery,
  setRegistery,
  getAppUid,
  setAppUid,
  getVirtualDOM,
  createScope,
  createApp,
};
