function Field({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <div className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</div>
      <div className="mt-0.5 text-sm text-slate-800 font-mono">{value ?? "—"}</div>
    </div>
  );
}

export function SimInfoTab({ subscriber }: { subscriber: any }) {
  const sim = subscriber.simInventory;
  const msisdn = subscriber.msisdnPool?.[0];

  if (!sim && !msisdn) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-sm text-slate-400">
        No SIM resource linked to this subscriber.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        <Field label="MSISDN" value={msisdn?.msisdn} />
        <Field label="ICCID" value={sim?.iccid} />
        <Field label="IMSI" value={sim?.imsi} />
        <Field label="SIM Type" value={sim?.type} />
        <Field label="Activation Date" value={sim?.provisionedAt ? new Date(sim.provisionedAt).toLocaleDateString() : "—"} />
        <Field label="Current Status" value={<span className="capitalize">{sim?.status}</span>} />
        <Field label="Resource Batch ID" value={sim?.batchId} />
        <Field label="Provider Confirmation Ref" value={sim?.providerConfirmationRef} />
      </div>
    </div>
  );
}
