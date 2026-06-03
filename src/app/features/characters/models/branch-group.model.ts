import { RealmGroup } from './realm-group.model';

export interface BranchGroup {
  branchName: string;
  realms: RealmGroup[];
}
