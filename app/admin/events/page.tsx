"use client";

import { useEffect, useState, useRef } from "react";
import AdminAuthGuard from "@/components/AdminAuthGuard";
import {
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Type,
  AlignLeft,
  Hash,
  Phone,
  Mail,
  Calendar,
  List,
  CircleDot,
  CheckSquare,
  UploadCloud,
  Ticket,
  FileText,
  Eye,
  Check,
  MapPin,
  Building,
  Loader2,
  ShieldAlert,
  Power,
  Clock,
  AlertCircle,
} from "lucide-react";
import {
  getEvents,
  saveEvent,
  createEvent,
  deleteEvent,
  uploadEventCoverPhoto,
} from "@/lib/events-store";
import {
  newField,
  newTicket,
  type EventDef,
  type FieldDef,
  type FieldType,
  type TicketTier,
  type EventStatus,
} from "@/lib/event-schema";

const FIELD_META: Record<
  FieldType,
  { label: string; icon: React.ElementType }
> = {
  text: { label: "Short text", icon: Type },
  textarea: { label: "Paragraph text", icon: AlignLeft },
  number: { label: "Number", icon: Hash },
  phone: { label: "Phone", icon: Phone },
  email: { label: "Email", icon: Mail },
  date: { label: "Date", icon: Calendar },
  select: { label: "Dropdown", icon: List },
  radio: { label: "Single choice (Radio)", icon: CircleDot },
  "checkbox-group": { label: "Checkboxes (Multiple)", icon: CheckSquare },
  file: { label: "File upload", icon: UploadCloud },
};

export default function AdminEventsPage() {
  const [events, setEvents] = useState<EventDef[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EventDef | null>(null);
  const [activeTab, setActiveTab] = useState<
    "details" | "tickets" | "form" | "policies" | "preview"
  >("details");
  const [newTitle, setNewTitle] = useState("");
  const [dateError, setDateError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const nowIsoString = new Date().toISOString().slice(0, 16);

  // Date Picker Refs
  const regStartRef = useRef<HTMLInputElement>(null);
  const regEndRef = useRef<HTMLInputElement>(null);
  const eventStartRef = useRef<HTMLInputElement>(null);
  const eventEndRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedStatus, setSavedStatus] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    getEvents().then((all) => {
      setEvents(all);
      if (all.length > 0) setSelectedId(all[0].id);
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setDraft(null);
      return;
    }
    const found = events.find((e) => e.id === selectedId);
    if (found) {
      setDraft(structuredClone(found));
    }
  }, [selectedId, events]);

  const refresh = async () => {
    const all = await getEvents();
    setEvents(all);
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    setIsSaving(true);
    const ev = await createEvent(newTitle.trim());
    setNewTitle("");
    await refresh();
    setSelectedId(ev.id);
    setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this event? This action cannot be undone.",
      )
    )
      return;
    setIsSaving(true);
    try {
      await deleteEvent(id);
      await refresh();
      setSelectedId(null);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to delete event.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (!draft) return;
    setDateError(null);
    setSaveError(null);

    if (
      draft.startDate &&
      draft.endDate &&
      new Date(draft.endDate) < new Date(draft.startDate)
    ) {
      setDateError(
        "Registration End Date cannot be earlier than Registration Start Date.",
      );
      setActiveTab("details");
      return;
    }

    setIsSaving(true);
    try {
      await saveEvent(draft);
      await refresh();
      setSavedStatus(true);
      setTimeout(() => setSavedStatus(false), 2000);
    } catch (err: any) {
      console.error(err);
      setSaveError(
        err.message || "Something went wrong while saving. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  // --- Ticket Helpers ---
  const addTicket = () => {
    if (!draft) return;
    setDraft({ ...draft, tickets: [...draft.tickets, newTicket()] });
  };

  const updateTicket = (id: string, patch: Partial<TicketTier>) => {
    if (!draft) return;
    setDraft({
      ...draft,
      tickets: draft.tickets.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    });
  };

  const removeTicket = (id: string) => {
    if (!draft || draft.tickets.length <= 1) {
      alert("An event must have at least one ticket tier.");
      return;
    }
    setDraft({ ...draft, tickets: draft.tickets.filter((t) => t.id !== id) });
  };

  // --- Question Helpers ---
  const addFormField = (type: FieldType) => {
    if (!draft) return;
    setDraft({ ...draft, fields: [...draft.fields, newField(type)] });
  };

  const updateFormField = (id: string, patch: Partial<FieldDef>) => {
    if (!draft) return;
    setDraft({
      ...draft,
      fields: draft.fields.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    });
  };

  const removeFormField = (id: string) => {
    if (!draft) return;
    setDraft({ ...draft, fields: draft.fields.filter((f) => f.id !== id) });
  };

  const moveFormField = (index: number, direction: "up" | "down") => {
    if (!draft) return;
    const newFields = [...draft.fields];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newFields.length) return;
    const temp = newFields[index];
    newFields[index] = newFields[targetIdx];
    newFields[targetIdx] = temp;
    setDraft({ ...draft, fields: newFields });
  };

  // --- Rules Helpers ---
  const addRule = () => {
    if (!draft) return;
    setDraft({ ...draft, rules: [...(draft.rules || []), ""] });
  };

  const updateRule = (idx: number, val: string) => {
    if (!draft) return;
    const newRules = [...(draft.rules || [])];
    newRules[idx] = val;
    setDraft({ ...draft, rules: newRules });
  };

  const removeRule = (idx: number) => {
    if (!draft) return;
    setDraft({ ...draft, rules: draft.rules.filter((_, i) => i !== idx) });
  };

  return (
    <AdminAuthGuard>
      <main className="min-h-screen bg-slate-100 text-slate-800 pb-20 font-sans">
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shadow-xs">
          {saveError && (
            <div className="mx-6 mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-lg flex items-center gap-2">
              <AlertCircle size={16} /> {saveError}
            </div>
          )}
          <div className="flex items-center gap-3">
            <a
              href="/admin"
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition cursor-pointer"
            >
              <ArrowLeft size={18} />
            </a>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 leading-none">
                  {draft ? draft.title : "Event Form Builder"}
                </h1>
                {draft && (
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      draft.status === "active"
                        ? "bg-emerald-100 text-emerald-800"
                        : draft.status === "closed"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {draft.status}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Configure status, registration timeline, actual event schedule
                &amp; tickets
              </p>
            </div>
          </div>

          {draft && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDelete(draft.id)}
                disabled={isSaving}
                className="text-xs font-semibold text-rose-600 hover:bg-rose-50 px-3 py-2 rounded-lg transition cursor-pointer disabled:opacity-50"
              >
                Delete Event
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition shadow-sm cursor-pointer ${
                  savedStatus
                    ? "bg-emerald-600 text-white"
                    : "bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-70"
                }`}
              >
                {isSaving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Saving...
                  </>
                ) : savedStatus ? (
                  <>
                    <Check size={14} /> Saved!
                  </>
                ) : (
                  <>
                    <Save size={14} /> Save Changes
                  </>
                )}
              </button>
            </div>
          )}
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grid lg:grid-cols-[280px_1fr] gap-6 items-start">
          {/* Left Sidebar */}
          <aside className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                All Events
              </span>
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                {events.length}
              </span>
            </div>

            <div className="flex gap-2">
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder="New event name..."
                className="w-full text-xs rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500"
              />
              <button
                onClick={handleCreate}
                disabled={isSaving}
                className="bg-slate-900 hover:bg-black text-white px-3 rounded-lg flex items-center justify-center cursor-pointer"
              >
                <Plus size={14} />
              </button>
            </div>

            <div className="space-y-1 max-h-[65vh] overflow-y-auto pr-1">
              {isLoading ? (
                <div className="flex items-center justify-center py-8 text-xs text-slate-400 gap-2">
                  <Loader2 size={16} className="animate-spin" /> Loading...
                </div>
              ) : (
                events.map((ev) => (
                  <button
                    key={ev.id}
                    onClick={() => setSelectedId(ev.id)}
                    className={`w-full text-left p-3 rounded-lg text-xs transition border cursor-pointer ${
                      selectedId === ev.id
                        ? "border-blue-500 bg-blue-50/70 text-blue-950 font-semibold"
                        : "border-transparent text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate text-sm">{ev.title}</span>
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          ev.status === "active"
                            ? "bg-emerald-500"
                            : ev.status === "closed"
                              ? "bg-rose-500"
                              : "bg-slate-400"
                        }`}
                      />
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                      /register/{ev.id}
                    </div>
                  </button>
                ))
              )}
            </div>
          </aside>

          {/* Right Editor Area */}
          {draft ? (
            <div className="space-y-4">
              {/* Tab Navigation */}
              <div className="bg-white border border-slate-200 rounded-xl p-1.5 flex gap-1 shadow-sm overflow-x-auto">
                <button
                  onClick={() => setActiveTab("details")}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 whitespace-nowrap transition cursor-pointer ${
                    activeTab === "details"
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Building size={14} /> 1. Overview &amp; Status
                </button>
                <button
                  onClick={() => setActiveTab("tickets")}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 whitespace-nowrap transition cursor-pointer ${
                    activeTab === "tickets"
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Ticket size={14} /> 2. Passes ({draft.tickets.length})
                </button>
                <button
                  onClick={() => setActiveTab("form")}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 whitespace-nowrap transition cursor-pointer ${
                    activeTab === "form"
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <FileText size={14} /> 3. Questions ({draft.fields.length})
                </button>
                <button
                  onClick={() => setActiveTab("policies")}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 whitespace-nowrap transition cursor-pointer ${
                    activeTab === "policies"
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <ShieldAlert size={14} /> 4. Rules &amp; Policies
                </button>
                <button
                  onClick={() => setActiveTab("preview")}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 whitespace-nowrap transition cursor-pointer ${
                    activeTab === "preview"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Eye size={14} /> Live Preview
                </button>
              </div>

              {/* TAB 1: OVERVIEW & STATUS */}
              {activeTab === "details" && (
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
                  {/* Event Status Selector Card */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-slate-700">
                        <Power
                          size={20}
                          className={
                            draft.status === "active"
                              ? "text-emerald-600"
                              : draft.status === "closed"
                                ? "text-rose-600"
                                : "text-slate-400"
                          }
                        />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          Event Publication Status
                        </h3>
                        <p className="text-xs text-slate-500">
                          Control registration availability on the public
                          portal.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200">
                      {(["active", "draft", "closed"] as EventStatus[]).map(
                        (st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setDraft({ ...draft, status: st })}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold capitalize transition cursor-pointer ${
                              draft.status === st
                                ? st === "active"
                                  ? "bg-emerald-600 text-white shadow-xs"
                                  : st === "closed"
                                    ? "bg-rose-600 text-white shadow-xs"
                                    : "bg-slate-800 text-white shadow-xs"
                                : "text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            {st === "active"
                              ? "● Active"
                              : st === "closed"
                                ? "■ Closed"
                                : "Draft"}
                          </button>
                        ),
                      )}
                    </div>
                  </div>

                  {dateError && (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                      <AlertCircle size={16} /> {dateError}
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Event Title
                      </label>
                      <input
                        value={draft.title}
                        onChange={(e) =>
                          setDraft({ ...draft, title: e.target.value })
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Description / Summary
                      </label>
                      <textarea
                        rows={3}
                        value={draft.description ?? ""}
                        onChange={(e) =>
                          setDraft({ ...draft, description: e.target.value })
                        }
                        placeholder="Overview of the event..."
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Event Cover Photo */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Event Cover Photo
                      </label>
                      <div className="flex items-start gap-4">
                        <div className="w-40 h-24 rounded-lg border border-slate-300 bg-slate-50 overflow-hidden flex items-center justify-center shrink-0">
                          {draft.photoUrl ? (
                            <img
                              src={draft.photoUrl}
                              alt="Event cover"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-[10px] text-slate-400 text-center px-2">
                              No photo uploaded
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <label className="inline-flex items-center gap-2 text-xs font-semibold bg-white border border-slate-300 hover:border-blue-500 px-3 py-2 rounded-lg cursor-pointer transition">
                            {isUploadingPhoto ? (
                              <>
                                <Loader2 size={14} className="animate-spin" />{" "}
                                Uploading...
                              </>
                            ) : (
                              <>Choose Photo</>
                            )}
                            <input
                              type="file"
                              accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                              className="hidden"
                              disabled={isUploadingPhoto}
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file || !draft) return;
                                setPhotoError(null);
                                setIsUploadingPhoto(true);
                                try {
                                  const url = await uploadEventCoverPhoto(
                                    file,
                                    draft.id,
                                  );
                                  setDraft({ ...draft, photoUrl: url });
                                } catch (err: any) {
                                  setPhotoError(
                                    err.message || "Failed to upload photo.",
                                  );
                                } finally {
                                  setIsUploadingPhoto(false);
                                  e.target.value = "";
                                }
                              }}
                            />
                          </label>
                          <p className="text-[11px] text-slate-400 mt-1.5">
                            PNG or JPEG, up to 2MB. Recommended 16:9 (e.g.
                            1280×720).
                          </p>
                          {photoError && (
                            <p className="text-[11px] font-semibold text-rose-600 mt-1">
                              {photoError}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* SECTION A: FORM REGISTRATION WINDOW */}
                    <div className="sm:col-span-2 bg-blue-50/50 border border-blue-100 p-4 rounded-xl space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900">
                        1. Form Registration Window (When signups are open)
                      </h4>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Registration Opens At
                          </label>
                          <div
                            onClick={() =>
                              regStartRef.current?.showPicker
                                ? regStartRef.current.showPicker()
                                : regStartRef.current?.focus()
                            }
                            className="flex items-center justify-between border border-slate-300 rounded-lg px-3 py-2 bg-white hover:border-blue-400 focus-within:border-blue-500 cursor-pointer transition shadow-2xs"
                          >
                            <input
                              ref={regStartRef}
                              type="datetime-local"
                              value={draft.startDate}
                              onChange={(e) =>
                                setDraft({
                                  ...draft,
                                  startDate: e.target.value,
                                })
                              }
                              className="w-full text-xs text-slate-800 outline-none bg-transparent cursor-pointer font-medium"
                            />
                            <Calendar
                              size={15}
                              className="text-slate-400 shrink-0 pointer-events-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Registration Closes At
                          </label>
                          <div
                            onClick={() =>
                              regEndRef.current?.showPicker
                                ? regEndRef.current.showPicker()
                                : regEndRef.current?.focus()
                            }
                            className="flex items-center justify-between border border-slate-300 rounded-lg px-3 py-2 bg-white hover:border-blue-400 focus-within:border-blue-500 cursor-pointer transition shadow-2xs"
                          >
                            <input
                              ref={regEndRef}
                              type="datetime-local"
                              value={draft.endDate}
                              onChange={(e) =>
                                setDraft({ ...draft, endDate: e.target.value })
                              }
                              className="w-full text-xs text-slate-800 outline-none bg-transparent cursor-pointer font-medium"
                            />
                            <Clock
                              size={15}
                              className="text-slate-400 shrink-0 pointer-events-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SECTION B: ACTUAL EVENT SCHEDULE */}
                    <div className="sm:col-span-2 bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        2. Event Occurrence Schedule (When the event takes
                        place)
                      </h4>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Event Start Date &amp; Time
                          </label>
                          <div
                            onClick={() =>
                              eventStartRef.current?.showPicker
                                ? eventStartRef.current.showPicker()
                                : eventStartRef.current?.focus()
                            }
                            className="flex items-center justify-between border border-slate-300 rounded-lg px-3 py-2 bg-white hover:border-blue-400 focus-within:border-blue-500 cursor-pointer transition shadow-2xs"
                          >
                            <input
                              ref={eventStartRef}
                              type="datetime-local"
                              value={draft.eventStartDate ?? ""}
                              onChange={(e) =>
                                setDraft({
                                  ...draft,
                                  eventStartDate: e.target.value,
                                })
                              }
                              className="w-full text-xs text-slate-800 outline-none bg-transparent cursor-pointer font-medium"
                            />
                            <Calendar
                              size={15}
                              className="text-slate-400 shrink-0 pointer-events-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Event End Date &amp; Time
                          </label>
                          <div
                            onClick={() =>
                              eventEndRef.current?.showPicker
                                ? eventEndRef.current.showPicker()
                                : eventEndRef.current?.focus()
                            }
                            className="flex items-center justify-between border border-slate-300 rounded-lg px-3 py-2 bg-white hover:border-blue-400 focus-within:border-blue-500 cursor-pointer transition shadow-2xs"
                          >
                            <input
                              ref={eventEndRef}
                              type="datetime-local"
                              value={draft.eventEndDate ?? ""}
                              onChange={(e) =>
                                setDraft({
                                  ...draft,
                                  eventEndDate: e.target.value,
                                })
                              }
                              className="w-full text-xs text-slate-800 outline-none bg-transparent cursor-pointer font-medium"
                            />
                            <Clock
                              size={15}
                              className="text-slate-400 shrink-0 pointer-events-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Venue Address
                      </label>
                      <input
                        value={draft.address}
                        placeholder="e.g. Rilbong Maidan, Shillong"
                        onChange={(e) =>
                          setDraft({ ...draft, address: e.target.value })
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Contact Email
                      </label>
                      <input
                        type="email"
                        value={draft.contactEmail}
                        onChange={(e) =>
                          setDraft({ ...draft, contactEmail: e.target.value })
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Contact Phone
                      </label>
                      <input
                        type="tel"
                        value={draft.contactPhone}
                        onChange={(e) =>
                          setDraft({ ...draft, contactPhone: e.target.value })
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: TICKETS */}
              {activeTab === "tickets" && (
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        Tickets &amp; Passes
                      </h2>
                      <p className="text-xs text-slate-500">
                        Configure entry prices, participant tiers, and spot
                        limits.
                      </p>
                    </div>
                    <button
                      onClick={addTicket}
                      className="inline-flex items-center gap-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg shadow-sm transition cursor-pointer"
                    >
                      <Plus size={14} /> Add Pass
                    </button>
                  </div>

                  <div className="space-y-4">
                    {draft.tickets.map((tkt, idx) => (
                      <div
                        key={tkt.id}
                        className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Tier #{idx + 1}
                          </span>
                          {draft.tickets.length > 1 && (
                            <button
                              onClick={() => removeTicket(tkt.id)}
                              className="text-slate-400 hover:text-rose-600 cursor-pointer"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>

                        <div className="grid sm:grid-cols-[1fr_140px_140px] gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Ticket Name
                            </label>
                            <input
                              value={tkt.name}
                              onChange={(e) =>
                                updateTicket(tkt.id, { name: e.target.value })
                              }
                              className="w-full bg-white rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Price (₹)
                            </label>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                                ₹
                              </span>
                              <input
                                type="number"
                                value={tkt.price}
                                onChange={(e) =>
                                  updateTicket(tkt.id, {
                                    price: Math.max(0, Number(e.target.value)),
                                  })
                                }
                                className="w-full bg-white rounded-lg border border-slate-300 pl-6 pr-3 py-1.5 text-sm outline-none focus:border-blue-500"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                              Capacity Cap
                            </label>
                            <input
                              type="number"
                              value={tkt.capacity ?? ""}
                              onChange={(e) =>
                                updateTicket(tkt.id, {
                                  capacity: e.target.value
                                    ? Number(e.target.value)
                                    : undefined,
                                })
                              }
                              placeholder="Unlimited"
                              className="w-full bg-white rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>

                        <input
                          value={tkt.description ?? ""}
                          onChange={(e) =>
                            updateTicket(tkt.id, {
                              description: e.target.value,
                            })
                          }
                          placeholder="Optional short perk summary"
                          className="w-full bg-transparent border-b border-dashed border-slate-300 px-1 py-1 text-xs text-slate-600 outline-none focus:border-blue-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: QUESTIONS */}
              {activeTab === "form" && (
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Custom Questions
                    </h2>
                    <p className="text-xs text-slate-500">
                      Collect participant responses (dietary, size, emergency
                      contacts).
                    </p>
                  </div>

                  <div className="space-y-4">
                    {draft.fields.map((field, idx) => {
                      const Icon = FIELD_META[field.type]?.icon || Type;
                      const hasOpts = [
                        "select",
                        "radio",
                        "checkbox-group",
                      ].includes(field.type);

                      return (
                        <div
                          key={field.id}
                          className="border border-slate-200 rounded-xl p-5 bg-white space-y-4 shadow-xs"
                        >
                          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-400">
                                Q{idx + 1}
                              </span>
                              <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded flex items-center gap-1">
                                <Icon size={12} />{" "}
                                {FIELD_META[field.type]?.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => moveFormField(idx, "up")}
                                disabled={idx === 0}
                                className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-20 cursor-pointer"
                              >
                                <ArrowUp size={15} />
                              </button>
                              <button
                                onClick={() => moveFormField(idx, "down")}
                                disabled={idx === draft.fields.length - 1}
                                className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-20 cursor-pointer"
                              >
                                <ArrowDown size={15} />
                              </button>
                              <div className="w-px h-4 bg-slate-200 mx-1" />
                              <button
                                onClick={() => removeFormField(field.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>

                          <div className="grid sm:grid-cols-[1fr_200px] gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-1">
                                Question Title
                              </label>
                              <input
                                value={field.label}
                                onChange={(e) =>
                                  updateFormField(field.id, {
                                    label: e.target.value,
                                  })
                                }
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500 font-medium"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-1">
                                Response Type
                              </label>
                              <select
                                value={field.type}
                                onChange={(e) => {
                                  const t = e.target.value as FieldType;
                                  updateFormField(field.id, {
                                    type: t,
                                    options: [
                                      "select",
                                      "radio",
                                      "checkbox-group",
                                    ].includes(t)
                                      ? (field.options ?? [
                                          { id: "opt1", label: "Option 1" },
                                        ])
                                      : undefined,
                                  });
                                }}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs outline-none focus:border-blue-500 bg-white cursor-pointer"
                              >
                                {Object.entries(FIELD_META).map(
                                  ([val, meta]) => (
                                    <option key={val} value={val}>
                                      {meta.label}
                                    </option>
                                  ),
                                )}
                              </select>
                            </div>
                          </div>

                          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 font-medium">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={(e) =>
                                updateFormField(field.id, {
                                  required: e.target.checked,
                                })
                              }
                              className="rounded text-blue-600 cursor-pointer"
                            />
                            Required Question
                          </label>

                          {hasOpts && (
                            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                                Choices
                              </span>
                              <div className="space-y-2">
                                {field.options?.map((opt, oIdx) => (
                                  <div
                                    key={opt.id}
                                    className="flex items-center gap-2"
                                  >
                                    <input
                                      value={opt.label}
                                      onChange={(e) => {
                                        const newOpts = [
                                          ...(field.options || []),
                                        ];
                                        newOpts[oIdx] = {
                                          ...opt,
                                          label: e.target.value,
                                        };
                                        updateFormField(field.id, {
                                          options: newOpts,
                                        });
                                      }}
                                      className="flex-1 bg-white border border-slate-300 rounded px-2.5 py-1 text-xs outline-none focus:border-blue-500"
                                    />
                                    <button
                                      onClick={() => {
                                        const newOpts = field.options?.filter(
                                          (o) => o.id !== opt.id,
                                        );
                                        updateFormField(field.id, {
                                          options: newOpts,
                                        });
                                      }}
                                      className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                              <button
                                onClick={() => {
                                  const newOpts = [
                                    ...(field.options || []),
                                    {
                                      id: `opt_${Date.now()}`,
                                      label: `Option ${(field.options?.length || 0) + 1}`,
                                    },
                                  ];
                                  updateFormField(field.id, {
                                    options: newOpts,
                                  });
                                }}
                                className="text-xs font-semibold text-blue-600 hover:underline pt-1 inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Plus size={12} /> Add another choice
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t border-slate-100 pt-6">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">
                      Add question type
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(FIELD_META).map(([val, meta]) => {
                        const Icon = meta.icon;
                        return (
                          <button
                            key={val}
                            onClick={() => addFormField(val as FieldType)}
                            className="inline-flex items-center gap-1.5 border border-slate-200 hover:border-blue-500 hover:bg-blue-50 bg-white px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 transition cursor-pointer"
                          >
                            <Icon size={13} /> {meta.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: RULES & POLICIES */}
              {activeTab === "policies" && (
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-base font-bold text-slate-900">
                          Event Rules &amp; Regulations
                        </h2>
                        <p className="text-xs text-slate-500">
                          List specific rules shown prominently to attendees on
                          the registration page.
                        </p>
                      </div>
                      <button
                        onClick={addRule}
                        className="inline-flex items-center gap-1.5 text-xs font-bold bg-slate-900 hover:bg-black text-white px-3 py-2 rounded-lg shadow-sm transition cursor-pointer"
                      >
                        <Plus size={14} /> Add Rule
                      </button>
                    </div>

                    <div className="space-y-2">
                      {!draft.rules || draft.rules.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-2">
                          No specific event rules added yet.
                        </p>
                      ) : (
                        draft.rules.map((rule, rIdx) => (
                          <div key={rIdx} className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-400 w-6">
                              #{rIdx + 1}
                            </span>
                            <input
                              value={rule}
                              onChange={(e) => updateRule(rIdx, e.target.value)}
                              placeholder="e.g. Participants must carry a valid photo ID"
                              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                            />
                            <button
                              onClick={() => removeRule(rIdx)}
                              className="p-2 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="h-px bg-slate-200" />

                  <div className="space-y-5">
                    <div>
                      <h2 className="text-base font-bold text-slate-900">
                        Legal &amp; Compliance Policies
                      </h2>
                      <p className="text-xs text-slate-500">
                        Default clauses are filled in automatically.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Terms &amp; Conditions
                        </label>
                        <textarea
                          rows={3}
                          value={draft.termsAndConditions ?? ""}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              termsAndConditions: e.target.value,
                            })
                          }
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Privacy Policy
                        </label>
                        <textarea
                          rows={3}
                          value={draft.privacyPolicy ?? ""}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              privacyPolicy: e.target.value,
                            })
                          }
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Refund &amp; Cancellation Policy
                        </label>
                        <textarea
                          rows={3}
                          value={draft.refundPolicy ?? ""}
                          onChange={(e) =>
                            setDraft({ ...draft, refundPolicy: e.target.value })
                          }
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs outline-none focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Shipping &amp; Delivery Policy
                        </label>
                        <textarea
                          rows={3}
                          value={draft.shippingPolicy ?? ""}
                          onChange={(e) =>
                            setDraft({
                              ...draft,
                              shippingPolicy: e.target.value,
                            })
                          }
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: PREVIEW */}
              {activeTab === "preview" && (
                <div className="bg-slate-50 border border-slate-300 rounded-2xl p-6 sm:p-10 shadow-inner">
                  <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
                    <div className="bg-slate-900 text-white p-6 sm:p-8">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                          {draft.org || "Event Portal"}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            draft.status === "active"
                              ? "bg-emerald-500 text-white"
                              : draft.status === "closed"
                                ? "bg-rose-500 text-white"
                                : "bg-slate-700 text-slate-300"
                          }`}
                        >
                          {draft.status}
                        </span>
                      </div>
                      <h1 className="text-2xl font-bold mt-1 text-white">
                        {draft.title || "Untitled Event"}
                      </h1>
                    </div>

                    <div className="p-6 sm:p-8 space-y-6">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 mb-3">
                          1. Select Pass
                        </h3>
                        <div className="space-y-2">
                          {draft.tickets.map((tkt, idx) => (
                            <label
                              key={tkt.id}
                              className="flex items-center justify-between p-3.5 border rounded-xl cursor-pointer"
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="radio"
                                  name="preview_tkt"
                                  defaultChecked={idx === 0}
                                  className="text-blue-600 cursor-pointer"
                                />
                                <div className="text-sm font-semibold">
                                  {tkt.name}
                                </div>
                              </div>
                              <span className="text-sm font-bold">
                                {tkt.price === 0 ? "Free" : `₹${tkt.price}`}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="pt-4 border-t">
                        <label className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer">
                          <input
                            type="checkbox"
                            defaultChecked
                            className="mt-0.5 rounded text-blue-600 cursor-pointer"
                          />
                          <span>
                            I accept the Event Rules, Terms &amp; Conditions,
                            and Privacy Policy.
                          </span>
                        </label>
                      </div>

                      <button
                        disabled
                        className="w-full bg-blue-600 opacity-60 text-white font-bold py-3 rounded-xl text-sm"
                      >
                        {draft.status === "closed"
                          ? "Registrations Closed"
                          : draft.status === "draft"
                            ? "Draft Mode (Hidden)"
                            : "Register Now"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-96 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400">
              <Ticket size={40} className="mb-2 opacity-30" />
              <p className="text-sm font-medium">
                Select an event from the sidebar or create a new one.
              </p>
            </div>
          )}
        </div>
      </main>
    </AdminAuthGuard>
  );
}
