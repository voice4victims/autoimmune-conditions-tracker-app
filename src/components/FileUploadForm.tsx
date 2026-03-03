import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X, Camera, FileText, Video, Image } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { fileService } from '@/lib/firebaseService';
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

  const detectCategory = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'].includes(ext)) return 'photo';
    if (['mp4', 'mov', 'avi', 'webm'].includes(ext)) return 'video';
    if (['dcm', 'dicom'].includes(ext)) return 'imaging';
    return '';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const detected = detectCategory(selectedFile.name);
      if (detected) setCategory(detected);
    }
  };

  const handleUpload = async () => {
    if (!file || !category || !user || !childProfile) {
      toast({ title: 'Error', description: 'Please select a file and category', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      await fileService.uploadFile(file, user.uid, childProfile.id, category, description);

      toast({ title: 'Success', description: 'File uploaded successfully' });
      setFile(null);
      setCategory('');
      setDescription('');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({ title: 'Error', description: 'Failed to upload file', variant: 'destructive' });
    } finally {
      setUploading(false);
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
              <SelectItem value="lab">Lab Result</SelectItem>
              <SelectItem value="imaging">Imaging</SelectItem>
              <SelectItem value="discharge">Discharge Summary</SelectItem>
              <SelectItem value="referral">Referral</SelectItem>
              <SelectItem value="insurance">Insurance Document</SelectItem>
              <SelectItem value="photo">Photo</SelectItem>
              <SelectItem value="video">Video</SelectItem>
              <SelectItem value="other">Other</SelectItem>
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