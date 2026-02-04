import { useState } from "react";
import { Camera, X, ImagePlus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Photo {
  id: string;
  url: string;
  type: "before" | "after" | "progress";
  timestamp: Date;
}

interface PhotoUploadProps {
  photos?: Photo[];
  onUpload?: (file: File, type: Photo["type"]) => void;
  onDelete?: (id: string) => void;
}

const photoTypes = [
  { value: "before" as const, label: "Prima", color: "bg-warning/20 text-warning" },
  { value: "progress" as const, label: "Durante", color: "bg-info/20 text-info" },
  { value: "after" as const, label: "Dopo", color: "bg-success/20 text-success" },
];

export function PhotoUpload({ photos = [], onUpload, onDelete }: PhotoUploadProps) {
  const [selectedType, setSelectedType] = useState<Photo["type"]>("before");
  const [previewPhotos, setPreviewPhotos] = useState<Photo[]>(photos);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const newPhoto: Photo = {
        id: Date.now().toString(),
        url,
        type: selectedType,
        timestamp: new Date(),
      };
      setPreviewPhotos([...previewPhotos, newPhoto]);
      onUpload?.(file, selectedType);
    }
  };

  const handleDelete = (id: string) => {
    setPreviewPhotos(previewPhotos.filter((p) => p.id !== id));
    onDelete?.(id);
  };

  const groupedPhotos = photoTypes.map((type) => ({
    ...type,
    photos: previewPhotos.filter((p) => p.type === type.value),
  }));

  return (
    <div className="space-y-4">
      {/* Type Selector */}
      <div className="flex gap-2">
        {photoTypes.map((type) => (
          <Button
            key={type.value}
            variant={selectedType === type.value ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedType(type.value)}
            className="flex-1"
          >
            {selectedType === type.value && <Check className="w-4 h-4 mr-1" />}
            {type.label}
          </Button>
        ))}
      </div>

      {/* Upload Area */}
      <label className="block">
        <div className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Camera className="w-8 h-8 text-primary" />
          </div>
          <p className="font-medium text-foreground mb-1">Scatta o carica foto</p>
          <p className="text-sm text-muted-foreground">
            Tocca per aggiungere foto "{photoTypes.find(t => t.value === selectedType)?.label}"
          </p>
        </div>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />
      </label>

      {/* Photos Grid */}
      {groupedPhotos.map((group) => (
        group.photos.length > 0 && (
          <div key={group.value}>
            <div className="flex items-center gap-2 mb-2">
              <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", group.color)}>
                {group.label}
              </span>
              <span className="text-xs text-muted-foreground">
                {group.photos.length} foto
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {group.photos.map((photo) => (
                <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden group">
                  <img
                    src={photo.url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => handleDelete(photo.id)}
                    className="absolute top-1 right-1 w-6 h-6 bg-destructive rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4 text-destructive-foreground" />
                  </button>
                </div>
              ))}
              <label className="aspect-square rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                <ImagePlus className="w-6 h-6 text-muted-foreground" />
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>
          </div>
        )
      ))}
    </div>
  );
}
