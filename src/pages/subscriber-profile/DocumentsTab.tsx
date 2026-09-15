import { useRef, useState } from "react";
import { FileText, BookUser, StickyNote, Camera, Upload } from "lucide-react";
import { uploadDocument, deleteDocument } from "@/api/client";
import { useToast } from "@/components/ui/use-toast";

const DOC_TYPES = [
  { type: "application_form", label: "Application Form", icon: FileText },
  { type: "passport_bio_page", label: "Passport Bio Page", icon: BookUser },
  { type: "visa_page", label: "Visa Page", icon: StickyNote },
  { type: "subscriber_photo", label: "Subscriber Photo", icon: Camera },
] as const;

export function DocumentsTab({ subscriber, onChanged }: { subscriber: any; onChanged: () => void }) {
  const { toast } = useToast();
  const [busyType, setBusyType] = useState<string | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleUpload = async (type: string, file: File) => {
    setBusyType(type);
    try {
      await uploadDocument(subscriber.id, type, file);
      toast({ title: "Document uploaded" });
      onChanged();
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setBusyType(null);
    }
  };

  const handleDelete = async (type: string) => {
    setBusyType(type);
    try {
      await deleteDocument(subscriber.id, type);
      toast({ title: "Document deleted" });
      onChanged();
    } catch (err: any) {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    } finally {
      setBusyType(null);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {DOC_TYPES.map(({ type, label, icon: Icon }) => {
        const url = subscriber.documents?.[type]?.url;
        const busy = busyType === type;
        return (
          <div key={type} className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col items-center text-center">
            {url ? (
              /\.(png|jpe?g|webp|gif)$/i.test(url) ? (
                <img src={url} alt={label} className="h-24 w-24 rounded-lg object-cover mb-3" />
              ) : (
                <div className="h-24 w-24 rounded-lg bg-slate-50 flex items-center justify-center mb-3">
                  <Icon className="h-10 w-10 text-slate-400" />
                </div>
              )
            ) : (
              <div className="h-24 w-24 rounded-lg bg-slate-50 flex items-center justify-center mb-3">
                <Icon className="h-10 w-10 text-slate-300" />
              </div>
            )}
            <div className="text-sm font-medium text-slate-900 mb-2">{label}</div>
            <input
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              ref={(el) => (inputRefs.current[type] = el)}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(type, file);
                e.target.value = "";
              }}
            />
            <div className="flex items-center gap-2 text-xs">
              {url && (
                <a href={url} target="_blank" rel="noreferrer" className="text-kyc-brand hover:underline font-medium">
                  View
                </a>
              )}
              <button
                disabled={busy}
                onClick={() => inputRefs.current[type]?.click()}
                className="text-blue-600 hover:underline font-medium disabled:opacity-50"
              >
                {url ? "Edit" : "Upload"}
              </button>
              {url && (
                <button
                  disabled={busy}
                  onClick={() => handleDelete(type)}
                  className="text-red-600 hover:underline font-medium disabled:opacity-50"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        );
      })}
      <div className="col-span-full flex justify-end">
        <span className="text-xs text-slate-400 flex items-center gap-1">
          <Upload className="h-3.5 w-3.5" /> Click Upload/Edit on any card to select a new file
        </span>
      </div>
    </div>
  );
}
