import { DarkElementKey } from '@core/shared/model';
import {
  CreateElement,
  Component,
  ComponentOptions,
  StandardComponentProps,
  SlotProps,
} from './model';
import { ATTR_KEY } from '@core/constants';
import { VirtualNode } from '@core/view';
import { MutableRef } from '../ref';
import { error } from '@helpers';


const $$component = Symbol('component');
const defaultOptions: ComponentOptions<any> = {
  displayName: '',
  defaultProps: {},
  token: $$component,
};
class ComponentFactory<P extends StandardComponentProps = any, R = any> {
  public type: CreateElement<P>;
  public token: Symbol;
  public props: P;
  public ref: MutableRef<R>;
  public displayName: string;
  public children: Array<VirtualNode | ComponentFactory> = [];
  public shouldUpdate?: (props: P, nextProps: P) => boolean;
  public dynamic?: () => Promise<{default: Component<P>}>;

  constructor(options: ComponentFactory<P>) {
    this.type = options.type || null;
    this.token = options.token || null;
    this.props = options.props || null;
    this.ref = options.ref || null;
    this.displayName = options.displayName || '';
    this.shouldUpdate = options.shouldUpdate || null;
    this.dynamic = options.dynamic || null;
  }
}

function createComponent<P, R = any>(createElement: CreateElement<P & SlotProps, R>, options: ComponentOptions<P> = {}) {
  type Props = P & StandardComponentProps;
  const computedOptions = {...defaultOptions, ...options };
  const {
    token,
    defaultProps,
    displayName,
    shouldUpdate,
    dynamic,
  } = computedOptions;

  return (props = {} as Props, ref?: MutableRef<R>): ComponentFactory<Props> => {
    const computedProps = { ...defaultProps, ...props };
    const factory = new ComponentFactory({
      token,
      ref,
      displayName,
      shouldUpdate,
      dynamic,
      props: computedProps,
      type: createElement,
      children: [],
    });

    if (computedProps.ref) {
      delete computedProps.ref;

      if (process.env.NODE_ENV === 'development') {
        error(`[Dark]: To use ref you need to wrap the createComponent with forwardRef!`);
      }
    }

    return factory;
  };
}

const detectIsComponentFactory = (factory: unknown): factory is ComponentFactory => factory instanceof ComponentFactory;

const getComponentFactoryKey = (factory: ComponentFactory): DarkElementKey => factory.props[ATTR_KEY] || null;

export {
  ComponentFactory,
  createComponent,
  detectIsComponentFactory,
  getComponentFactoryKey,
};
