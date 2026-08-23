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
} from "lucide-react";
import { getEvent } from "@/lib/events-store";
import type { EventDef, FieldDef } from "@/lib/event-schema";
import { getTicketClaims } from "@/lib/registrations-store";
import { supabase } from "@/lib/supabase";

// ---- File upload constraints ----
const MAX_FILE_SIZE_BYTES = 50 * 1024;
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
    return `File is too large — max size is 50KB (this file is ${Math.ceil(file.size / 1024)}KB).`;
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
        (v) => typeof v === 'string' && v.includes('@')
      ) as string | undefined

      const customerPhone = Object.values(finalValues).find(
        (v) => typeof v === 'string' && /^[0-9]{10}$/.test(v.replace(/\D/g, ''))
      ) as string | undefined

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: event.org,
        description: event.title,
        order_id: orderData.orderId,
        prefill: {
          email: customerEmail || '',
          contact: customerPhone || '',
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
            <div>
              {event.org && (
                <div className="inline-flex items-center gap-2 bg-[#f2f1fb] text-[#5b4fe5] text-xs font-bold px-3 py-1.5 rounded-full mb-4">
                  <Building2 size={13} /> {event.org}
                </div>
              )}
              <h1 className="text-2xl sm:text-3xl lg:text-[2.2rem] font-bold tracking-tight leading-[1.1] text-[#17171a] uppercase">
                {event.description ? (
                  <span className="inline-flex items-center gap-2">
                    {event.description}
                  </span>
                ) : (
                  event.title
                )}
              </h1>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              {schedule && (
                <InfoRow
                  icon={Calendar}
                  label="When"
                  value={
                    <>
                      {schedule.day}
                      <br />
                      <span className="text-[#68686e] font-normal">
                        {schedule.time}
                      </span>
                    </>
                  }
                />
              )}
              {event.address && (
                <InfoRow icon={MapPin} label="Where" value={event.address} />
              )}
              {(event.startDate || event.endDate) && (
                <InfoRow
                  icon={CalendarClock}
                  label="Registration Window"
                  value={`${event.startDate ? formatShortDate(event.startDate) : "Now"} – ${event.endDate ? formatShortDate(event.endDate) : "Until spots last"}`}
                />
              )}
              {totalCapacity > 0 && (
                <InfoRow
                  icon={Users}
                  label="Spots"
                  value={`${Math.max(totalCapacity - totalSold, 0)} of ${totalCapacity} remaining`}
                />
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

            {event.rules && event.rules.length > 0 && (
              <div className="pt-2 border-t border-[#ececec]">
                <ExpandSection
                  title={
                    <span className="inline-flex items-center gap-2">
                      <ShieldCheck size={15} className="text-[#5b4fe5]" /> Rules
                      &amp; Regulations
                    </span>
                  }
                >
                  <ol className="space-y-2 text-sm text-[#68686e] list-decimal list-inside leading-relaxed">
                    {event.rules.map((rule, idx) => (
                      <li key={idx}>{rule}</li>
                    ))}
                  </ol>
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
          </div>

          {/* RIGHT: sticky ticket/registration card */}
          <div className="lg:sticky lg:top-6">
            <form
              onSubmit={onSubmit}
              className="bg-white rounded-3xl shadow-[0_20px_50px_-20px_rgba(23,23,26,0.2)] border border-[#ececec] p-6 sm:p-7 space-y-6"
            >
              {!isEventOpen && (
                <div className="p-3.5 rounded-2xl bg-[#fef2f2] text-[#c0392b] text-xs font-medium flex items-center gap-2.5">
                  <Lock size={16} className="shrink-0" />
                  <span>
                    {availability === "upcoming" ? (
                      <>Opens {formatShortDate(event.startDate)}</>
                    ) : (
                      <>Registrations are closed</>
                    )}
                  </span>
                </div>
              )}

              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-[#9a9aa2] mb-3 flex items-center gap-1.5">
                  <Ticket size={13} /> Select your pass
                </label>
                <div className="space-y-2.5">
                  {event.tickets.map((tkt) => {
                    const sold = claims[tkt.id] || 0;
                    const stockLeft = tkt.capacity ? tkt.capacity - sold : null;
                    const isSoldOut = stockLeft !== null && stockLeft <= 0;
                    const isSelected = selectedTicketId === tkt.id;
                    return (
                      <label
                        key={tkt.id}
                        className={`flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all duration-200 ${
                          isSoldOut || !isEventOpen
                            ? "cursor-not-allowed opacity-40 bg-[#f7f7f8] border-transparent"
                            : isSelected
                              ? "border-[#5b4fe5] bg-[#f2f1fb] cursor-pointer"
                              : "border-[#ececec] hover:border-[#c9c4f7] cursor-pointer"
                        }`}
                      >
                        <div className="flex items-center gap-3">
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
                              <div className="text-[10px] font-bold text-[#c9820a] mt-0.5">
                                {stockLeft} left
                              </div>
                            )}
                            {isSoldOut && (
                              <div className="text-[10px] font-bold text-[#c0392b] mt-0.5">
                                Sold out
                              </div>
                            )}
                          </div>
                        </div>
                        <span className="text-sm font-bold text-[#17171a] shrink-0">
                          {tkt.price === 0 ? "Free" : `₹${tkt.price}`}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4 pt-2 border-t border-[#ececec]">
                {customerFields.map((field) => (
                  <div key={field.id}>
                    <label className="block text-xs font-bold text-[#17171a] mb-1.5">
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
                        className="w-full rounded-xl border border-[#e2e2e5] px-3.5 py-2.5 text-sm outline-none focus:border-[#5b4fe5] focus:ring-4 focus:ring-[#5b4fe5]/10 bg-[#fafafa] focus:bg-white transition-all"
                      />
                    )}

                    {field.type === "phone" && (
                      <div className="flex rounded-xl border border-[#e2e2e5] overflow-hidden focus-within:border-[#5b4fe5] focus-within:ring-4 focus-within:ring-[#5b4fe5]/10 bg-[#fafafa] focus-within:bg-white transition-all">
                        <span className="flex items-center px-3 text-xs font-bold text-[#9a9aa2] border-r border-[#e2e2e5]">
                          +91
                        </span>
                        <input
                          type="tel"
                          disabled={!isEventOpen}
                          required={field.required}
                          placeholder={field.placeholder ?? "98765 43210"}
                          value={(values[field.id] as string) ?? ""}
                          onChange={(e) => setValue(field.id, e.target.value)}
                          className="w-full px-3.5 py-2.5 text-sm outline-none bg-transparent"
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
                        className="w-full rounded-xl border border-[#e2e2e5] px-3.5 py-2.5 text-sm outline-none focus:border-[#5b4fe5] focus:ring-4 focus:ring-[#5b4fe5]/10 bg-[#fafafa] focus:bg-white transition-all"
                      />
                    )}

                    {field.type === "select" && (
                      <select
                        disabled={!isEventOpen}
                        required={field.required}
                        value={(values[field.id] as string) ?? ""}
                        onChange={(e) => setValue(field.id, e.target.value)}
                        className="w-full rounded-xl border border-[#e2e2e5] px-3.5 py-2.5 text-sm outline-none focus:border-[#5b4fe5] bg-[#fafafa] cursor-pointer"
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
                      <div className="space-y-2 mt-1">
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
                              className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-xs transition-colors cursor-pointer ${
                                checked
                                  ? "border-[#5b4fe5] bg-[#f2f1fb] text-[#17171a] font-bold"
                                  : "border-[#e2e2e5] hover:border-[#c9c4f7]"
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
                        <label className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#e2e2e5] p-3.5 text-xs font-medium text-[#68686e] cursor-pointer hover:border-[#5b4fe5]/50 hover:bg-[#f2f1fb] bg-[#fafafa] transition-colors">
                          <Upload size={15} className="text-[#5b4fe5]" />
                          <span className="truncate">
                            {photoPreviews[field.id]?.name ??
                              "Upload PNG/JPEG, max 50KB"}
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
                          <p className="mt-1.5 text-[10px] font-semibold text-[#c0392b] flex items-center gap-1">
                            <AlertCircle size={11} className="shrink-0" />{" "}
                            {fileErrors[field.id]}
                          </p>
                        )}
                        {photoPreviews[field.id] && !fileErrors[field.id] && (
                          <div className="mt-2 relative inline-block">
                            <img
                              src={photoPreviews[field.id].preview}
                              alt="Preview"
                              className="h-14 w-14 rounded-lg object-cover border border-[#e2e2e5]"
                            />
                            <button
                              type="button"
                              onClick={() => removeSelectedFile(field.id)}
                              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#17171a] text-white flex items-center justify-center cursor-pointer hover:bg-[#c0392b] transition-colors"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer select-none pt-2 border-t border-[#ececec]">
                <input
                  type="checkbox"
                  disabled={!isEventOpen}
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-[#5b4fe5] cursor-pointer"
                />
                <span className="text-[11px] text-[#68686e] leading-relaxed">
                  I agree to the event{" "}
                  <strong className="text-[#17171a]">Rules</strong>,{" "}
                  <strong className="text-[#17171a]">Terms</strong> and{" "}
                  <strong className="text-[#17171a]">Privacy Policy</strong>.
                </span>
              </label>

              {error && (
                <div className="p-3 bg-[#fef2f2] text-[#c0392b] text-xs font-semibold rounded-xl flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" /> {error}
                </div>
              )}

              <div className="pt-2 border-t border-[#ececec] flex items-center justify-between">
                <span className="text-xs font-medium text-[#9a9aa2]">
                  Total
                </span>
                <span className="text-xl font-bold text-[#17171a]">
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
                className="w-full rounded-2xl bg-[#5b4fe5] hover:bg-[#4a3fd1] active:bg-[#4038b8] transition-colors duration-200 text-white font-bold py-3.5 text-sm shadow-[0_10px_25px_-8px_rgba(91,79,229,0.6)] disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Processing…
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
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
