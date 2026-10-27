import { groupByDay } from "./CalendarPage";

describe("groupByDay", () => {
  it("groups and sorts events by day", () => {
    const grouped = groupByDay([
      { id: 1, title: "B", start: "2026-11-05", end: "2026-11-05", type: "task" },
      { id: 2, title: "A", start: "2026-11-03", end: "2026-11-03", type: "debt" },
      { id: 3, title: "C", start: "2026-11-05", end: "2026-11-05", type: "debt" },
    ]);
    expect(grouped.map(([day, events]) => [day, events.length])).toEqual([
      ["2026-11-03", 1],
      ["2026-11-05", 2],
    ]);
  });
});
