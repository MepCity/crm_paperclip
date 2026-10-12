"use client";

import { Radio, RadioGroup, type RadioGroupProps, type RadioProps } from "react-aria-components";
import "./table-radio.css";

export function TableRadioGroup(props: RadioGroupProps) {
  return <RadioGroup {...props} />;
}

export function TableRadio(props: RadioProps) {
  return <Radio {...props} className="table-radio" />;
}
