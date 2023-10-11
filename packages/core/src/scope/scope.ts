import type { Fiber } from '../fiber';
import type { Callback } from '../shared';
import { platform } from '../platform';

class Scope {
  private root: Fiber = null;
  private wip: Fiber = null;
  private unit: Fiber = null;
  private cursor: Fiber = null;
  private mountLevel = 0;
  private mountNav: Record<number, number> = {};
  private mountDeep = true;
  private events: Map<string, WeakMap<object, Function>> = new Map();
  private unsubs: Set<Callback> = new Set();
  private candidates: Set<Fiber> = new Set();
  private deletions: Set<Fiber> = new Set();
  private cancels: Array<Callback> = [];
  private batches: Set<Callback> = new Set();
  private batchUpdate: Callback = null;
  private asyncEffects: Set<Callback> = new Set();
  private layoutEffects: Set<Callback> = new Set();
  private insertionEffects: Set<Callback> = new Set();
  private isLayoutEffectsZone = false;
  private isInsertionEffectsZone = false;
  private isUpdateZone = false;
  private isBatchZone = false;
  private isHydrateZone = false;
  private isStreamZone = false;
  private isTransitionZone = false;
  private isHot = false;
  private isDynamic = platform.detectIsDynamic();

  public copy() {
    const scope = new Scope();

    scope.root = this.root;
    scope.wip = this.wip;
    scope.unit = this.unit;
    scope.cursor = this.cursor;
    scope.mountLevel = this.mountLevel;
    scope.mountNav = this.mountNav;
    scope.mountDeep = this.mountDeep;
    scope.events = this.events;
    scope.unsubs = new Set([...this.unsubs]);
    scope.candidates = new Set([...this.candidates]);
    scope.deletions = new Set([...this.deletions]);
    scope.asyncEffects = new Set([...this.asyncEffects]);
    scope.layoutEffects = new Set([...this.layoutEffects]);
    scope.insertionEffects = new Set([...this.insertionEffects]);
    scope.isLayoutEffectsZone = this.isLayoutEffectsZone;
    scope.isInsertionEffectsZone = this.isInsertionEffectsZone;
    scope.isUpdateZone = this.isUpdateZone;

    return scope;
  }

  public getRoot() {
    return this.root;
  }

  public setRoot(fiber: Fiber) {
    this.root = fiber;
  }

  public getWorkInProgress() {
    return this.wip;
  }

  public setWorkInProgress(fiber: Fiber) {
    this.wip = fiber;
  }

  public getNextUnitOfWork() {
    return this.unit;
  }

  public setNextUnitOfWork(fiber: Fiber) {
    this.unit = fiber;
  }

  public getCursorFiber() {
    return this.cursor;
  }

  public setCursorFiber(fiber: Fiber) {
    this.cursor = fiber;
  }

  public navToChild() {
    this.mountLevel = this.mountLevel + 1;
    this.mountNav[this.mountLevel] = 0;
  }

  public navToSibling() {
    this.mountNav[this.mountLevel] = this.mountNav[this.mountLevel] + 1;
  }

  public navToParent() {
    this.mountNav[this.mountLevel] = 0;
    this.mountLevel = this.mountLevel - 1;
  }

  public getMountIndex() {
    return this.mountNav[this.mountLevel];
  }

  public getMountDeep() {
    return this.mountDeep;
  }

  public setMountDeep(value: boolean) {
    this.mountDeep = value;
  }

  public resetMount() {
    this.mountLevel = 0;
    this.mountNav = {};
    this.mountDeep = true;
  }

  public getEvents() {
    return this.events;
  }

  public addEventUnsubscriber(fn: Callback) {
    this.unsubs.add(fn);
  }

  public unsubscribeEvents() {
    this.unsubs.forEach(x => x());
    this.unsubs = new Set();
  }

  public getCandidates() {
    return this.candidates;
  }

  public addCandidate(fiber: Fiber) {
    this.candidates.add(fiber);
  }

  public resetCandidates() {
    this.candidates = new Set();
  }

  public getDeletions() {
    return this.deletions;
  }

  public addDeletion(fiber: Fiber) {
    this.deletions.add(fiber);
  }

  public hasDeletion(fiber: Fiber) {
    return this.deletions.has(fiber);
  }

  public resetDeletions() {
    this.deletions = new Set();
  }

  public addBatch(fn: Callback) {
    this.batches.add(fn);
  }

  public setBatchUpdate(fn: Callback) {
    this.batchUpdate = fn;
  }

  public applyBatch() {
    this.batches.forEach(x => x());
    this.batchUpdate && this.batchUpdate();
    this.batches = new Set();
    this.batchUpdate = null;
  }

  public addAsyncEffect(fn: Callback) {
    this.asyncEffects.add(fn);
  }

  public resetAsyncEffects() {
    this.asyncEffects = new Set();
  }

  public runAsyncEffects() {
    if (!this.isDynamic) return;
    const effects = this.asyncEffects;
    effects.size > 0 && setTimeout(() => effects.forEach(fn => fn()));
  }

  public addLayoutEffect(fn: Callback) {
    this.layoutEffects.add(fn);
  }

  public resetLayoutEffects() {
    this.layoutEffects = new Set();
  }

  public runLayoutEffects() {
    if (!this.isDynamic) return;
    this.setIsLayoutEffectsZone(true);
    this.layoutEffects.forEach(fn => fn());
    this.setIsLayoutEffectsZone(false);
  }

  public addInsertionEffect(fn: Callback) {
    this.insertionEffects.add(fn);
  }

  public resetInsertionEffects() {
    this.insertionEffects = new Set();
  }

  public runInsertionEffects() {
    if (!this.isDynamic) return;
    this.setIsInsertionEffectsZone(true);
    this.insertionEffects.forEach(fn => fn());
    this.setIsInsertionEffectsZone(false);
  }

  public addCancel(fn: Callback) {
    this.cancels.push(fn);
  }

  public applyCancels() {
    for (let i = this.cancels.length - 1; i >= 0; i--) {
      this.cancels[i]();
    }
  }

  public resetCancels() {
    this.cancels = [];
  }

  public getIsLayoutEffectsZone() {
    return this.isLayoutEffectsZone;
  }

  public setIsLayoutEffectsZone(value: boolean) {
    this.isLayoutEffectsZone = value;
  }

  public getIsInsertionEffectsZone() {
    return this.isInsertionEffectsZone;
  }

  public setIsInsertionEffectsZone(value: boolean) {
    this.isInsertionEffectsZone = value;
  }

  public getIsUpdateZone() {
    return this.isUpdateZone;
  }

  public setIsUpdateZone(value: boolean) {
    this.isUpdateZone = value;
  }

  public getIsBatchZone() {
    return this.isBatchZone;
  }

  public setIsBatchZone(value: boolean) {
    this.isBatchZone = value;
  }

  public getIsHydrateZone() {
    return this.isHydrateZone;
  }

  public setIsHydrateZone(value: boolean) {
    this.isHydrateZone = value;
  }

  public getIsStreamZone() {
    return this.isStreamZone;
  }

  public setIsStreamZone(value: boolean) {
    this.isStreamZone = value;
  }

  public getIsTransitionZone() {
    return this.isTransitionZone;
  }

  public setIsTransitionZone(value: boolean) {
    this.isTransitionZone = value;
  }

  public getIsHot() {
    return this.isHot;
  }

  public setIsHot(value: boolean) {
    this.isHot = value;
  }
}

let rootId: number = null;
const scopes = new Map<number, Scope>();

const getRootId = () => rootId;

const setRootId = (id: number) => {
  rootId = id;
  !scopes.has(rootId) && scopes.set(rootId, new Scope());
};

const removeScope = (id: number) => scopes.delete(id);

const replaceScope = (scope: Scope, id: number = rootId) => {
  scopes.set(id, scope);
};

const scope$$ = (id: number = rootId) => scopes.get(id);

export { type Scope, getRootId, setRootId, removeScope, replaceScope, scope$$ };
