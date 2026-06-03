import { BnetRegion } from '../../../shared/constants/bnet-regions';

export interface BnetAccount {
  bnetId: string;
  battleTag: string;
  region: BnetRegion;
  tokenExpiry: string;
}
