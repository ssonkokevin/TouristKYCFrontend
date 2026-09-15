import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getSubscriber, suspendSubscriber, deregisterSubscriber } from "@/api/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { OverviewTab } from "./OverviewTab";
import { DocumentsTab } from "./DocumentsTab";
import { SimInfoTab } from "./SimInfoTab";
import { ActionModal } from "./ActionModal";

const TABS = ["Overview", "Documents", "SIM Info"] as const;
type Tab = (typeof TABS)[number];

export function SubscriberProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [subscriber, setSubscriber] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("Overview");
  const [modal, setModal] = useState<"suspend" | "deregister" | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const load = () => {
    if (!id) return;
    setLoading(true);
    getSubscriber(id)
      .then(setSubscriber)
      .catch((err) => toast({ title: "Error", description: err.message, variant: "destructive" }))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const handleSuspend = async (reason: string, note?: string) => {
    if (!id) return;
    try {
      await suspendSubscriber(id, reason, note);
      toast({ title: "Subscriber suspended" });
      setModal(null);
      load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDeregister = async (reason: string, note?: string) => {
    if (!id) return;
    try {
      await deregisterSubscriber(id, reason, note);
      toast({ title: "Subscriber deregistered" });
      setModal(null);
      load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  if (loading || !subscriber) {
    return (
      <div className="flex h-full items-center justify-center p-12">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-kyc-brand rounded-full animate-spin" />
      </div>
    );
  }

  const msisdn = subscriber.msisdnPool?.[0]?.msisdn;

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 uppercase">
            {subscriber.surname} {subscriber.otherNames}
          </h1>
          <div className="mt-1 text-sm text-slate-500">
            ID: {subscriber.id.slice(0, 8).toUpperCase()} · MSISDN: {msisdn ?? "—"} ·{" "}
            <span className="capitalize font-medium">{subscriber.status}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">Edit</Button>
          {subscriber.status === "active" && (
            <Button variant="outline" size="sm" onClick={() => setModal("suspend")}>Suspend</Button>
          )}
          {subscriber.status !== "deregistered" && (
            <Button variant="destructive" size="sm" onClick={() => setModal("deregister")}>Deregister</Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-6">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t ? "border-kyc-brand text-kyc-brand" : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {t}
            </button>
          ))}
        </nav>
      </div>

      {tab === "Overview" && <OverviewTab subscriber={subscriber} />}
      {tab === "Documents" && <DocumentsTab subscriber={subscriber} onChanged={load} />}
      {tab === "SIM Info" && <SimInfoTab subscriber={subscriber} />}

      {modal === "suspend" && (
        <ActionModal
          title="Suspend Subscriber"
          reasons={[
            { value: "visa_expired", label: "Visa Expired" },
            { value: "manual_review", label: "Manual Review" },
            { value: "fraud_suspected", label: "Fraud Suspected" },
            { value: "payment_issue", label: "Payment Issue" },
            { value: "other", label: "Other" },
          ]}
          confirmLabel="Suspend"
          onCancel={() => setModal(null)}
          onConfirm={handleSuspend}
        />
      )}

      {modal === "deregister" && (
        <ActionModal
          title="Deregister Subscriber"
          reasons={[
            { value: "lost_card", label: "Lost Card" },
            { value: "change_of_number", label: "Change of Number" },
            { value: "customer_not_interested", label: "Customer Not Interested" },
            { value: "voluntary_deregistration", label: "Voluntary Deregistration" },
            { value: "fraud_suspected", label: "Fraud Suspected" },
            { value: "other", label: "Other" },
          ]}
          confirmLabel="Deregister"
          destructive
          onCancel={() => setModal(null)}
          onConfirm={handleDeregister}
        />
      )}
    </div>
  );
}
