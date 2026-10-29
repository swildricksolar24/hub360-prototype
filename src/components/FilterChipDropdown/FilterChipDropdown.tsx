import { useState } from 'react';
import { Dropdown, type DropdownProps } from '../Dropdown/Dropdown';
import { DropdownChips } from '../Dropdown/DropdownChips';
import styles from './FilterChipDropdown.module.css';

export type FilterChipDropdownProps = Omit<DropdownProps, 'multiple' | 'value' | 'defaultValue' | 'onChange' | 'variant' | 'icon' | 'footer' | 'renderValue'> & {
  /** Chosen values, shown as teal chips under the field. */
  value?: string[];
  defaultValue?: string[];
  onChange?: (value: string[]) => void;
  /** brand = teal-tinted chip panel (Figma `State=Press`) · plain = no panel fill (Figma `State=Press - Alt`). */
  chipsAppearance?: 'brand' | 'plain';
};

/**
 * Figma Drop Down - Filter Chip: a labelled multi-select field. The field keeps its `Select`
 * text; chosen options appear as removable chips (Drop Down Label › chips) under it.
 */
export function FilterChipDropdown({
  value,
  defaultValue = [],
  onChange,
  chipsAppearance = 'brand',
  options,
  label,
  placeholder = 'Select',
  error,
  required,
  disabled,
  className,
  ...rest
}: FilterChipDropdownProps) {
  const [inner, setInner] = useState<string[]>(defaultValue);
  const current = value ?? inner;
  const change = (next: string[]) => {
    if (value === undefined) setInner(next);
    onChange?.(next);
  };
  const chosen = options.filter(o => current.includes(o.value));

  return (
    <Dropdown
      {...rest}
      className={[styles.root, className].filter(Boolean).join(' ')}
      variant="field"
      multiple
      options={options}
      label={label}
      placeholder={placeholder}
      error={error}
      required={required}
      disabled={disabled}
      value={current}
      onChange={v => change(v as string[])}
      renderValue={() => placeholder}
      footer={
        chosen.length > 0 && (
          <DropdownChips
            className={styles.chips}
            items={chosen}
            appearance={chipsAppearance}
            error={!!error}
            required={required}
            disabled={disabled}
            aria-label={label ? `Selected ${label}` : 'Selected'}
            onRemove={v => change(current.filter(x => x !== v))}
          />
        )
      }
    />
  );
}
