/**
 * DOM engines (`@react-schedulerkit/react-scheduler/dom`): framework-agnostic pinning, programmatic
 * scrolling, compact detection and reduced-motion detection, used by the React hooks
 * (Feature Dossier 04 §8).
 *
 * @packageDocumentation
 */
export { createNavigator } from './dom/navigator';
export type { Navigator, NavigatorHooks, NavigatorOptions } from './dom/navigator';
export { compensateStickyGrowth, observeCompact, observeWidth, prefersReducedMotion } from './dom/observers';
export type { ReducedMotion } from './dom/observers';
export { createPinEngine } from './dom/pin-engine';
export type { PinEngine, PinEngineOptions } from './dom/pin-engine';
