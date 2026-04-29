"use client";

import { RibbonDropdown } from "./RibbonDropdown";

const DEFAULT_FONTS = [
  "Aptos Narrow", "Calibri", "Arial", "Times New Roman", "Geist Sans",
  "Helvetica", "Courier New", "Verdana", "Georgia", "Tahoma",
  "Trebuchet MS", "Comic Sans MS",
];

interface RibbonFontFamilyPickerProps {
  value: string;
  onChange: (fontFamily: string) => void;
  fonts?: string[];
}

export function RibbonFontFamilyPicker({ value, onChange, fonts }: RibbonFontFamilyPickerProps) {
  const fontList = fonts ?? DEFAULT_FONTS;

  return (
    <RibbonDropdown
      value={value}
      options={fontList.map((f) => ({
        value: f,
        label: f,
        icon: <span style={{ fontFamily: f, fontSize: 13, lineHeight: "16px" }}>Aa</span>,
      }))}
      onChange={onChange}
      width={140}
      tooltip="Font"
    />
  );
}
