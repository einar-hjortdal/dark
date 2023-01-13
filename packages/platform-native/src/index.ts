/// <reference path="jsx.ts" />
export { type SyntheticEvent } from './events';
export { run, render } from './render';
export { registerElement } from './registry';
export * from './components';
export * from './native-element';
export * from './factory';

export const version = process.env.VERSION;
