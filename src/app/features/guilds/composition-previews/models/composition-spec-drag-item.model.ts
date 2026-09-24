/** Drag payload for dropping a spec from the class/spec palette onto a grid slot. */
export interface CompositionSpecDragItem {
  wowClassId: number;
  specId: number;
  specIconUrl: string | null;
  /** Hex color of the class, prefixed with `#`. */
  wowClassColor: string;
}
