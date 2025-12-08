import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, X } from 'lucide-react';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';

interface PhotoUploadProps {
  currentPhotoUrl?: string;
  onPhotoChange: (photoUrl: string | null) => void;
  childName: string;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({ 
  currentPhotoUrl, 
  onPhotoChange, 
  childName 
}) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPhotoUrl || null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Error', description: 'Please select an image file', variant: 'destructive' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Error', description: 'Image must be less than 5MB', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `child-photos/${fileName}`;
      const storageRef = ref(storage, filePath);

      const uploadTask = await uploadBytes(storageRef, file);
      const photoUrl = await getDownloadURL(uploadTask.ref);

      setPreviewUrl(photoUrl);
      onPhotoChange(photoUrl);
      toast({ title: 'Success', description: 'Photo uploaded successfully!' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to upload photo', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    setPreviewUrl(null);
    onPhotoChange(null);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium">Child's Photo</Label>
      <div className="flex items-center gap-4">
        <Avatar className="w-20 h-20">
          <AvatarImage src={previewUrl || undefined} alt={childName} />
          <AvatarFallback className="text-lg">
            {childName ? getInitials(childName) : 'CH'}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Label htmlFor="photo-upload" className="cursor-pointer">
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                disabled={uploading}
                asChild
              >
                <span>
                  <Camera className="w-4 h-4 mr-2" />
                  {uploading ? 'Uploading...' : 'Upload Photo'}
                </span>
              </Button>
            </Label>
            {previewUrl && (
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={handleRemovePhoto}
              >
                <X className="w-4 h-4 mr-2" />
                Remove
              </Button>
            )}
          </div>
          <Input
            id="photo-upload"
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <p className="text-xs text-gray-500">Max 5MB, JPG/PNG only</p>
        </div>
      </div>
    </div>
  );
};

export default PhotoUpload;