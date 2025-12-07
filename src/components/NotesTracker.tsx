import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { Save, Plus, Edit2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Note {
  id: string;
  child_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

const NotesTracker: React.FC = () => {
  const { childProfile } = useApp();
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState({ title: '', content: '' });
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (childProfile) {
      fetchNotes();
    }
  }, [childProfile]);

  const fetchNotes = async () => {
    if (!childProfile) return;
    
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('child_id', childProfile.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notes',
        variant: 'destructive'
      });
    }
  };

  const saveNote = async () => {
    if (!childProfile || !newNote.title.trim() || !newNote.content.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in both title and content',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('notes')
        .insert({
          child_id: childProfile.id,
          title: newNote.title.trim(),
          content: newNote.content.trim()
        });

      if (error) throw error;

      setNewNote({ title: '', content: '' });
      await fetchNotes();
      toast({
        title: 'Success',
        description: 'Note saved successfully'
      });
    } catch (error) {
      console.error('Error saving note:', error);
      toast({
        title: 'Error',
        description: 'Failed to save note',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateNote = async () => {
    if (!editingNote || !editingNote.title.trim() || !editingNote.content.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in both title and content',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('notes')
        .update({
          title: editingNote.title.trim(),
          content: editingNote.content.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', editingNote.id);

      if (error) throw error;

      setEditingNote(null);
      await fetchNotes();
      toast({
        title: 'Success',
        description: 'Note updated successfully'
      });
    } catch (error) {
      console.error('Error updating note:', error);
      toast({
        title: 'Error',
        description: 'Failed to update note',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      await fetchNotes();
      toast({
        title: 'Success',
        description: 'Note deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete note',
        variant: 'destructive'
      });
    }
  };

  if (!childProfile) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-gray-500">Please select a child profile to view notes</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add New Note
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="note-title">Title</Label>
            <Input
              id="note-title"
              value={newNote.title}
              onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
              placeholder="Enter note title..."
            />
          </div>
          <div>
            <Label htmlFor="note-content">Content</Label>
            <Textarea
              id="note-content"
              value={newNote.content}
              onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
              placeholder="Type your note here..."
              rows={4}
            />
          </div>
          <Button onClick={saveNote} disabled={loading} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : 'Save Note'}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Previous Notes</h3>
        {notes.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-8">
              <p className="text-gray-500">No notes yet. Add your first note above!</p>
            </CardContent>
          </Card>
        ) : (
          notes.map((note) => (
            <Card key={note.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {editingNote?.id === note.id ? (
                      <Input
                        value={editingNote.title}
                        onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                        className="font-semibold"
                      />
                    ) : (
                      note.title
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {editingNote?.id === note.id ? (
                      <>
                        <Button size="sm" onClick={updateNote} disabled={loading}>
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingNote(null)}>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" variant="outline" onClick={() => setEditingNote(note)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => deleteNote(note.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  {format(new Date(note.created_at), 'MMM d, yyyy \u2022 h:mm a')}
                  {note.updated_at !== note.created_at && ' (edited)'}
                </p>
              </CardHeader>
              <CardContent>
                {editingNote?.id === note.id ? (
                  <Textarea
                    value={editingNote.content}
                    onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                    rows={4}
                  />
                ) : (
                  <p className="whitespace-pre-wrap">{note.content}</p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default NotesTracker;