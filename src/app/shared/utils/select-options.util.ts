/** Minimal shape required by {@link filterOptionsByLabel}/{@link groupOptions} — SelectOption and MultiSelectOption both satisfy it. */
export interface LabeledOption {
  label: string;
  /** Optional group header — same-group entries must be contiguous for {@link groupOptions} to fold them together. */
  group?: string;
}

export interface OptionGroup<O> {
  group: string | null;
  options: O[];
}

/** Case-insensitive substring filter over `options` by their `label`. Shared by SelectComponent/MultiSelectComponent's filterable dropdown. */
export function filterOptionsByLabel<O extends LabeledOption>(options: O[], query: string): O[] {
  const normalized = query.toLowerCase().trim();
  if (!normalized) return options;
  return options.filter((o) => o.label.toLowerCase().includes(normalized));
}

/** Folds `options` into runs of consecutive same-`group` entries, for group headers. Caller must sort `options` so same-group entries are contiguous. */
export function groupOptions<O extends LabeledOption>(options: O[]): OptionGroup<O>[] {
  const groups: OptionGroup<O>[] = [];
  for (const opt of options) {
    const key = opt.group ?? null;
    const last = groups.at(-1);
    if (last?.group === key) {
      last.options.push(opt);
    } else {
      groups.push({ group: key, options: [opt] });
    }
  }
  return groups;
}
