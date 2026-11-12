import { useSyncExternalStore } from 'react';

/*
 * The Helper's switches (a prototype tool, not in Figma): named on / off flags that pages read to show a state the
 * sample data doesn't (an empty list, an offline printer, a loading skeleton…). They change the view, never the data:
 * turning one off brings back exactly what was there. They're kept in memory, so they stay on while you move between
 * pages, and a full reload (or the Helper's "Turn all off") turns them all off.
 *
 * Name them "<area>.<state>", e.g. "warehouses.empty", "printer.offline".
 */

const flags = new Set<string>();
const listeners = new Set<() => void>();
let version = 0;

function emit() {
  version++;
  listeners.forEach(l => l());
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Whether a Helper switch is on. */
export function useHelperFlag(name: string): boolean {
  return useSyncExternalStore(subscribe, () => flags.has(name));
}

/** Whether any Helper switch is on (for the Helper's "Turn all off"). */
export function useAnyHelperFlag(): boolean {
  useSyncExternalStore(subscribe, () => version);
  return flags.size > 0;
}

export function setHelperFlag(name: string, on: boolean) {
  if (on === flags.has(name)) return;
  if (on) flags.add(name);
  else flags.delete(name);
  emit();
}

export function resetHelperFlags() {
  if (flags.size === 0) return;
  flags.clear();
  emit();
}
