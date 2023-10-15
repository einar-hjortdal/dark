import { type Fiber } from '../fiber';
import { platform } from '../platform';
import { detectIsComponent } from '../component';
import { dropEffects } from '../use-effect';
import { dropLayoutEffects } from '../use-layout-effect';
import { dropInsertionEffects } from '../use-insertion-effect';
import { walkFiber } from '../walk';
import { detectIsUndefined } from '../helpers';
import { removeScope, scope$$ } from '../scope';

function unmountFiber(fiber: Fiber) {
  if (!fiber.iefHost && !fiber.lefHost && !fiber.aefHost && !fiber.atomHost && !fiber.portalHost) return;

  walkFiber(fiber, (nextFiber, isReturn, resetIsDeepWalking, stop) => {
    if (nextFiber === fiber.next) return stop();
    if (!nextFiber.iefHost && !nextFiber.lefHost && !nextFiber.aefHost && !nextFiber.atomHost && !nextFiber.portalHost)
      return resetIsDeepWalking();

    if (!isReturn && detectIsComponent(nextFiber.inst)) {
      const hasValues = nextFiber.hook.values.length > 0;
      // !
      nextFiber.iefHost && hasValues && dropInsertionEffects(nextFiber.hook);
      nextFiber.lefHost && hasValues && dropLayoutEffects(nextFiber.hook);
      nextFiber.aefHost && hasValues && dropEffects(nextFiber.hook);
      nextFiber.cleanup && nextFiber.cleanup();
      nextFiber.portalHost && platform.unmountPortal(nextFiber);
    }
  });
}

function unmountRoot(rootId: number, onCompleted: () => void) {
  if (detectIsUndefined(rootId)) return;
  const scope$ = scope$$(rootId);

  unmountFiber(scope$.getRoot());
  scope$.unsubscribeEvents();
  removeScope(rootId);
  onCompleted();
}

export { unmountFiber, unmountRoot };
