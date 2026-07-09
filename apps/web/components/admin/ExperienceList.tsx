"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical, Pencil, Trash2, Plus,
  CheckCircle2, AlertCircle, Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { adminClient } from "@/lib/admin-api";
import { formatDateShort } from "@/lib/utils";
import type { Experience } from "@/lib/server-api";
import { ExperienceEditor } from "./ExperienceEditor";

// ─── Sortable row ─────────────────────────────────────────────────────────────

function SortableRow({
  exp,
  onEdit,
  onDelete,
}: {
  exp: Experience;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: exp.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  const dateRange = exp.isCurrent
    ? `${formatDateShort(exp.startDate)} — Present`
    : `${formatDateShort(exp.startDate)} — ${exp.endDate ? formatDateShort(exp.endDate) : ""}`;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-5"
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        type="button"
        aria-label="Drag to reorder"
        className="mt-0.5 flex-shrink-0 cursor-grab touch-none text-slate-300 hover:text-slate-500 active:cursor-grabbing"
      >
        <GripVertical className="h-5 w-5" />
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-semibold text-slate-900">{exp.role}</h2>
          {exp.isCurrent && <Badge variant="green">Present</Badge>}
        </div>
        <p className="text-sm text-blue-600">{exp.company}</p>
        <p className="text-xs text-slate-500">
          {exp.location ? `${exp.location} · ` : ""}{dateRange}
        </p>
        {exp.summary && (
          <p className="mt-2 text-sm text-slate-600 line-clamp-2">{exp.summary}</p>
        )}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {exp.technologies.slice(0, 6).map((tech) => (
            <Badge key={tech} variant="gray">{tech}</Badge>
          ))}
          {exp.technologies.length > 6 && (
            <Badge variant="gray">+{exp.technologies.length - 6}</Badge>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={onEdit}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Edit"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
          aria-label="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Main list ────────────────────────────────────────────────────────────────

type SaveState = "idle" | "saving" | "saved" | "error";

export function ExperienceList({ initialExperiences }: { initialExperiences: Experience[] }) {
  const [items, setItems] = useState(initialExperiences);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Experience | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // ── Drag to reorder ──────────────────────────────────────────────────────
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = items.findIndex((e) => e.id === active.id);
      const newIndex = items.findIndex((e) => e.id === over.id);
      const reordered = arrayMove(items, oldIndex, newIndex);

      setItems(reordered);
      setSaveState("saving");

      try {
        await adminClient.reorderExperiences(
          reordered.map((e, i) => ({ id: e.id, sortOrder: i }))
        );
        setSaveState("saved");
        setTimeout(() => setSaveState("idle"), 2500);
      } catch {
        setSaveState("error");
        setItems(items);
        setTimeout(() => setSaveState("idle"), 3000);
      }
    },
    [items]
  );

  // ── Open editor ───────────────────────────────────────────────────────────
  function openAdd() {
    setEditing(null);
    setEditorOpen(true);
  }

  function openEdit(exp: Experience) {
    setEditing(exp);
    setEditorOpen(true);
  }

  // ── Save callback from editor ─────────────────────────────────────────────
  function handleSaved(saved: Experience) {
    setItems((prev) => {
      const idx = prev.findIndex((e) => e.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved];
    });
    setEditorOpen(false);
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async function handleDelete(exp: Experience) {
    if (!confirm(`Delete "${exp.role} at ${exp.company}"? This cannot be undone.`)) return;
    try {
      await adminClient.deleteExperience(exp.id);
      setItems((prev) => prev.filter((e) => e.id !== exp.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete.");
    }
  }

  return (
    <>
      {/* Add button */}
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> Add Experience
        </button>
      </div>

      {/* Reorder status */}
      {saveState === "saving" && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm text-blue-700">
          <Loader2 className="h-4 w-4 animate-spin" /> Saving order…
        </div>
      )}
      {saveState === "saved" && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4" /> Order saved.
        </div>
      )}
      {saveState === "error" && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          <AlertCircle className="h-4 w-4" /> Failed to save order — reverted.
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center text-slate-400">
          No experience entries yet.{" "}
          <button type="button" onClick={openAdd} className="text-blue-600 hover:underline">
            Add one
          </button>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((e) => e.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {items.map((exp) => (
                <SortableRow
                  key={exp.id}
                  exp={exp}
                  onEdit={() => openEdit(exp)}
                  onDelete={() => handleDelete(exp)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Editor modal */}
      {editorOpen && (
        <ExperienceEditor
          experience={editing}
          onClose={() => setEditorOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
