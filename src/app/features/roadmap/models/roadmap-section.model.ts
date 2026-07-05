export enum RoadmapItemStatus {
  Done = 'Done',
  Planned = 'Planned',
}

export interface RoadmapItem {
  id: string;
  titleKey: string;
  descriptionKey: string;
  status: RoadmapItemStatus;
}

export interface RoadmapSection {
  id: string;
  titleKey: string;
  items: RoadmapItem[];
  /** Marks a section as actively being worked on right now, shown as a badge next to its title. */
  inProgress?: boolean;
}
