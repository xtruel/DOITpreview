import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, ClipboardCheck, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

interface JobChecklistProps {
  items?: ChecklistItem[];
  onChange?: (items: ChecklistItem[]) => void;
  editable?: boolean;
}

const defaultItems: ChecklistItem[] = [
  { id: "1", text: "Verifica impianto esistente", completed: true },
  { id: "2", text: "Spegnimento contatore", completed: true },
  { id: "3", text: "Installazione nuova unità", completed: false },
  { id: "4", text: "Test funzionamento", completed: false },
  { id: "5", text: "Pulizia area lavoro", completed: false },
  { id: "6", text: "Consegna documentazione cliente", completed: false },
];

export function JobChecklist({ items = defaultItems, onChange, editable = true }: JobChecklistProps) {
  const [checklistItems, setChecklistItems] = useState(items);
  const [newItemText, setNewItemText] = useState("");

  const completedCount = checklistItems.filter((i) => i.completed).length;
  const progress = (completedCount / checklistItems.length) * 100;

  const toggleItem = (id: string) => {
    const updated = checklistItems.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    setChecklistItems(updated);
    onChange?.(updated);
  };

  const addItem = () => {
    if (!newItemText.trim()) return;
    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      text: newItemText.trim(),
      completed: false,
    };
    const updated = [...checklistItems, newItem];
    setChecklistItems(updated);
    setNewItemText("");
    onChange?.(updated);
  };

  const removeItem = (id: string) => {
    const updated = checklistItems.filter((item) => item.id !== id);
    setChecklistItems(updated);
    onChange?.(updated);
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="w-4 h-4 text-primary" />
          <span className="font-medium text-sm">Checklist</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {completedCount}/{checklistItems.length} completati
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-secondary rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Items */}
      <div className="space-y-2">
        {checklistItems.map((item) => (
          <div
            key={item.id}
            className={cn(
              "flex items-center gap-3 p-2 rounded-lg transition-colors group",
              item.completed ? "bg-success/10" : "hover:bg-secondary/50"
            )}
          >
            {editable && (
              <GripVertical className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-grab" />
            )}
            <Checkbox
              checked={item.completed}
              onCheckedChange={() => toggleItem(item.id)}
            />
            <span
              className={cn(
                "flex-1 text-sm transition-colors",
                item.completed && "text-muted-foreground line-through"
              )}
            >
              {item.text}
            </span>
            {editable && (
              <Button
                variant="ghost"
                size="iconSm"
                className="opacity-0 group-hover:opacity-100"
                onClick={() => removeItem(item.id)}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Add Item */}
      {editable && (
        <div className="flex gap-2 mt-4">
          <Input
            placeholder="Aggiungi elemento..."
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addItem()}
          />
          <Button onClick={addItem} size="icon">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      )}
    </Card>
  );
}
