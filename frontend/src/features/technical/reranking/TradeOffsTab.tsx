import { ArrowUpDown, CheckCircle, AlertTriangle } from "lucide-react";
import Card from "../../../components/ui/Card";
import SectionTitle from "../../../components/ui/SectionTitle";

export default function TradeOffsTab() {
  return (
    <Card>
      <SectionTitle
        icon={<ArrowUpDown size={20} />}
        title="Trade-offs"
        subtitle="When re-ranking helps and when it doesn't"
      />
      <div className="grid grid-cols-2 gap-4">
        <div className="border border-green-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-green-800 uppercase tracking-wide mb-2">
            Re-ranking helps most when…
          </p>
          <ul className="text-xs text-slate-600 space-y-1.5">
            <li className="flex gap-2">
              <CheckCircle
                size={12}
                className="text-green-500 mt-0.5 flex-shrink-0"
              />
              Questions ask for specific facts (dates, names, numbers)
            </li>
            <li className="flex gap-2">
              <CheckCircle
                size={12}
                className="text-green-500 mt-0.5 flex-shrink-0"
              />
              Documents are long and contain many related topics
            </li>
            <li className="flex gap-2">
              <CheckCircle
                size={12}
                className="text-green-500 mt-0.5 flex-shrink-0"
              />
              The query phrasing differs from the document phrasing
            </li>
            <li className="flex gap-2">
              <CheckCircle
                size={12}
                className="text-green-500 mt-0.5 flex-shrink-0"
              />
              High precision is more important than raw speed
            </li>
          </ul>
        </div>
        <div className="border border-amber-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-2">
            Re-ranking adds less value when…
          </p>
          <ul className="text-xs text-slate-600 space-y-1.5">
            <li className="flex gap-2">
              <AlertTriangle
                size={12}
                className="text-amber-500 mt-0.5 flex-shrink-0"
              />
              The knowledge base is small (&lt; 100 chunks)
            </li>
            <li className="flex gap-2">
              <AlertTriangle
                size={12}
                className="text-amber-500 mt-0.5 flex-shrink-0"
              />
              Questions are broad / conceptual (vector search already works
              well)
            </li>
            <li className="flex gap-2">
              <AlertTriangle
                size={12}
                className="text-amber-500 mt-0.5 flex-shrink-0"
              />
              Latency is critical and &lt;100ms responses are required
            </li>
            <li className="flex gap-2">
              <AlertTriangle
                size={12}
                className="text-amber-500 mt-0.5 flex-shrink-0"
              />
              The relevant answer is simply absent from the documents
            </li>
          </ul>
        </div>
      </div>
    </Card>
  );
}
