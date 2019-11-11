import { VirtualDOM, createVirtualNode, VirtualNode } from '@core/vdom';
import { createComponent } from '@core/component';
import { mountRealDOM, processDOM } from '../dom/dom';
import { isArray, getTime } from '@helpers';
import { getAppUid, getRegistery } from '@core/scope';
import { MountedSource, $$replaceNodeAfterMountHook, $$nodeRouteHook } from '@core/vdom/mount';

const $$portal = Symbol('portal');
const Portal = createComponent(({ slot }) => slot || null, { displayName: 'Portal', elementToken: $$portal });
const isPortal = (o) => o && o.elementToken === $$portal;

function createPortal(source: MountedSource, container: HTMLElement) {
  const nodeRouteHook = () => [0, 0];
  const replaceNodeAfterMountHook = (mountedVNode: VirtualDOM, componentId: string) => {
    const time = getTime();
    const uid = getAppUid();
    const app = getRegistery().get(uid);
    const vDOM = isArray(mountedVNode) ? mountedVNode : [mountedVNode];
    const componentRoute = vDOM[0].componentRoute;
    let portalStoreItem = null;
    let vNode: VirtualNode = null;
    let nextVNode: VirtualNode = null;

    if (!app.portalStore[componentId]) {
      app.portalStore[componentId] = {
        vNode: null,
        time,
        unmountContainer: () => container && container instanceof HTMLElement && (container.innerHTML = ''),
      };
    }

    portalStoreItem = app.portalStore[componentId];
    vNode = portalStoreItem.vNode;
    nextVNode = createVirtualNode('TAG', {
      name: 'root',
      componentRoute,
      nodeRoute: [0],
      children: isArray(vDOM) ? vDOM : [vDOM],
    });

    if (!vNode) {
      container.innerHTML = '';
      const nodes = Array.from(mountRealDOM(nextVNode, container).childNodes);

      for (const node of nodes) {
        container.appendChild(node);
      }
      portalStoreItem.vNode = nextVNode;
    } else {
      processDOM({ vNode, nextVNode, container });
      portalStoreItem.time = time;
      portalStoreItem.vNode = nextVNode;
    }

    return null;
  };

  return Portal({
    slot: source,
    [$$nodeRouteHook]: nodeRouteHook,
    [$$replaceNodeAfterMountHook]: replaceNodeAfterMountHook,
  });
}

function clearUnmountedPortalContainers(uid: number, time: number, componentId: string = '') {
  const registry = getRegistery();
  const app = registry.get(uid);
  const portalsKeys = Object.keys(app.portalStore);

  for(const key of portalsKeys) {
    const isMatch = Boolean(componentId)
      ? key.indexOf(componentId) === 0
      : true;

    if (time > app.portalStore[key].time && isMatch) {
      app.portalStore[key].unmountContainer();
      delete app.portalStore[key];
    }
  }
}

export {
  isPortal,
  createPortal,
  clearUnmountedPortalContainers,
};
export default createPortal;
