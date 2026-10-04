"use client";

import { Tab, TabList, TabPanel, Tabs } from "./tabs";

export default function TabsDemo() {
  return (
    <Tabs>
      <TabList aria-label="Record">
        <Tab id="overview">Overview</Tab>
        <Tab id="details">Details</Tab>
        <Tab id="activity">Activity</Tab>
        <Tab id="closed" isDisabled>
          Closed
        </Tab>
      </TabList>
      <TabPanel id="overview">Overview panel</TabPanel>
      <TabPanel id="details">Details panel</TabPanel>
      <TabPanel id="activity">Activity panel</TabPanel>
      <TabPanel id="closed">Closed panel</TabPanel>
    </Tabs>
  );
}
