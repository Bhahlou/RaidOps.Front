/** How presence is determined for a raid series/event. `Signup` is not functional yet (Milestone 2). */
export enum SignupMode {
  /** Presence is deduced from the absence-declaration resolution engine — no explicit sign-up. */
  DefaultPresent = 'DefaultPresent',
  /** RaidHelper-style explicit sign-up. Not implemented yet. */
  Signup = 'Signup',
}
