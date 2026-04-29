"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { RibbonTabStrip } from "./primitives";
import { RibbonCollapseContext } from "./RibbonCollapseContext";
import { HomeTab } from "./tabs/HomeTab";
import { InsertTab } from "./tabs/InsertTab";
import { PageLayoutTab } from "./tabs/PageLayoutTab";
import { FormulasTab } from "./tabs/FormulasTab";
import { DataTab } from "./tabs/DataTab";
import { ViewTab } from "./tabs/ViewTab";
import { TellMeSearch } from "./TellMeSearch";

const TABS = [
  { id: "home", label: "Home" },
  { id: "insert", label: "Insert" },
  { id: "page-layout", label: "Page Layout" },
  { id: "formulas", label: "Formulas" },
  { id: "data", label: "Data" },
  { id: "view", label: "View" },
];

const TAB_COMPONENTS: Record<string, React.ComponentType> = {
  home: HomeTab,
  insert: InsertTab,
  "page-layout": PageLayoutTab,
  formulas: FormulasTab,
  data: DataTab,
  view: ViewTab,
};

const COLLAPSE_PRIORITY = [
  "Editing",
  "Cells",
  "Styles",
  "Number",
  "Alignment",
];

function computeCollapsedGroups(width: number): Set<string> {
  if (width >= 1200) return new Set();
  if (width < 900) return new Set(COLLAPSE_PRIORITY);
  const range = 1200 - 900;
  const step = range / COLLAPSE_PRIORITY.length;
  const count = Math.ceil((1200 - width) / step);
  return new Set(COLLAPSE_PRIORITY.slice(0, Math.min(count, COLLAPSE_PRIORITY.length)));
}

export function SheetRibbon() {
  const [activeTabId, setActiveTabId] = useState("home");
  const [containerWidth, setContainerWidth] = useState(1400);
  const containerRef = useRef<HTMLDivElement>(null);
  const ActiveTab = TAB_COMPONENTS[activeTabId] ?? HomeTab;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width;
      if (w) setContainerWidth(w);
    });
    ro.observe(el);
    setContainerWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const collapsedGroups = useMemo(() => computeCollapsedGroups(containerWidth), [containerWidth]);

  return (
    <div className="sheet-ribbon-root" ref={containerRef}>
      <RibbonTabStrip
        tabs={TABS}
        activeTabId={activeTabId}
        onTabChange={setActiveTabId}
        rightContent={<TellMeSearch />}
      />
      <RibbonCollapseContext value={collapsedGroups}>
        <ActiveTab />
      </RibbonCollapseContext>
    </div>
  );
}
