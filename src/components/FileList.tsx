import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Image, Video, Download, Trash2, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';

interface FileUpload {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  category: string;
  description: string;
  uploaded_at: string;
}

const FileList: React.FC = () => {
  const [files, setFiles] = useState<FileUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const { childProfile } = useApp();

  useEffect(() => {
    if (user && childProfile) {
      fetchFiles();
    }
  }, [user, childProfile]);

  const fetchFiles = async () => {
    try {
      const { data, error } = await supabase
        .from('file_uploads')
        .select('*')
        .eq('child_id', childProfile?.id)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setFiles(data || []);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch files', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (file: FileUpload) => {
    try {
      const { data, error } = await supabase.storage
        .from('files')
        .download(file.storage_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.file_name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to download file', variant: 'destructive' });
    }
  };

  const handleDelete = async (file: FileUpload) => {
    try {
      const { error: storageError } = await supabase.storage
        .from('files')
        .remove([file.storage_path]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('file_uploads')
        .delete()
        .eq('id', file.id);

      if (dbError) throw dbError;

      setFiles(files.filter(f => f.id !== file.id));
      toast({ title: 'Success', description: 'File deleted successfully' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete file', variant: 'destructive' });
    }
  };

  const getFileIcon = (fileType: string, category: string) => {
    if (category === 'photo' || fileType.startsWith('image/')) {
      return <Image className="w-5 h-5 text-blue-600" />;
    }
    if (category === 'video' || fileType.startsWith('video/')) {
      return <Video className="w-5 h-5 text-purple-600" />;
    }
    return <FileText className="w-5 h-5 text-gray-600" />;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'photo': return 'bg-blue-100 text-blue-800';
      case 'video': return 'bg-purple-100 text-purple-800';
      case 'lab_result': return 'bg-green-100 text-green-800';
      case 'document': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const truncateFileName = (name: string, maxLength: number = 25) => {
    if (name.length <= maxLength) return name;
    const ext = name.split('.').pop();
    const nameWithoutExt = name.substring(0, name.lastIndexOf('.'));
    return `${nameWithoutExt.substring(0, maxLength - ext!.length - 4)}...${ext}`;
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">Loading files...</div>;
  }

  return (
    <div className="space-y-3">
      {files.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No files uploaded yet</p>
            <p className="text-sm text-gray-400 mt-1">Upload your first file to get started</p>
          </CardContent>
        </Card>
      ) : (
        files.map((file) => (
          <Card key={file.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {getFileIcon(file.file_type, file.category)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm leading-tight">
                        {truncateFileName(file.file_name)}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`${getCategoryColor(file.category)} text-xs px-2 py-0.5`}>
                          {file.category.replace('_', ' ')}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formatFileSize(file.file_size)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(file.uploaded_at).toLocaleDateString()}
                      </p>
                      {file.description && (
                        <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                          {file.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex-shrink-0">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDownload(file)}>
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(file)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};

export default FileList;