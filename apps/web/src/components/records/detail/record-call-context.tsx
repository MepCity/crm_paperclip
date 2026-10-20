"use client";

import { createContext, useContext } from "react";

/** Lets Phone Call controls on a record detail open the Call create form for that record. */
const RecordCallContext = createContext<(() => void) | null>(null);
export const RecordCallProvider = RecordCallContext.Provider;
export const useRecordCall = () => useContext(RecordCallContext);
