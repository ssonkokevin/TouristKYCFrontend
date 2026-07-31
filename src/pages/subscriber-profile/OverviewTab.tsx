import type { ReactNode } from "react";

function Field({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <div className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</div>
      <div className="mt-0.5 text-sm text-slate-800">{value ?? "—"}</div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="mb-4 text-sm font-semibold text-slate-900">{title}</div>
      <div className="grid grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

function fmtDate(d?: string | null) {
  return d ? new Date(d).toLocaleDateString() : "—";
}

export function OverviewTab({ subscriber }: { subscriber: any }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card title="Personal Info">
        <Field label="Full Name" value={`${subscriber.surname} ${subscriber.otherNames}`} />
        <Field label="Date of Birth" value={fmtDate(subscriber.dateOfBirth)} />
        <Field label="Gender" value={subscriber.gender} />
        <Field label="Nationality" value={subscriber.nationality?.name} />
        <Field label="ID Type" value="Passport" />
        <Field label="Passport Number" value={subscriber.passportNumber} />
        <Field label="Passport Expiry" value={fmtDate(subscriber.passportExpiry)} />
        <Field label="SIM Category" value={subscriber.simInventory?.category} />
        <Field label="Status" value={<span className="capitalize">{subscriber.status}</span>} />
      </Card>

      <Card title="Visa & Registration">
        <Field label="Visa Type" value={subscriber.visaType} />
        <Field label="Visa Number" value={subscriber.visaNumber} />
        <Field label="Visa Expiry Date" value={fmtDate(subscriber.visaExpiryDate)} />
        <Field label="Purpose of Visit" value={<span className="capitalize">{subscriber.purposeOfVisit}</span>} />
        <Field label="Entry Point" value={subscriber.entryPoint} />
        <Field label="Arrival Date" value={fmtDate(subscriber.arrivalDate)} />
        <Field label="Registered" value={fmtDate(subscriber.registeredAt)} />
        <Field label="Stay Duration" value={subscriber.intendedDurationDays ? `${subscriber.intendedDurationDays} days` : "—"} />
        <Field label="Accommodation" value={subscriber.accommodation} />
        <Field label="Registration Booth" value={subscriber.registrationBooth} />
      </Card>

      <Card title="Registered By">
        <Field label="Operator Name" value={subscriber.registeredBy} />
        <Field label="Agent ID" value={subscriber.agentId} />
        <Field label="Agent Name" value={subscriber.agentName} />
        <Field label="Booth" value={subscriber.registrationBooth} />
      </Card>
    </div>
  );
}
