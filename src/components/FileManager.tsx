import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Files, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FileUploadForm from './FileUploadForm';
import FileList from './FileList';
import { useSubscription } from '@/hooks/useSubscription';
import { isRevenueCatAvailable } from '@/lib/revenuecat';

const FileManager: React.FC = () => {
  const { isPro } = useSubscription();
  const gated = isRevenueCatAvailable() && !isPro;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Files className="w-5 h-5" />
            File Manager
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4 text-sm">
            Upload and manage files including photos, videos, lab results, and documents.
          </p>

          {gated ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Lock className="w-10 h-10 text-gray-400 mb-3" />
              <p className="text-gray-600 font-medium mb-1">File management requires a Pro subscription</p>
              <p className="text-gray-400 text-sm mb-4">Upgrade to upload and manage documents, photos, and lab results.</p>
              <Button variant="default">Upgrade</Button>
            </div>
          ) : (
            <Tabs defaultValue="upload" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2 h-11">
                <TabsTrigger value="upload" className="flex items-center gap-2 text-sm">
                  <Upload className="w-4 h-4" />
                  <span className="hidden sm:inline">Upload Files</span>
                  <span className="sm:hidden">Upload</span>
                </TabsTrigger>
                <TabsTrigger value="files" className="flex items-center gap-2 text-sm">
                  <Files className="w-4 h-4" />
                  <span className="hidden sm:inline">My Files</span>
                  <span className="sm:hidden">Files</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="mt-4">
                <FileUploadForm />
              </TabsContent>

              <TabsContent value="files" className="mt-4">
                <FileList />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FileManager;
