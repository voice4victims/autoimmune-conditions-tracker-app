
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FileImage } from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';

interface OCRProps {
  onDataExtracted: (data: any) => void;
  formType?: 'vitals' | 'symptoms' | 'treatments' | 'food' | 'activities' | 'visits' | 'providers';
  title?: string;
}

const LabResultsOCR: React.FC<OCRProps> = ({ 
  onDataExtracted, 
  formType = 'vitals',
  title = 'Extract Data from Image'
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const functions = getFunctions();

  const processImage = async (file: File) => {
    setIsProcessing(true);
    try {
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size too large. Please select an image under 5MB.');
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const result = e.target?.result;
          if (!result || typeof result !== 'string') {
            throw new Error('Failed to read image file');
          }

          const imageData = result;
          setPreviewUrl(imageData);

          if (!imageData.startsWith('data:image/')) {
            throw new Error('Invalid image format detected');
          }

          const ocrLabResults = httpsCallable(functions, 'ocr-lab-results');
          const { data } = await ocrLabResults({ imageData, formType });

          if (data && !(data as any).error) {
            onDataExtracted(data);
            toast({
              title: 'Data Extracted Successfully',
              description: 'Information has been extracted and populated in the form.'
            });
          } else {
            const errorMsg = (data as any)?.error || 'Could not extract data from the image';
            toast({
              title: 'Extraction Failed',
              description: errorMsg,
              variant: 'destructive'
            });
          }
        } catch (error) {
          console.error('OCR processing error:', error);
          toast({
            title: 'Processing Error',
            description: (error as Error).message || 'Failed to process the image. Please try again.',
            variant: 'destructive'
          });
        } finally {
          setIsProcessing(false);
        }
      };

      reader.onerror = () => {
        setIsProcessing(false);
        toast({
          title: 'File Read Error',
          description: 'Failed to read the selected file. Please try again.',
          variant: 'destructive'
        });
      };

      reader.readAsDataURL(file);
    } catch (error) {
      setIsProcessing(false);
      console.error('File processing error:', error);
      toast({
        title: 'File Error',
        description: (error as Error).message || 'Failed to process the selected file.',
        variant: 'destructive'
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processImage(file);
    } else {
      toast({
        title: 'Invalid File',
        description: 'Please select an image file.',
        variant: 'destructive'
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileImage className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="lab-image">Upload Image</Label>
          <Input
            id="lab-image"
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={isProcessing}
            className="mt-2"
          />
        </div>

        {previewUrl && (
          <div className="space-y-2">
            <Label>Preview</Label>
            <img 
              src={previewUrl} 
              alt="Lab results preview" 
              className="max-w-full h-48 object-contain border rounded"
            />
          </div>
        )}

        {isProcessing && (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Processing image...</span>
          </div>
        )}

        <div className="text-sm text-gray-600">
          <p>• Upload a clear image with relevant information</p>
          <p>• Supported formats: JPG, PNG, GIF</p>
          <p>• Data will be automatically extracted and filled in the form</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default LabResultsOCR;
