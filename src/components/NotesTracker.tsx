import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useApp } from '@/contexts/AppContext';
import { notesService } from '@/lib/firebaseService';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/useRoleAccess';
import { ConditionalRender } from '@/components/PermissionGuard';
import { format } from 'date-fns';
import { Save, Plus, Edit2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Note {
  id: string;
  date: string;
  title: string;
  content: string;
  created_at: string;
}

const NotesTracker: React.FC = () => {
  const { childProfile } = useApp();
  const { user } = useAuth();
  const { toast } = useToast();
  const { canWrite, canDelete } = usePermissions();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    title: '',
    content: ''
  });
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  useEffect(() => {
    if (childProfile && user) {
      fetchNotes();
    }
  }, [childProfile, user]);

  const fetchNotes = async () => {
    if (!childProfile || !user) return;

    try {
      const notesData = await notesService.getNotes(user.uid, childProfile.id);
      setNotes(notesData as Note[]);
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast({ title: 'Error', description: 'Failed to load notes', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!childProfile || !user) return;

    setLoading(true);
    try {
      if (editingNote) {
        await notesService.updateNote(editingNote.id, {
          date: formData.date,
          title: formData.title,
          content: formData.content
        });
        toast({ title: 'Success', description: 'Note updated successfully' });
      } else {
        await notesService.addNote({
          child_id: childProfile.id,
          user_id: user.uid,
          date: formData.date,
          title: formData.title,
          content: formData.content
        });
        toast({ title: 'Success', description: 'Note added successfully' });
      }

      setFormData({ date: format(new Date(), 'yyyy-MM-dd'), title: '', content: '' });
      setEditingNote(null);
      fetchNotes();
    } catch (error) {
      console.error('Error saving note:', error);
      toast({ title: 'Error', description: 'Failed to save note', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (note: Note) => {
    setEditingNote(note);
    setFormData({
      date: note.date,
      title: note.title,
      content: note.content
    });
  };

  const handleDelete = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      await notesService.deleteNote(noteId);
      toast({ title: 'Success', description: 'Note deleted successfully' });
      fetchNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({ title: 'Error', description: 'Failed to delete note', variant: 'destructive' });
    }
  };

  const handleCancel = () => {
    setEditingNote(null);
    setFormData({ date: format(new Date(), 'yyyy-MM-dd'), title: '', content: '' });
  };

  if (loading && notes.length === 0) {
    return <div className="text-center py-4">Loading notes...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {editingNote ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {editingNote ? 'Edit Note' : 'Add New Note'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Note title"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Write your note here..."
                rows={4}
                required
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={loading || !canWrite}>
                <Save className="w-4 h-4 mr-2" />
                {editingNote ? 'Update Note' : 'Save Note'}
              </Button>
              {editingNote && (
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              )}
            </div>
            {!canWrite && (
              <p className="text-xs text-muted-foreground mt-2">
                You don't have permission to {editingNote ? 'edit' : 'add'} notes
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {notes.map((note) => (
          <Card key={note.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold">{note.title}</h3>
                  <p className="text-sm text-gray-500">
                    {format(new Date(note.date), 'PPP')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <ConditionalRender permissions={['write_data']}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(note)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </ConditionalRender>
                  <ConditionalRender permissions={['delete_data']}>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(note.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </ConditionalRender>
                </div>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {notes.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No notes yet. Add your first note above.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NotesTracker;