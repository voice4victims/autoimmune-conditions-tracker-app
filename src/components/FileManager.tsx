import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Files } from 'lucide-react';
import FileUploadForm from './FileUploadForm';
import FileList from './FileList';

const FileManager: React.FC = () => {
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
        </CardContent>
      </Card>
    </div>
  );
};

export default FileManager;