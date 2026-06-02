/** A specialisation linked to a character (main spec or offspec). */
export interface CharacterSpec {
  specId: number;
  name: string;
  iconUrl: string | null;
  isMain: boolean;
}
