import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X, Camera, FileText, Video, Image } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';

const FileUploadForm: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { childProfile } = useApp();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file || !category || !user || !childProfile) {
      toast({ title: 'Error', description: 'Please select a file and category', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${childProfile.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase
        .from('file_uploads')
        .insert({
          user_id: user.id,
          child_id: childProfile.id,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
          storage_path: filePath,
          category,
          description
        });

      if (dbError) throw dbError;

      toast({ title: 'Success', description: 'File uploaded successfully' });
      setFile(null);
      setCategory('');
      setDescription('');
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to upload file', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'photo': return <Image className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'lab_result': return <FileText className="w-4 h-4" />;
      case 'document': return <FileText className="w-4 h-4" />;
      default: return <Upload className="w-4 h-4" />;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Upload className="w-5 h-5" />
          Upload File
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="file" className="text-sm font-medium">Select File</Label>
          <Input
            id="file"
            type="file"
            onChange={handleFileSelect}
            accept="image/*,video/*,.pdf,.doc,.docx,.txt"
            className="h-11"
          />
          {file && (
            <div className="mt-2 p-3 bg-gray-50 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium truncate">{file.name}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFile(null)}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="category" className="text-sm font-medium">Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="photo">
                <div className="flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  Photo
                </div>
              </SelectItem>
              <SelectItem value="video">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  Video
                </div>
              </SelectItem>
              <SelectItem value="lab_result">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Lab Result
                </div>
              </SelectItem>
              <SelectItem value="document">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Document
                </div>
              </SelectItem>
              <SelectItem value="other">
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Other
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium">Description (Optional)</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description..."
            rows={3}
            className="resize-none"
          />
        </div>

        <Button
          onClick={handleUpload}
          disabled={!file || !category || uploading}
          className="w-full h-12 text-base font-medium"
        >
          {uploading ? 'Uploading...' : 'Upload File'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default FileUploadForm;