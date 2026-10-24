"use client";

import { createContext, useContext } from "react";

/** Activities record details (Meetings, Calls) show dates the way their lists do: `dd.mm.yyyy`. */
const NumericDatesContext = createContext(false);

export const NumericDatesProvider = NumericDatesContext.Provider;

export function useNumericDates(): boolean {
  return useContext(NumericDatesContext);
}
