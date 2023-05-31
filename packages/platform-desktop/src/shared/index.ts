import { CursorShape } from '@nodegui/nodegui';
import type { DarkElement, KeyProps, SlotProps, RefProps, FlagProps } from '@dark-engine/core';

import { type EventHandler } from '../events';

export type WithStandardProps<T> = T & KeyProps & RefProps & FlagProps;

export type WithExtendedProps<T, S = DarkElement> = T & WithStandardProps<T> & SlotProps<S>;

export type Size = {
  width: number;
  height: number;
  fixed?: boolean;
};

export type Position = {
  x: number;
  y: number;
};

export type WidgetProps = {
  id?: string;
  width?: number;
  height?: number;
  size?: Size;
  minSize?: Size;
  maxSize?: Size;
  pos?: Position;
  styleSheet?: string;
  style?: string;
  disabled?: boolean;
  hidden?: boolean;
  cursor?: CursorShape;
  on?: Record<string, EventHandler>;
};
