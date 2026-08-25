"use client";

import { useEffect, useState } from "react";
import { notFound, useParams, useRouter } from "next/navigation";
import Script from "next/script";
import {
  ArrowLeft,
  Check,
  Upload,
  X,
  MapPin,
  Calendar,
  Ticket,
  Loader2,
  Plus,
  ShieldCheck,
  AlertCircle,
  Lock,
  CalendarClock,
  Clock,
  Building2,
  Users,
  Mail,
  Phone,
  Map
} from "lucide-react";
import { getEvent } from "@/lib/events-store";
import type { EventDef, FieldDef } from "@/lib/event-schema";
import { getTicketClaims } from "@/lib/registrations-store";
import { supabase } from "@/lib/supabase";

// ---- File upload constraints ----
const MAX_FILE_SIZE_BYTES = 1 * 1024 * 1024;
const ALLOWED_FILE_TYPES = ["image/png", "image/jpeg", "image/jpg"];
const ALLOWED_EXTENSIONS = [".png", ".jpg", ".jpeg"];

function validateFile(file: File): string | null {
  const ext = "." + (file.name.split(".").pop()?.toLowerCase() ?? "");
  if (
    !ALLOWED_FILE_TYPES.includes(file.type) ||
    !ALLOWED_EXTENSIONS.includes(ext)
  ) {
    return "Only PNG or JPEG images are allowed.";
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return `File is too large — max size is 1Mb  (this file is ${Math.ceil(file.size / 1024)}KB).`;
  }
  return null;
}

async function uploadEventFile(file: File, eventId: string): Promise<string> {
  const fileExt = file.name.split(".").pop();
  const fileName = `${eventId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${fileExt}`;
  const { data, error } = await supabase.storage
    .from("event-uploads")
    .upload(fileName, file, { cacheControl: "3600", upsert: false });
  if (error) {
    console.error("Storage upload error:", error);
    throw error;
  }
  const {
    data: { publicUrl },
  } = supabase.storage.from("event-uploads").getPublicUrl(data.path);
  return publicUrl;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

// "+" expand row for Rules / Policies — Luma-style minimal accordion
function ExpandSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[#ececec] last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between py-4 text-left cursor-pointer group"
      >
        <span className="text-sm font-semibold text-[#17171a] group-hover:text-[#5b4fe5] transition-colors">
          {title}
        </span>
        <span
          className={`shrink-0 w-6 h-6 rounded-full bg-[#f2f1fb] text-[#5b4fe5] flex items-center justify-center transition-transform duration-300 ${open ? "rotate-45" : ""}`}
        >
          <Plus size={13} strokeWidth={2.5} />
        </span>
      </button>
      <div
        className={`grid transition-all duration-300 ease-out ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="overflow-hidden">
          <div className="pb-5 text-sm text-[#68686e] leading-relaxed">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// Icon-led info row — replaces paragraph-style event meta with scannable rows
function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3.5">
      <div className="shrink-0 w-10 h-10 rounded-xl bg-[#f2f1fb] text-[#5b4fe5] flex items-center justify-center">
        <Icon size={18} />
      </div>
      <div className="pt-1.5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9a9aa2]">
          {label}
        </p>
        <p className="text-sm font-medium text-[#17171a] mt-0.5">{value}</p>
      </div>
    </div>
  );
}

// ---- Date helpers ----

function formatShortDate(dateStr?: string) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatEventSchedule(
  event: EventDef,
): { day: string; time: string } | null {
  if (!event.eventStartDate) return null;
  try {
    const start = new Date(event.eventStartDate);
    const end = event.eventEndDate ? new Date(event.eventEndDate) : null;
    const day = start.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const startTime = start.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
    });
    if (end) {
      const sameDay = end.toDateString() === start.toDateString();
      const endTime = end.toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
      });
      return {
        day,
        time: sameDay
          ? `${startTime} – ${endTime}`
          : `${startTime} onwards, multi-day`,
      };
    }
    return { day, time: `${startTime} onwards` };
  } catch {
    return null;
  }
}

type RegAvailability = "open" | "upcoming" | "closed";

function getRegAvailability(event: EventDef, now: Date): RegAvailability {
  if (event.status === "closed") return "closed";
  if (event.status === "draft") return "closed";
  const start = event.startDate ? new Date(event.startDate) : null;
  const end = event.endDate ? new Date(event.endDate) : null;
  if (start && now < start) return "upcoming";
  if (end && now > end) return "closed";
  return "open";
}

export default function EventRegisterPage() {
  const params = useParams<{ eventId: string }>();
  const router = useRouter();

  const [event, setEvent] = useState<EventDef | null>(null);
  const [claims, setClaims] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [now] = useState(() => new Date());

  const [selectedTicketId, setSelectedTicketId] = useState<string>("");
  const [acceptedTerms, setAcceptedTerms] = useState<boolean>(false);
  const [values, setValues] = useState<Record<string, string | string[]>>({});
  const [photoPreviews, setPhotoPreviews] = useState<
    Record<string, { name: string; preview: string }>
  >({});
  const [rawFiles, setRawFiles] = useState<Record<string, File>>({});
  const [fileErrors, setFileErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!params.eventId) return;
    setIsLoading(true);
    Promise.all([
      getEvent(params.eventId),
      getTicketClaims(params.eventId),
    ]).then(([fetchedEvent, fetchedClaims]) => {
      if (fetchedEvent) {
        setEvent(fetchedEvent);
        setClaims(fetchedClaims);
        if (fetchedEvent.tickets?.length > 0) {
          const firstAvailable = fetchedEvent.tickets.find((tkt) => {
            const sold = fetchedClaims[tkt.id] || 0;
            return !tkt.capacity || tkt.capacity - sold > 0;
          });
          if (firstAvailable) setSelectedTicketId(firstAvailable.id);
        }
      }
      setIsLoading(false);
    });
  }, [params.eventId]);

  useEffect(() => {
    return () => {
      Object.values(photoPreviews).forEach((p) =>
        URL.revokeObjectURL(p.preview),
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setValue = (fieldId: string, v: string | string[]) =>
    setValues((prev) => ({ ...prev, [fieldId]: v }));

  const toggleCheckbox = (field: FieldDef, optId: string) => {
    const current = (values[field.id] as string[] | undefined) ?? [];
    setValue(
      field.id,
      current.includes(optId)
        ? current.filter((x) => x !== optId)
        : [...current, optId],
    );
  };

  const onFileChange = (
    fieldId: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validationError = validateFile(file);
    if (validationError) {
      setFileErrors((prev) => ({ ...prev, [fieldId]: validationError }));
      e.target.value = "";
      return;
    }
    setFileErrors((prev) => {
      const copy = { ...prev };
      delete copy[fieldId];
      return copy;
    });
    setPhotoPreviews((prev) => {
      if (prev[fieldId]) URL.revokeObjectURL(prev[fieldId].preview);
      return {
        ...prev,
        [fieldId]: { name: file.name, preview: URL.createObjectURL(file) },
      };
    });
    setRawFiles((prev) => ({ ...prev, [fieldId]: file }));
    setValue(fieldId, file.name);
  };

  const removeSelectedFile = (fieldId: string) => {
    setPhotoPreviews((p) => {
      if (p[fieldId]) URL.revokeObjectURL(p[fieldId].preview);
      const copy = { ...p };
      delete copy[fieldId];
      return copy;
    });
    setRawFiles((rf) => {
      const copy = { ...rf };
      delete copy[fieldId];
      return copy;
    });
    setFileErrors((fe) => {
      const copy = { ...fe };
      delete copy[fieldId];
      return copy;
    });
    setValue(fieldId, "");
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event) return;
    setError(null);

    const availability = getRegAvailability(event, now);
    if (availability !== "open") {
      setError(
        availability === "upcoming"
          ? `Registrations open on ${formatShortDate(event.startDate)}.`
          : "Registrations for this event are currently closed.",
      );
      return;
    }
    if (!acceptedTerms) {
      setError(
        "You must accept the Event Rules and Terms & Conditions to proceed.",
      );
      return;
    }
    if (Object.keys(fileErrors).length > 0) {
      setError("Please fix the file upload issues before continuing.");
      return;
    }

    setIsSubmitting(true);

    const customerFields = event.fields.filter(
      (f) => f.filledBy === "customer",
    );
    for (const field of customerFields) {
      if (!field.required) continue;
      const v = values[field.id];
      const empty =
        field.type === "checkbox-group"
          ? !v || (v as string[]).length === 0
          : !v;
      if (empty) {
        setError(`Please fill in "${field.label}".`);
        setIsSubmitting(false);
        return;
      }
      if (field.type === "file") {
        const file = rawFiles[field.id];
        if (file) {
          const validationError = validateFile(file);
          if (validationError) {
            setError(validationError);
            setIsSubmitting(false);
            return;
          }
        }
      }
    }

    try {
      const finalValues = { ...values };
      for (const [fieldId, file] of Object.entries(rawFiles)) {
        const publicUrl = await uploadEventFile(file, event.id);
        finalValues[fieldId] = publicUrl;
      }
      event.fields
        .filter((f) => f.filledBy === "preset")
        .forEach((f) => {
          finalValues[f.id] = f.presetValue ?? "";
        });

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          ticketId: selectedTicketId,
          values: finalValues,
        }),
      });
      const orderData = await res.json();
      if (!res.ok) throw new Error(orderData.error || "Checkout failed");

      if (orderData.isFree || orderData.alreadyConfirmed) {
        if (!orderData.registrationId) {
          setError(
            "Registration created but confirmation could not be loaded. Please contact support.",
          );
          setIsSubmitting(false);
          return;
        }
        router.push(
          `/registration-confirmation?rid=${orderData.registrationId}`,
        );
        return;
      }

      // 1. Extract email and phone from the form values
      const customerEmail = Object.values(finalValues).find(
        (v) => typeof v === "string" && v.includes("@"),
      ) as string | undefined;

      const customerPhone = Object.values(finalValues).find(
        (v) =>
          typeof v === "string" && /^[0-9]{10}$/.test(v.replace(/\D/g, "")),
      ) as string | undefined;

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: event.org,
        description: event.title,
        order_id: orderData.orderId,
        prefill: {
          email: customerEmail || "",
          contact: customerPhone || "",
        },
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch("/api/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyJson = await verifyRes.json();
            if (
              verifyRes.ok &&
              verifyJson.success &&
              verifyJson.registrationId
            ) {
              router.push(
                `/registration-confirmation?rid=${verifyJson.registrationId}`,
              );
              return;
            }
            setError(
              "Payment verification failed. If money was deducted, it will be automatically refunded.",
            );
          } catch {
            setError(
              "Network error during verification. We will reconcile this shortly.",
            );
          } finally {
            setIsSubmitting(false);
          }
        },
        theme: { color: "#5b4fe5" },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        setError(
          response.error.description || "Payment failed. Please try again.",
        );
        setIsSubmitting(false);
      });
      rzp.on("payment.closed", function () {
        setIsSubmitting(false);
      });
      rzp.open();
    } catch (err: any) {
      console.error(err);
      setError(
        "Unable to complete registration. Please check your file upload and try again.",
      );
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafafa] text-[#68686e] gap-3">
        <Loader2 size={32} className="animate-spin text-[#5b4fe5]" />
        <p className="text-sm font-medium tracking-wide">
          Loading event details…
        </p>
      </div>
    );
  }

  if (!event) return notFound();

  const customerFields = event.fields.filter((f) => f.filledBy === "customer");
  const currentTicket = event.tickets.find((t) => t.id === selectedTicketId);
  const amountToPay = currentTicket?.price || 0;
  const availability = getRegAvailability(event, now);
  const isEventOpen = availability === "open";
  const schedule = formatEventSchedule(event);
  const totalCapacity = event.tickets.reduce(
    (sum, t) => sum + (t.capacity || 0),
    0,
  );
  const totalSold = event.tickets.reduce(
    (sum, t) => sum + (claims[t.id] || 0),
    0,
  );

// --- MAGIC ROUTE PARSER LOGIC ---
  let displayDescription = event.description || "";
  let routeContent: string | null = null;

  // Check if the description contains our secret delimiter
  if (displayDescription.includes("- Route")) {
    const parts = displayDescription.split("- Route");
    displayDescription = parts[0].trim(); // Everything before "- Route"
    routeContent = parts[1].trim();       // Everything after "- Route"
  }

  return (
    <main className="min-h-screen bg-[#fafafa] font-sans text-[#17171a]">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />

      {/* Full-bleed cover hero */}
      <div className="relative h-[38vh] min-h-[260px] max-h-[420px] w-full overflow-hidden">
        {event.photoUrl ? (
          <img
            src={event.photoUrl}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#5b4fe5] via-[#7c6ef0] to-[#a78bfa]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#fafafa] via-black/10 to-black/20" />

        <a
          href="/"
          className="absolute top-5 left-5 sm:top-6 sm:left-6 inline-flex items-center gap-2 text-xs font-bold text-white bg-black/35 hover:bg-black/55 backdrop-blur-sm px-4 py-2 rounded-full transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} /> Back
        </a>
        {availability !== "open" && (
          <span className="absolute top-5 right-5 sm:top-6 sm:right-6 text-[10px] font-bold uppercase tracking-wider bg-white/95 text-[#c0392b] px-3 py-1.5 rounded-full shadow-sm">
            {availability === "upcoming"
              ? "Opening Soon"
              : event.status === "draft"
                ? "Draft Mode"
                : "Registration Closed"}
          </span>
        )}
      </div>

      {/* Content: overlapping card layout */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 -mt-10 sm:-mt-14 relative pb-24">
        <div className="grid lg:grid-cols-[1fr_380px] gap-6 lg:gap-8 items-start">
          {/* LEFT: details card */}
          <div className="bg-white rounded-3xl shadow-[0_20px_50px_-20px_rgba(23,23,26,0.15)] border border-[#ececec] p-6 sm:p-9 space-y-8">
            {/* Header & Event Title */}
            <div className="space-y-3">
              {event.org && (
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#f2f1fb] to-[#ece9fc] border border-[#ded9fa] text-[#5b4fe5] text-xs font-bold px-3.5 py-1.5 rounded-full shadow-xs">
                  <Building2 size={13} className="text-[#5b4fe5]" />
                  <span>{event.org}</span>
                </div>
              )}
              <h1 className="text-2xl sm:text-3xl lg:text-[2.35rem] font-extrabold tracking-tight leading-[1.12] text-[#17171a]">
                {displayDescription ? displayDescription : event.title}
              </h1>
            </div>

            {/* Quick Meta Grid (Luma/Dribbble Micro-Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {schedule && (
                <div className="p-4 rounded-2xl bg-[#fafafa] border border-[#ececec] hover:border-[#ded9fa] transition-colors">
                  <InfoRow
                    icon={Calendar}
                    label="When"
                    value={
                      <>
                        <span className="font-semibold text-[#17171a]">{schedule.day}</span>
                        <br />
                        <span className="text-[#68686e] text-xs font-normal">{schedule.time}</span>
                      </>
                    }
                  />
                </div>
              )}

              {event.address && (
                <div className="p-4 rounded-2xl bg-[#fafafa] border border-[#ececec] hover:border-[#ded9fa] transition-colors">
                  <InfoRow
                    icon={MapPin}
                    label="Where"
                    value={<span className="font-semibold text-[#17171a]">{event.address}</span>}
                  />
                </div>
              )}

              {(event.startDate || event.endDate) && (
                <div className="p-4 rounded-2xl bg-[#fafafa] border border-[#ececec] hover:border-[#ded9fa] transition-colors">
                  <InfoRow
                    icon={CalendarClock}
                    label="Registration Window"
                    value={
                      <span className="font-semibold text-[#17171a] text-xs leading-relaxed block">
                        {event.startDate ? formatShortDate(event.startDate) : "Now"} –{" "}
                        {event.endDate ? formatShortDate(event.endDate) : "Until spots last"}
                      </span>
                    }
                  />
                </div>
              )}

              {totalCapacity > 0 && (
                <div className="p-4 rounded-2xl bg-[#fafafa] border border-[#ececec] hover:border-[#ded9fa] transition-colors">
                  <InfoRow
                    icon={Users}
                    label="Spots"
                    value={
                      <span className="inline-flex items-center gap-1.5 font-semibold text-[#17171a]">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                        {Math.max(totalCapacity - totalSold, 0)} of {totalCapacity} remaining
                      </span>
                    }
                  />
                </div>
              )}
            </div>
            {/* {event.description && (
              <div className="pt-2 border-t border-[#ececec]">
                <h2 className="text-sm font-bold text-[#17171a] mb-2 pt-6">
                  About this event
                </h2>
                <p className="text-sm text-[#68686e] leading-relaxed whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            )} */}

            {/* Rules & Regulations — Expandable Accordion with Modern Cards */}
            {event.rules && event.rules.length > 0 && (
              <div className="pt-2 border-t border-[#ececec]">
                <ExpandSection
                  defaultOpen={false}
                  title={
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#f2f1fb] text-[#5b4fe5] flex items-center justify-center">
                        <ShieldCheck size={16} strokeWidth={2.5} />
                      </div>
                      <span className="font-bold text-[#17171a] tracking-tight">
                        Rules &amp; Regulations
                      </span>
                      <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#fafafa] text-[#9a9aa2] border border-[#ececec]">
                        {event.rules.length}{" "}
                        {event.rules.length === 1 ? "Rule" : "Rules"}
                      </span>
                    </div>
                  }
                >
                  <div className="grid gap-2.5 pt-2">
                    {event.rules.map((rule, idx) => (
                      <div
                        key={idx}
                        className="group relative flex items-start gap-3.5 p-3.5 rounded-2xl bg-gradient-to-r from-[#fafafa] to-white border border-[#ececec] hover:border-[#c9c4f7] hover:shadow-[0_4px_20px_-4px_rgba(91,79,229,0.08)] transition-all duration-200"
                      >
                        {/* Number Pill */}
                        <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded-lg bg-white group-hover:bg-[#5b4fe5] group-hover:text-white border border-[#e2e2e5] group-hover:border-[#5b4fe5] text-[11px] font-bold text-[#68686e] shadow-xs transition-colors duration-200">
                          {String(idx + 1).padStart(2, "0")}
                        </span>

                        {/* Rule Content */}
                        <p className="text-xs sm:text-sm font-medium text-[#404044] group-hover:text-[#17171a] leading-relaxed pt-0.5 transition-colors">
                          {rule}
                        </p>
                      </div>
                    ))}
                  </div>
                </ExpandSection>
              </div>
            )}

            {/* --- MAGIC ROUTE TRACK UI --- */}
            {routeContent && (
              <div className="pt-2 border-t border-[#ececec]">
                <ExpandSection
                  defaultOpen={false}
                  title={
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#f0fdf4] text-emerald-600 flex items-center justify-center border border-[#dcfce7]">
                        <Map size={15} strokeWidth={2.5} />
                      </div>
                      <span className="font-bold text-[#17171a] tracking-tight">
                        Event Route Map
                      </span>
                    </div>
                  }
                >
                  <div className="relative pl-3 pt-4 pb-2">
                    {/* The continuous vertical track line */}
                    <div className="absolute top-6 bottom-6 left-[19.5px] w-[2px] bg-gradient-to-b from-emerald-500 via-[#c9c4f7] to-[#c0392b] rounded-full"></div>

                    <div className="space-y-6 relative">
                      {routeContent
                        .split('\n')
                        .filter((line) => line.trim() !== '')
                        .map((step, idx, arr) => {
                          const isFirst = idx === 0;
                          const isLast = idx === arr.length - 1;
                          
                          // Dynamic Dot Colors
                          let dotColor = "bg-[#5b4fe5] border-[#f2f1fb]";
                          if (isFirst) dotColor = "bg-emerald-500 border-[#f0fdf4]";
                          if (isLast) dotColor = "bg-[#c0392b] border-[#fef2f2]";

                          return (
                            <div key={idx} className="flex items-start gap-4 group">
                              {/* Route Checkpoint Dot */}
                              <div
                                className={`relative z-10 w-4 h-4 rounded-full border-[3px] shadow-sm mt-0.5 shrink-0 transition-transform group-hover:scale-125 ${dotColor}`}
                              ></div>

                              {/* Route Text */}
                              <div className="flex-1 -mt-0.5">
                                <p className={`text-sm font-semibold transition-colors ${isFirst || isLast ? 'text-[#17171a]' : 'text-[#404044] group-hover:text-[#17171a]'}`}>
                                  {step.trim()}
                                </p>
                                {isFirst && <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mt-0.5">Start</p>}
                                {isLast && <p className="text-[10px] font-bold text-[#c0392b] uppercase tracking-wider mt-0.5">Finish Line</p>}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </ExpandSection>
              </div>
            )}


            <div className="pt-2 border-t border-[#ececec]">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#9a9aa2] mb-1">
                Policies &amp; Terms
              </h2>
              {[
                {
                  title: "Terms & Conditions",
                  content: event.termsAndConditions,
                },
                { title: "Privacy Policy", content: event.privacyPolicy },
                {
                  title: "Refund & Cancellation Policy",
                  content: event.refundPolicy,
                },
                {
                  title: "Shipping & Delivery Policy",
                  content: event.shippingPolicy,
                },
              ].map((policy, pIdx) =>
                policy.content ? (
                  <ExpandSection key={pIdx} title={policy.title}>
                    <p className="whitespace-pre-wrap">{policy.content}</p>
                  </ExpandSection>
                ) : null,
              )}
            </div>
            {/* Hosted By & Contact Card */}
            {(event.org || event.contactEmail || event.contactPhone) && (
              <div className="pt-6 border-t border-[#ececec]">
                <div className="rounded-2xl bg-[#fafafa] border border-[#ececec] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#9a9aa2]">
                      Organized by
                    </p>
                    <p className="text-sm font-bold text-[#17171a] mt-0.5">
                      Rilbong
                    </p>
                    <p className="text-xs text-[#68686e] mt-0.5">
                      Need help or have questions about this event?
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {event.contactEmail && (
                      <a
                        href={`mailto:${event.contactEmail}`}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#e2e2e5] hover:border-[#5b4fe5] hover:text-[#5b4fe5] text-xs font-semibold text-[#17171a] shadow-sm transition-all"
                      >
                        <Mail size={13} className="text-[#5b4fe5]" />
                        <span>Email</span>
                      </a>
                    )}

                    {event.contactPhone && (
                      <a
                        href={`tel:${event.contactPhone}`}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-[#e2e2e5] hover:border-[#5b4fe5] hover:text-[#5b4fe5] text-xs font-semibold text-[#17171a] shadow-sm transition-all"
                      >
                        <Phone size={13} className="text-[#5b4fe5]" />
                        <span>Call / WhatsApp</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: sticky ticket/registration card */}
            {/* RIGHT: sticky ticket/registration card */}
          <div className="lg:sticky lg:top-6">
            <form
              onSubmit={onSubmit}
              className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-[#ececec] p-6 sm:p-8 space-y-7"
            >
              {/* Closed / Upcoming Status Banner */}
              {!isEventOpen && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-[#fff4f4] to-[#fef2f2] border border-[#fbd5d5] text-[#c0392b] text-xs font-semibold flex items-center gap-3 shadow-xs">
                  <div className="p-1.5 bg-white rounded-full shadow-sm">
                    <Lock size={14} className="shrink-0" />
                  </div>
                  <span>
                    {availability === "upcoming" ? (
                      <>Opens {formatShortDate(event.startDate)}</>
                    ) : (
                      <>Registrations are closed</>
                    )}
                  </span>
                </div>
              )}

              {/* Ticket Selection */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#9a9aa2] mb-3.5 flex items-center gap-2">
                  <Ticket size={14} /> Select your pass
                </label>
                <div className="space-y-3">
                  {event.tickets.map((tkt) => {
                    const sold = claims[tkt.id] || 0;
                    const stockLeft = tkt.capacity ? tkt.capacity - sold : null;
                    const isSoldOut = stockLeft !== null && stockLeft <= 0;
                    const isSelected = selectedTicketId === tkt.id;
                    return (
                      <label
                        key={tkt.id}
                        className={`relative flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-300 ${
                          isSoldOut || !isEventOpen
                            ? "cursor-not-allowed opacity-50 bg-[#f9f9fa] border-transparent"
                            : isSelected
                              ? "border-[#5b4fe5] bg-gradient-to-r from-[#f4f3fc] to-white shadow-sm cursor-pointer"
                              : "border-[#ececec] hover:border-[#ded9fa] bg-white cursor-pointer hover:shadow-xs"
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <input
                            type="radio"
                            disabled={!isEventOpen || isSoldOut}
                            name="event_tkt"
                            value={tkt.id}
                            checked={isSelected}
                            onChange={(e) =>
                              setSelectedTicketId(e.target.value)
                            }
                            className="w-4 h-4 accent-[#5b4fe5] cursor-pointer disabled:cursor-not-allowed"
                          />
                          <div>
                            <div className="text-sm font-bold text-[#17171a]">
                              {tkt.name}
                            </div>
                            {stockLeft !== null && !isSoldOut && (
                              <div className="text-[11px] font-semibold text-[#c9820a] mt-0.5">
                                {stockLeft} left
                              </div>
                            )}
                            {isSoldOut && (
                              <div className="text-[11px] font-bold text-[#c0392b] mt-0.5">
                                Sold out
                              </div>
                            )}
                          </div>
                        </div>
                        <span className="text-[15px] font-extrabold text-[#17171a] shrink-0">
                          {tkt.price === 0 ? "Free" : `₹${tkt.price}`}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Customer Fields */}
              <div className="space-y-5 pt-6 border-t border-[#ececec]">
                {customerFields.map((field) => (
                  <div key={field.id}>
                    <label className="block text-xs font-bold text-[#17171a] mb-2 pl-1">
                      {field.label}{" "}
                      {field.required && (
                        <span className="text-[#5b4fe5]">*</span>
                      )}
                    </label>

                    {["text", "number", "email", "date"].includes(
                      field.type,
                    ) && (
                      <input
                        type={field.type}
                        disabled={!isEventOpen}
                        required={field.required}
                        placeholder={field.placeholder}
                        value={(values[field.id] as string) ?? ""}
                        onChange={(e) => setValue(field.id, e.target.value)}
                        className="w-full rounded-2xl border border-[#e2e2e5] px-4 py-3.5 text-sm outline-none focus:border-[#5b4fe5] focus:ring-4 focus:ring-[#5b4fe5]/15 bg-[#fafafa] focus:bg-white transition-all shadow-sm"
                      />
                    )}

                    {field.type === "phone" && (
                      <div className="flex rounded-2xl border border-[#e2e2e5] overflow-hidden focus-within:border-[#5b4fe5] focus-within:ring-4 focus-within:ring-[#5b4fe5]/15 bg-[#fafafa] focus-within:bg-white transition-all shadow-sm">
                        <span className="flex items-center px-4 text-xs font-bold text-[#9a9aa2] border-r border-[#e2e2e5] bg-[#f9f9fa]">
                          +91
                        </span>
                        <input
                          type="tel"
                          disabled={!isEventOpen}
                          required={field.required}
                          placeholder={field.placeholder ?? "98765 43210"}
                          value={(values[field.id] as string) ?? ""}
                          onChange={(e) => setValue(field.id, e.target.value)}
                          className="w-full px-4 py-3.5 text-sm outline-none bg-transparent"
                        />
                      </div>
                    )}

                    {field.type === "textarea" && (
                      <textarea
                        disabled={!isEventOpen}
                        required={field.required}
                        rows={3}
                        value={(values[field.id] as string) ?? ""}
                        onChange={(e) => setValue(field.id, e.target.value)}
                        className="w-full rounded-2xl border border-[#e2e2e5] px-4 py-3.5 text-sm outline-none focus:border-[#5b4fe5] focus:ring-4 focus:ring-[#5b4fe5]/15 bg-[#fafafa] focus:bg-white transition-all shadow-sm resize-none"
                      />
                    )}

                    {field.type === "select" && (
                      <select
                        disabled={!isEventOpen}
                        required={field.required}
                        value={(values[field.id] as string) ?? ""}
                        onChange={(e) => setValue(field.id, e.target.value)}
                        className="w-full rounded-2xl border border-[#e2e2e5] px-4 py-3.5 text-sm outline-none focus:border-[#5b4fe5] focus:ring-4 focus:ring-[#5b4fe5]/15 bg-[#fafafa] focus:bg-white transition-all shadow-sm cursor-pointer"
                      >
                        <option value="">Select…</option>
                        {field.options?.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    )}

                    {(field.type === "radio" ||
                      field.type === "checkbox-group") && (
                      <div className="space-y-2.5 mt-1.5">
                        {field.options?.map((opt) => {
                          const isMulti = field.type === "checkbox-group";
                          const checked = isMulti
                            ? (
                                (values[field.id] as string[] | undefined) ?? []
                              ).includes(opt.id)
                            : values[field.id] === opt.id;
                          return (
                            <label
                              key={opt.id}
                              className={`flex items-center gap-3 rounded-2xl border p-3.5 text-sm transition-all cursor-pointer ${
                                checked
                                  ? "border-[#5b4fe5] bg-[#f4f3fc] text-[#17171a] font-bold shadow-sm"
                                  : "border-[#e2e2e5] hover:border-[#c9c4f7] bg-[#fafafa] hover:bg-white text-[#404044]"
                              }`}
                            >
                              <input
                                type={isMulti ? "checkbox" : "radio"}
                                disabled={!isEventOpen}
                                name={field.id}
                                checked={checked}
                                onChange={() =>
                                  isMulti
                                    ? toggleCheckbox(field, opt.id)
                                    : setValue(field.id, opt.id)
                                }
                                className="w-4 h-4 accent-[#5b4fe5] cursor-pointer"
                              />
                              {opt.label}
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {field.type === "file" && (
                      <div>
                        <label className="flex flex-col items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed border-[#d4d4d8] hover:border-[#5b4fe5] p-6 text-xs font-medium text-[#68686e] cursor-pointer hover:bg-[#f9f9fa] bg-[#fafafa] transition-all group">
                          <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center border border-[#e2e2e5] group-hover:border-[#c9c4f7] transition-colors">
                            <Upload size={16} className="text-[#5b4fe5]" />
                          </div>
                          <span className="truncate max-w-[200px]">
                            {photoPreviews[field.id]?.name ??
                              "Upload PNG/JPEG (Max 1MB)"}
                          </span>
                          <input
                            type="file"
                            accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                            disabled={!isEventOpen}
                            className="hidden"
                            onChange={(e) => onFileChange(field.id, e)}
                          />
                        </label>
                        {fileErrors[field.id] && (
                          <p className="mt-2 text-[11px] font-semibold text-[#c0392b] flex items-center gap-1.5 bg-[#fef2f2] p-2 rounded-lg">
                            <AlertCircle size={12} className="shrink-0" />{" "}
                            {fileErrors[field.id]}
                          </p>
                        )}
                        {photoPreviews[field.id] && !fileErrors[field.id] && (
                          <div className="mt-3 relative inline-block group">
                            <img
                              src={photoPreviews[field.id].preview}
                              alt="Preview"
                              className="h-16 w-16 rounded-xl object-cover border-2 border-[#e2e2e5] shadow-sm"
                            />
                            <button
                              type="button"
                              onClick={() => removeSelectedFile(field.id)}
                              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#17171a] text-white flex items-center justify-center cursor-pointer hover:bg-[#c0392b] hover:scale-110 transition-all shadow-md"
                            >
                              <X size={12} strokeWidth={3} />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Terms Checkbox */}
              <label className="flex items-start gap-3 cursor-pointer select-none pt-6 border-t border-[#ececec]">
                <input
                  type="checkbox"
                  disabled={!isEventOpen}
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-[#5b4fe5] cursor-pointer rounded"
                />
                <span className="text-xs text-[#68686e] leading-relaxed">
                  I agree to the event{" "}
                  <strong className="text-[#17171a]">Rules</strong>,{" "}
                  <strong className="text-[#17171a]">Terms</strong> and{" "}
                  <strong className="text-[#17171a]">Privacy Policy</strong>.
                </span>
              </label>

              {/* Error Alert */}
              {error && (
                <div className="p-3.5 bg-[#fef2f2] text-[#c0392b] text-xs font-semibold rounded-2xl flex items-center gap-2 border border-[#fbd5d5] shadow-xs">
                  <AlertCircle size={16} className="shrink-0" /> 
                  <span className="leading-snug">{error}</span>
                </div>
              )}

              {/* Total & Submit Button */}
              <div className="pt-6 border-t border-[#ececec]">
                <div className="flex items-end justify-between mb-5 px-1">
                  <span className="text-sm font-semibold text-[#9a9aa2]">
                    Total Amount
                  </span>
                  <span className="text-[1.6rem] font-extrabold text-[#17171a] leading-none tracking-tight">
                    {amountToPay === 0 ? "Free" : `₹${amountToPay}`}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !selectedTicketId ||
                    !acceptedTerms ||
                    !isEventOpen
                  }
                  className="relative w-full rounded-2xl bg-[#5b4fe5] hover:bg-[#4a3fd1] active:bg-[#4038b8] active:scale-[0.98] transition-all duration-200 text-white font-bold py-4 text-[15px] shadow-[0_8px_20px_-6px_rgba(91,79,229,0.5)] disabled:opacity-50 disabled:shadow-none disabled:active:scale-100 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 overflow-hidden"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> Processing…
                    </>
                  ) : availability === "upcoming" ? (
                    "Not Open Yet"
                  ) : !isEventOpen ? (
                    "Registrations Closed"
                  ) : amountToPay === 0 ? (
                    "Reserve Free Spot"
                  ) : (
                    `Pay ₹${amountToPay}`
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
