import { ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PageHeader from "../../components/ui/PageHeader";
import TabBar from "../../components/ui/TabBar";
import ImplementationTab from "./response-grounding/ImplementationTab";
import OverviewTab from "./response-grounding/OverviewTab";
import StrategiesTab from "./response-grounding/StrategiesTab";
import TradeOffsTab from "./response-grounding/TradeOffsTab";

const TABS = ["Overview", "Strategies", "Implementation", "Trade-offs"] as const;
type Tab = (typeof TABS)[number];

function isTab(value: string | null): value is Tab {
  return TABS.includes(value as Tab);
}

export default function ResponseGroundingPage() {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<Tab>(isTab(tabParam) ? tabParam : "Overview");

  useEffect(() => {
    if (isTab(tabParam)) setActiveTab(tabParam);
  }, [tabParam]);

  return (
    <div className="p-8 w-full">
      <PageHeader
        icon={<ShieldCheck className="text-[#d97706]" size={28} />}
        title="Response Grounding — Technical Deep Dive"
        info="Three strategies to detect whether an LLM answer comes from retrieved documents or from the model's training data."
      />

      <TabBar
        tabs={TABS}
        active={activeTab}
        onChange={setActiveTab}
        activeTextColor="text-[#92400e]"
      />

      {activeTab === "Overview" && <OverviewTab />}
      {activeTab === "Strategies" && <StrategiesTab />}
      {activeTab === "Implementation" && <ImplementationTab />}
      {activeTab === "Trade-offs" && <TradeOffsTab />}
    </div>
  );
}
