"use client";

import { useState, useEffect, useRef } from "react";
import { useLifeAreas } from "@/lib/life-areas-context";
import { lifeAreasApi, LifeArea } from "@/lib/daymark-api";
import { useToast } from "@/components/ui/toast";
import { Tooltip } from "@/components/ui/tooltip";
import {
  X,
  Pencil,
  Trash2,
  GripVertical,
  Plus,
  AlertTriangle,
  Check,
  Loader2,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface LifeAreasManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Predefined color palette for life areas
const COLOR_OPTIONS = [
  { name: "Indigo", value: "#4F46E5" },
  { name: "Blue", value: "#3B82F6" },
  { name: "Green", value: "#22C55E" },
  { name: "Purple", value: "#8B5CF6" },
  { name: "Orange", value: "#F97316" },
  { name: "Pink", value: "#EC4899" },
  { name: "Teal", value: "#14B8A6" },
  { name: "Red", value: "#EF4444" },
];

interface PendingItemsCount {
  incompletePriorities: number;
  upcomingTimeBlocks: number;
  discussionItems: number;
  eisenhowerTasks: number;
}

interface DeleteConfirmationState {
  isOpen: boolean;
  lifeArea: LifeArea | null;
  pendingItems: PendingItemsCount | null;
  isLoading: boolean;
}

interface SortableLifeAreaItemProps {
  area: LifeArea;
  editingId: string | null;
  editName: string;
  setEditName: (v: string) => void;
  editColor: string | null;
  setEditColor: (v: string) => void;
  saveEdit: () => void;
  cancelEditing: () => void;
  startEditing: (area: LifeArea) => void;
  initiateDelete: (area: LifeArea) => void;
  canDelete: boolean;
  isSubmitting: boolean;
  editInputRef: React.RefObject<HTMLInputElement | null>;
}

function SortableItem({ area, editingId, editName, setEditName, editColor, setEditColor, saveEdit, cancelEditing, startEditing, initiateDelete, canDelete, isSubmitting, editInputRef }: SortableLifeAreaItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: area.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    boxShadow: isDragging ? '0 5px 15px rgba(0,0,0,0.1)' : 'none',
    zIndex: isDragging ? 1 : 0,
    position: isDragging ? 'relative' as const : 'static' as const,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-2 p-3 rounded-xl transition-colors ${isDragging
          ? 'bg-white dark:bg-gray-800 border-2 border-blue-500'
          : 'bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
    >
      {editingId === area.id ? (
        // Edit Mode
        <div className="flex-1 flex flex-col gap-2">
          <input
            ref={editInputRef}
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveEdit();
              if (e.key === "Escape") cancelEditing();
            }}
            className="flex-1 px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Life area name"
          />
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setEditColor(color.value)}
                  className={`w-5 h-5 rounded-full transition-all ${editColor === color.value
                      ? "ring-2 ring-offset-1 ring-gray-400 scale-110"
                      : "hover:scale-110"
                    }`}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                  type="button"
                />
              ))}
            </div>
            <div className="flex gap-1">
              <button
                onClick={cancelEditing}
                className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                disabled={!editName.trim() || isSubmitting}
                className="px-2 py-1 text-xs text-white bg-blue-500 hover:bg-blue-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                type="button"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Check className="w-3 h-3" />
                )}
                Save
              </button>
            </div>
          </div>
        </div>
      ) : (
        // View Mode
        <>
          <div
            {...attributes}
            {...listeners}
            className="text-gray-400 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none focus:opacity-100"
          >
            <GripVertical className="w-4 h-4" />
          </div>
          {area.color && (
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: area.color }}
            />
          )}
          <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white">
            {area.name}
          </span>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Tooltip content="Edit">
              <button
                onClick={() => startEditing(area)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-white dark:hover:bg-gray-700 rounded-md transition-colors"
                type="button"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
            <Tooltip content="Archive">
              <button
                onClick={() => initiateDelete(area)}
                disabled={!canDelete}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-white dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                type="button"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
          </div>
        </>
      )}
    </div>
  );
}

export function LifeAreasManagementModal({
  isOpen,
  onClose,
}: LifeAreasManagementModalProps) {
  const { lifeAreas, createLifeArea, updateLifeArea, archiveLifeArea, reorderLifeAreas } =
    useLifeAreas();
  const { addToast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = lifeAreas.findIndex((a) => a.id === active.id);
      const newIndex = lifeAreas.findIndex((a) => a.id === over.id);
      const newOrderIds = arrayMove(lifeAreas, oldIndex, newIndex).map(a => a.id);

      try {
        await reorderLifeAreas(newOrderIds);
      } catch (error) {
        addToast({
          type: "error",
          title: "Failed to update order",
        });
      }
    }
  };

  // State for editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState<string | null>(null);

  // State for creating new
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState<string>(COLOR_OPTIONS[0].value);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for delete confirmation
  const [deleteConfirmation, setDeleteConfirmation] =
    useState<DeleteConfirmationState>({
      isOpen: false,
      lifeArea: null,
      pendingItems: null,
      isLoading: false,
    });

  // Refs for input focus
  const editInputRef = useRef<HTMLInputElement>(null);
  const newInputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing or creating
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  useEffect(() => {
    if (isCreating && newInputRef.current) {
      newInputRef.current.focus();
    }
  }, [isCreating]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setEditingId(null);
      setEditName("");
      setEditColor(null);
      setIsCreating(false);
      setNewName("");
      setNewColor(COLOR_OPTIONS[0].value);
      setDeleteConfirmation({
        isOpen: false,
        lifeArea: null,
        pendingItems: null,
        isLoading: false,
      });
    }
  }, [isOpen]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (deleteConfirmation.isOpen) {
          setDeleteConfirmation((prev) => ({ ...prev, isOpen: false }));
        } else if (editingId) {
          setEditingId(null);
        } else if (isCreating) {
          setIsCreating(false);
          setNewName("");
        } else {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, editingId, isCreating, deleteConfirmation.isOpen, onClose]);

  if (!isOpen) return null;

  const startEditing = (area: LifeArea) => {
    setEditingId(area.id);
    setEditName(area.name);
    setEditColor(area.color);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName("");
    setEditColor(null);
  };

  const saveEdit = async () => {
    if (!editingId || !editName.trim()) return;

    try {
      setIsSubmitting(true);
      await updateLifeArea(editingId, {
        name: editName.trim(),
        color: editColor || undefined,
      });
      addToast({
        type: "success",
        title: "Life area updated",
      });
      setEditingId(null);
    } catch (error) {
      addToast({
        type: "error",
        title: "Failed to update life area",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;

    try {
      setIsSubmitting(true);
      await createLifeArea(newName.trim(), newColor);
      addToast({
        type: "success",
        title: "Life area created",
      });
      setIsCreating(false);
      setNewName("");
      setNewColor(COLOR_OPTIONS[0].value);
    } catch (error) {
      addToast({
        type: "error",
        title: "Failed to create life area",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const initiateDelete = async (area: LifeArea) => {
    setDeleteConfirmation({
      isOpen: true,
      lifeArea: area,
      pendingItems: null,
      isLoading: true,
    });

    try {
      const pendingItems = await lifeAreasApi.getPendingItemsCount(area.id);
      setDeleteConfirmation((prev) => ({
        ...prev,
        pendingItems,
        isLoading: false,
      }));
    } catch (error) {
      setDeleteConfirmation((prev) => ({
        ...prev,
        isLoading: false,
      }));
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation.lifeArea) return;

    try {
      setIsSubmitting(true);
      await archiveLifeArea(deleteConfirmation.lifeArea.id);
      addToast({
        type: "success",
        title: "Life area archived",
        description: "You can restore it from settings if needed",
      });
      setDeleteConfirmation({
        isOpen: false,
        lifeArea: null,
        pendingItems: null,
        isLoading: false,
      });
    } catch (error) {
      addToast({
        type: "error",
        title: "Failed to archive life area",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTotalPendingItems = (items: PendingItemsCount | null) => {
    if (!items) return 0;
    return (
      items.incompletePriorities +
      items.upcomingTimeBlocks +
      items.discussionItems +
      items.eisenhowerTasks
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md pointer-events-auto animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Manage Life Areas
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 max-h-[60vh] overflow-y-auto">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Organize your productivity by different life areas. You can have
              up to 5 active life areas.
            </p>

            {/* Life Areas List */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={lifeAreas.map((a) => a.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {lifeAreas.map((area) => (
                    <SortableItem
                      key={area.id}
                      area={area}
                      editingId={editingId}
                      editName={editName}
                      setEditName={setEditName}
                      editColor={editColor}
                      setEditColor={setEditColor}
                      saveEdit={saveEdit}
                      cancelEditing={cancelEditing}
                      startEditing={startEditing}
                      initiateDelete={initiateDelete}
                      canDelete={lifeAreas.length > 1}
                      isSubmitting={isSubmitting}
                      editInputRef={editInputRef}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {/* Add New Area */}
            {isCreating ? (
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                <input
                  ref={newInputRef}
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreate();
                    if (e.key === "Escape") {
                      setIsCreating(false);
                      setNewName("");
                    }
                  }}
                  className="w-full px-3 py-1.5 text-sm bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                  placeholder="New life area name"
                />
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    {COLOR_OPTIONS.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setNewColor(color.value)}
                        className={`w-5 h-5 rounded-full transition-all ${newColor === color.value
                            ? "ring-2 ring-offset-1 ring-blue-400 scale-110"
                            : "hover:scale-110"
                          }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setIsCreating(false);
                        setNewName("");
                      }}
                      className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreate}
                      disabled={!newName.trim() || isSubmitting}
                      className="px-2 py-1 text-xs text-white bg-blue-500 hover:bg-blue-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Plus className="w-3 h-3" />
                      )}
                      Create
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              lifeAreas.length < 5 && (
                <button
                  onClick={() => setIsCreating(true)}
                  className="mt-3 w-full flex items-center justify-center gap-2 p-3 text-sm text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Life Area
                </button>
              )
            )}

            {lifeAreas.length >= 5 && !isCreating && (
              <p className="mt-3 text-xs text-center text-gray-400 dark:text-gray-500">
                Maximum 5 life areas reached
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            <button
              onClick={onClose}
              className="w-full py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmation.isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-[60] animate-in fade-in duration-150"
            onClick={() =>
              setDeleteConfirmation((prev) => ({ ...prev, isOpen: false }))
            }
          />
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
            <div
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm pointer-events-auto animate-in fade-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-amber-100 dark:bg-amber-900/30 rounded-full">
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Archive &quot;{deleteConfirmation.lifeArea?.name}&quot;?
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      This will hide it from your dashboard
                    </p>
                  </div>
                </div>

                {deleteConfirmation.isLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    <span className="ml-2 text-sm text-gray-500">
                      Checking pending items...
                    </span>
                  </div>
                ) : getTotalPendingItems(deleteConfirmation.pendingItems) >
                  0 ? (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-4">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-2">
                      This life area has active items:
                    </p>
                    <ul className="space-y-1 text-sm text-amber-700 dark:text-amber-400">
                      {deleteConfirmation.pendingItems!.incompletePriorities >
                        0 && (
                          <li>
                            •{" "}
                            {
                              deleteConfirmation.pendingItems!
                                .incompletePriorities
                            }{" "}
                            incomplete{" "}
                            {deleteConfirmation.pendingItems!
                              .incompletePriorities === 1
                              ? "priority"
                              : "priorities"}{" "}
                            today
                          </li>
                        )}
                      {deleteConfirmation.pendingItems!.upcomingTimeBlocks >
                        0 && (
                          <li>
                            •{" "}
                            {deleteConfirmation.pendingItems!.upcomingTimeBlocks}{" "}
                            upcoming time{" "}
                            {deleteConfirmation.pendingItems!
                              .upcomingTimeBlocks === 1
                              ? "block"
                              : "blocks"}
                          </li>
                        )}
                      {deleteConfirmation.pendingItems!.discussionItems > 0 && (
                        <li>
                          • {deleteConfirmation.pendingItems!.discussionItems}{" "}
                          discussion{" "}
                          {deleteConfirmation.pendingItems!.discussionItems ===
                            1
                            ? "item"
                            : "items"}
                        </li>
                      )}
                      {deleteConfirmation.pendingItems!.eisenhowerTasks > 0 && (
                        <li>
                          • {deleteConfirmation.pendingItems!.eisenhowerTasks}{" "}
                          Eisenhower{" "}
                          {deleteConfirmation.pendingItems!.eisenhowerTasks ===
                            1
                            ? "task"
                            : "tasks"}
                        </li>
                      )}
                    </ul>
                    <p className="text-xs text-amber-600 dark:text-amber-500 mt-2">
                      These items will remain but won&apos;t be visible after
                      archiving.
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    No pending items found in this life area.
                  </p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setDeleteConfirmation((prev) => ({
                        ...prev,
                        isOpen: false,
                      }))
                    }
                    className="flex-1 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={isSubmitting || deleteConfirmation.isLoading}
                    className="flex-1 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    Archive
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
