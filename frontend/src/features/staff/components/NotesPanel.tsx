import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notesApi } from '@/services/api';
import { useAuth } from '@/store/AuthContext';
import { Note } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, Send, User, AlertCircle, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotesPanelProps {
  patientId: string;
}

const NotesPanel: React.FC<NotesPanelProps> = ({ patientId }) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [newNote, setNewNote] = useState('');
  const [localNotes, setLocalNotes] = useState<Note[]>([]);
  const [apiAvailable, setApiAvailable] = useState(true);

  // Fetch notes from API
  const { data, isLoading, isError } = useQuery({
    queryKey: ['notes', patientId],
    queryFn: () => notesApi.getNotes(patientId),
    retry: 1,
  });

  useEffect(() => {
    if (isError) {
      setApiAvailable(false);
    }
  }, [isError]);

  // Add note mutation
  const addNoteMutation = useMutation({
    mutationFn: (text: string) => notesApi.addNote(patientId, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', patientId] });
      setNewNote('');
    },
    onError: () => {
      // Fallback to local storage if API fails
      const localNote: Note = {
        _id: `local-${Date.now()}`,
        text: newNote,
        author: user!,
        createdAt: new Date().toISOString(),
      };
      setLocalNotes((prev) => [localNote, ...prev]);
      setNewNote('');
      setApiAvailable(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    if (apiAvailable) {
      addNoteMutation.mutate(newNote);
    } else {
      // Add locally if API not available
      const localNote: Note = {
        _id: `local-${Date.now()}`,
        text: newNote,
        author: user!,
        createdAt: new Date().toISOString(),
      };
      setLocalNotes((prev) => [localNote, ...prev]);
      setNewNote('');
    }
  };

  const allNotes = [...localNotes, ...(data?.notes || [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className="border-border h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageSquare className="h-5 w-5 text-primary" />
          Notes & Comments
        </CardTitle>
        {!apiAvailable && (
          <div className="flex items-center gap-2 text-xs text-warning">
            <AlertCircle className="h-3 w-3" />
            Notes API pending - using local storage
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0">
        {/* Add Note Form */}
        <form onSubmit={handleSubmit} className="mb-4">
          <div className="space-y-2">
            <Textarea
              placeholder="Add a note about the patient's condition..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="resize-none min-h-[80px]"
            />
            <Button 
              type="submit" 
              size="sm" 
              className="w-full gap-2"
              disabled={!newNote.trim() || addNoteMutation.isPending}
            >
              <Send className="h-4 w-4" />
              {addNoteMutation.isPending ? 'Adding...' : 'Add Note'}
            </Button>
          </div>
        </form>

        {/* Notes List */}
        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ))}
            </div>
          ) : allNotes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notes yet</p>
              <p className="text-xs">Add the first note about this patient</p>
            </div>
          ) : (
            <div className="space-y-3 pr-2">
              {allNotes.map((note) => (
                <NoteItem key={note._id} note={note} formatDate={formatDate} />
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

interface NoteItemProps {
  note: Note;
  formatDate: (date: string) => string;
}

const NoteItem: React.FC<NoteItemProps> = ({ note, formatDate }) => {
  const isLocal = note._id.startsWith('local-');

  return (
    <div className={cn(
      'p-3 rounded-lg border',
      isLocal ? 'border-warning/30 bg-warning/5' : 'border-border bg-muted/50'
    )}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-3 w-3 text-primary" />
          </div>
          <span className="text-sm font-medium">{note.author?.name || 'Unknown'}</span>
          {note.author?.role && (
            <span className="text-xs text-muted-foreground capitalize">
              ({note.author.role})
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {formatDate(note.createdAt)}
        </span>
      </div>
      <p className="text-sm text-foreground whitespace-pre-wrap">{note.text}</p>
      {isLocal && (
        <p className="text-xs text-warning mt-2">Saved locally</p>
      )}
    </div>
  );
};

export default NotesPanel;
