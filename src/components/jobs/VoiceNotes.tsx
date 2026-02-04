import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, Square, Play, Pause, Trash2, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceNote {
  id: string;
  url: string;
  duration: number;
  timestamp: Date;
}

interface VoiceNotesProps {
  notes?: VoiceNote[];
  onRecord?: (blob: Blob) => void;
  onDelete?: (id: string) => void;
}

export function VoiceNotes({ notes = [], onRecord, onDelete }: VoiceNotesProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [voiceNotes, setVoiceNotes] = useState<VoiceNote[]>(notes);
  const [playingId, setPlayingId] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        const newNote: VoiceNote = {
          id: Date.now().toString(),
          url,
          duration: recordingTime,
          timestamp: new Date(),
        };
        setVoiceNotes([...voiceNotes, newNote]);
        onRecord?.(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const playNote = (note: VoiceNote) => {
    if (playingId === note.id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(note.url);
      audioRef.current.onended = () => setPlayingId(null);
      audioRef.current.play();
      setPlayingId(note.id);
    }
  };

  const deleteNote = (id: string) => {
    setVoiceNotes(voiceNotes.filter((n) => n.id !== id));
    onDelete?.(id);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Mic className="w-4 h-4 text-primary" />
        <span className="font-medium text-sm">Note Vocali</span>
      </div>

      {/* Recording Button */}
      <div className="flex items-center justify-center mb-4">
        <div className="relative">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center transition-all",
              isRecording
                ? "bg-destructive animate-pulse"
                : "bg-primary hover:bg-primary/90"
            )}
          >
            {isRecording ? (
              <Square className="w-8 h-8 text-destructive-foreground fill-current" />
            ) : (
              <Mic className="w-8 h-8 text-primary-foreground" />
            )}
          </button>
          {isRecording && (
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2">
              <span className="text-sm font-mono text-destructive">
                {formatTime(recordingTime)}
              </span>
            </div>
          )}
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground mb-4">
        {isRecording ? "Registrazione in corso..." : "Tocca per registrare"}
      </p>

      {/* Voice Notes List */}
      {voiceNotes.length > 0 && (
        <div className="space-y-2">
          {voiceNotes.map((note) => (
            <div
              key={note.id}
              className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg"
            >
              <Button
                variant="ghost"
                size="iconSm"
                onClick={() => playNote(note)}
                className="shrink-0"
              >
                {playingId === note.id ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>

              <div className="flex-1 min-w-0">
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full bg-primary transition-all",
                      playingId === note.id && "animate-pulse"
                    )}
                    style={{ width: playingId === note.id ? "100%" : "0%" }}
                  />
                </div>
              </div>

              <span className="text-xs text-muted-foreground font-mono shrink-0">
                {formatTime(note.duration)}
              </span>

              <Button
                variant="ghost"
                size="iconSm"
                onClick={() => deleteNote(note.id)}
                className="shrink-0"
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {voiceNotes.length === 0 && !isRecording && (
        <div className="text-center py-4">
          <MicOff className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Nessuna nota vocale</p>
        </div>
      )}
    </Card>
  );
}
