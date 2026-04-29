export interface RibbonButtonBaseProps {
  icon?: React.ReactNode;
  label?: string;
  tooltip?: string;
  shortcut?: string;
  disabled?: boolean;
  active?: boolean;
  onClick?: () => void;
  testId?: string;
}

export interface RibbonDropdownOption<T = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  divider?: boolean;
}

export interface RibbonColorOption {
  color: string;
  label: string;
}
