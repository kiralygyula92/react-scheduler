// jsdom has no layout, observers or scrolling. These fakes let tests drive the DOM engines with
// injected geometry, as the source's own characterization suite did.
import { vi } from 'vitest';

type IOCallback = (entries: IntersectionObserverEntry[], observer: IntersectionObserver) => void;

export class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];
  readonly targets: Set<Element> = new Set();
  disconnected = false;

  constructor(
    readonly callback: IOCallback,
    readonly options: IntersectionObserverInit = {},
  ) {
    FakeIntersectionObserver.instances.push(this);
  }

  observe(target: Element): void {
    this.targets.add(target);
  }

  unobserve(target: Element): void {
    this.targets.delete(target);
  }

  disconnect(): void {
    this.disconnected = true;
    this.targets.clear();
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  /** Delivers entries for `targets` with their current (mocked) rects. */
  trigger(targets: Element[] = [...this.targets]): void {
    const entries = targets.map((target) => ({ target, boundingClientRect: target.getBoundingClientRect() }));
    this.callback(entries as unknown as IntersectionObserverEntry[], this as unknown as IntersectionObserver);
  }

  static active(): FakeIntersectionObserver[] {
    return FakeIntersectionObserver.instances.filter((observer) => !observer.disconnected);
  }
}

export class FakeResizeObserver {
  static instances: FakeResizeObserver[] = [];
  readonly targets: Set<Element> = new Set();

  constructor(readonly callback: ResizeObserverCallback) {
    FakeResizeObserver.instances.push(this);
  }

  observe(target: Element): void {
    this.targets.add(target);
  }

  unobserve(target: Element): void {
    this.targets.delete(target);
  }

  disconnect(): void {
    this.targets.clear();
  }

  /** Reports `width` as the content width of every observed target. */
  trigger(width = 0): void {
    const entries = [...this.targets].map((target) => ({ target, contentRect: { width } }));
    this.callback(entries as unknown as ResizeObserverEntry[], this);
  }
}

export function installObservers(): void {
  FakeIntersectionObserver.instances = [];
  FakeResizeObserver.instances = [];
  vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
  vi.stubGlobal('ResizeObserver', FakeResizeObserver);
}

/** Makes `element.getBoundingClientRect().top` return `top()`. */
export function mockTop(element: Element, top: () => number): void {
  element.getBoundingClientRect = () => ({
    top: top(),
    bottom: top(),
    left: 0,
    right: 0,
    width: 0,
    height: 0,
    x: 0,
    y: top(),
    toJSON: () => ({}),
  });
}

/** Defines a writable numeric layout property (scrollTop, offsetHeight, clientWidth, …). */
export function setLayout(element: Element, values: Record<string, number>): void {
  for (const [key, value] of Object.entries(values)) {
    Object.defineProperty(element, key, { configurable: true, writable: true, value });
  }
}
