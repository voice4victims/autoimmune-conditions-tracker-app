import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Trash2, Pencil, X, FileUp, Eye } from 'lucide-react';
import { openUrl } from '@/lib/capacitor';
import { useToast } from '@/hooks/use-toast';
import { db, storage } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';

interface MedicalRecord {
  id: string;
  name: string;
  category: string;
  provider: string;
  date: string;
  notes: string;
  file_name: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  download_url: string;
  user_id: string;
  child_id: string;
  created_at: Timestamp | string;
  is_seed?: boolean;
}

type CategoryKey = 'all' | 'lab' | 'imaging' | 'referral' | 'discharge' | 'insurance' | 'photo' | 'other';

const CATEGORIES: Record<Exclude<CategoryKey, 'all'>, { icon: string; label: string; color: string; darkColor: string }> = {
  lab: { icon: '\uD83D\uDD2C', label: 'Lab Results', color: 'bg-emerald-100 text-emerald-800', darkColor: 'dark:bg-emerald-900/40 dark:text-emerald-300' },
  imaging: { icon: '\uD83E\uDE7B', label: 'Imaging', color: 'bg-blue-100 text-blue-800', darkColor: 'dark:bg-blue-900/40 dark:text-blue-300' },
  referral: { icon: '\uD83D\uDCCB', label: 'Referral Letters', color: 'bg-amber-100 text-amber-800', darkColor: 'dark:bg-amber-900/40 dark:text-amber-300' },
  discharge: { icon: '\uD83C\uDFE5', label: 'Discharge Summaries', color: 'bg-rose-100 text-rose-800', darkColor: 'dark:bg-rose-900/40 dark:text-rose-300' },
  insurance: { icon: '\uD83E\uDEAA', label: 'Insurance Documents', color: 'bg-violet-100 text-violet-800', darkColor: 'dark:bg-violet-900/40 dark:text-violet-300' },
  photo: { icon: '\uD83D\uDCF8', label: 'Photos', color: 'bg-sky-100 text-sky-800', darkColor: 'dark:bg-sky-900/40 dark:text-sky-300' },
  other: { icon: '\uD83D\uDCC4', label: 'Other', color: 'bg-neutral-100 text-neutral-700', darkColor: 'dark:bg-neutral-800 dark:text-neutral-300' },
};

const SEED_DATA: Omit<MedicalRecord, 'user_id' | 'child_id'>[] = [
  {
    id: 'seed-1',
    name: 'Strep Panel (Quest)',
    category: 'lab',
    provider: 'Quest Diagnostics',
    date: '2026-02-14',
    notes: 'ASO titer elevated at 450. Anti-DNase B positive. Follow-up recommended.',
    file_name: 'strep_panel_quest_feb2026.pdf',
    file_type: 'application/pdf',
    file_size: 245760,
    storage_path: '',
    download_url: '',
    created_at: '2026-02-14T10:00:00Z',
    is_seed: true,
  },
  {
    id: 'seed-2',
    name: 'IEP Meeting Notes',
    category: 'referral',
    provider: 'Lincoln Elementary School',
    date: '2026-01-22',
    notes: 'Initial IEP meeting. Accommodations approved for testing anxiety and OCD behaviors during flares.',
    file_name: 'iep_meeting_notes_jan2026.pdf',
    file_type: 'application/pdf',
    file_size: 189440,
    storage_path: '',
    download_url: '',
    created_at: '2026-01-22T14:30:00Z',
    is_seed: true,
  },
  {
    id: 'seed-3',
    name: 'Hospital Discharge Summary',
    category: 'discharge',
    provider: "Children's National Medical Center",
    date: '2026-01-10',
    notes: 'IVIG treatment completed. 2g/kg over 2 days. Tolerated well. Follow-up in 4 weeks.',
    file_name: 'discharge_summary_jan2026.pdf',
    file_type: 'application/pdf',
    file_size: 512000,
    storage_path: '',
    download_url: '',
    created_at: '2026-01-10T16:00:00Z',
    is_seed: true,
  },
  {
    id: 'seed-4',
    name: 'Brain MRI \u2014 Normal',
    category: 'imaging',
    provider: 'Radiology Associates',
    date: '2025-12-18',
    notes: 'MRI brain without contrast. No structural abnormalities. Basal ganglia unremarkable.',
    file_name: 'brain_mri_dec2025.pdf',
    file_type: 'application/pdf',
    file_size: 1048576,
    storage_path: '',
    download_url: '',
    created_at: '2025-12-18T09:15:00Z',
    is_seed: true,
  },
  {
    id: 'seed-5',
    name: 'IVIG Prior Auth Approval',
    category: 'insurance',
    provider: 'Blue Cross Blue Shield',
    date: '2025-12-05',
    notes: 'Prior authorization approved for IVIG therapy. Reference #PA-2025-88421. Valid through March 2026.',
    file_name: 'ivig_prior_auth_dec2025.pdf',
    file_type: 'application/pdf',
    file_size: 156672,
    storage_path: '',
    download_url: '',
    created_at: '2025-12-05T11:45:00Z',
    is_seed: true,
  },
];

const detectCategory = (fileName: string): string => {
  const lower = fileName.toLowerCase();
  if (/lab|panel|titer|blood|cbc|metabolic|urinalysis/.test(lower)) return 'lab';
  if (/mri|ct|xray|x-ray|ultrasound|scan|imaging/.test(lower)) return 'imaging';
  if (/referral|iep|letter|recommendation/.test(lower)) return 'referral';
  if (/discharge|hospital|admit/.test(lower)) return 'discharge';
  if (/insurance|auth|prior|claim|eob|policy/.test(lower)) return 'insurance';
  if (/\.(jpg|jpeg|png|gif|heic|webp)$/.test(lower)) return 'photo';
  return 'other';
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const formatDate = (dateStr: string): string => {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const MedicalRecordsScreen: React.FC = () => {
  const { user } = useAuth();
  const { childProfile } = useApp();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('all');
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadCategory, setUploadCategory] = useState<string>('');
  const [uploadProvider, setUploadProvider] = useState('');
  const [uploadDate, setUploadDate] = useState(new Date().toISOString().split('T')[0]);
  const [uploadNotes, setUploadNotes] = useState('');

  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editProvider, setEditProvider] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editNotes, setEditNotes] = useState('');

  useEffect(() => {
    if (user && childProfile) {
      fetchRecords();
    }
  }, [user, childProfile]);

  const fetchRecords = async () => {
    if (!user || !childProfile) return;
    setLoading(true);
    try {
      const recordsRef = collection(db, 'medical_records');
      const q = query(recordsRef, where('user_id', '==', user.uid), where('child_id', '==', childProfile.id));
      const snapshot = await getDocs(q);
      const firestoreRecords = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as MedicalRecord[];
      const seedRecords = SEED_DATA.map(s => ({
        ...s,
        user_id: user.uid,
        child_id: childProfile.id,
      }));
      const allRecords = [...firestoreRecords, ...seedRecords];
      allRecords.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      setRecords(allRecords);
    } catch {
      toast({ title: 'Error', description: 'Failed to load medical records', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = records.filter(r => {
    const matchesCategory = activeCategory === 'all' || r.category === activeCategory;
    const matchesSearch = !searchQuery ||
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.notes.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFile(file);
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
    setUploadName(nameWithoutExt);
    setUploadCategory(detectCategory(file.name));
  };

  const handleUpload = async () => {
    if (!uploadFile || !uploadName || !uploadCategory || !user || !childProfile) {
      toast({ title: 'Missing fields', description: 'Please fill in required fields', variant: 'destructive' });
      return;
    }
    setUploading(true);
    try {
      const fileExt = uploadFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const storagePath = `medical_records/${user.uid}/${childProfile.id}/${fileName}`;
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, uploadFile);
      const downloadUrl = await getDownloadURL(storageRef);

      await addDoc(collection(db, 'medical_records'), {
        name: uploadName,
        category: uploadCategory,
        provider: uploadProvider,
        date: uploadDate,
        notes: uploadNotes,
        file_name: uploadFile.name,
        file_type: uploadFile.type,
        file_size: uploadFile.size,
        storage_path: storagePath,
        download_url: downloadUrl,
        user_id: user.uid,
        child_id: childProfile.id,
        created_at: Timestamp.now(),
      });

      toast({ title: 'Uploaded', description: 'Medical record saved successfully' });
      resetUploadForm();
      setShowUpload(false);
      await fetchRecords();
    } catch {
      toast({ title: 'Error', description: 'Failed to upload record', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const resetUploadForm = () => {
    setUploadFile(null);
    setUploadName('');
    setUploadCategory('');
    setUploadProvider('');
    setUploadDate(new Date().toISOString().split('T')[0]);
    setUploadNotes('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openDetail = (record: MedicalRecord) => {
    setSelectedRecord(record);
    setEditMode(false);
    setShowDetail(true);
  };

  const startEdit = () => {
    if (!selectedRecord) return;
    setEditName(selectedRecord.name);
    setEditCategory(selectedRecord.category);
    setEditProvider(selectedRecord.provider);
    setEditDate(selectedRecord.date);
    setEditNotes(selectedRecord.notes);
    setEditMode(true);
  };

  const saveEdit = async () => {
    if (!selectedRecord || selectedRecord.is_seed) return;
    try {
      await updateDoc(doc(db, 'medical_records', selectedRecord.id), {
        name: editName,
        category: editCategory,
        provider: editProvider,
        date: editDate,
        notes: editNotes,
      });
      toast({ title: 'Updated', description: 'Record updated successfully' });
      setEditMode(false);
      setShowDetail(false);
      await fetchRecords();
    } catch {
      toast({ title: 'Error', description: 'Failed to update record', variant: 'destructive' });
    }
  };

  const confirmDelete = async () => {
    if (!selectedRecord || selectedRecord.is_seed) return;
    try {
      if (selectedRecord.storage_path) {
        try {
          const fileRef = ref(storage, selectedRecord.storage_path);
          await deleteObject(fileRef);
        } catch {}
      }
      await deleteDoc(doc(db, 'medical_records', selectedRecord.id));
      toast({ title: 'Deleted', description: 'Record deleted' });
      setShowDeleteConfirm(false);
      setShowDetail(false);
      setSelectedRecord(null);
      await fetchRecords();
    } catch {
      toast({ title: 'Error', description: 'Failed to delete record', variant: 'destructive' });
    }
  };

  const isImageFile = (fileType: string) => fileType.startsWith('image/');

  const categoryKeys: CategoryKey[] = ['all', 'lab', 'imaging', 'referral', 'discharge', 'insurance', 'photo', 'other'];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-xl text-neutral-800 dark:text-neutral-100">Medical Records</h2>
          <p className="font-sans text-[12px] text-neutral-400 mt-0.5">
            {records.length} record{records.length !== 1 ? 's' : ''} on file
          </p>
        </div>
        <Button
          onClick={() => { resetUploadForm(); setShowUpload(true); }}
          size="sm"
          className="gap-1.5 font-sans font-bold text-[12px]"
        >
          <Plus className="w-3.5 h-3.5" />
          Upload
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <Input
          placeholder="Search records..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-10 font-sans text-[13px] bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer bg-transparent border-none"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {categoryKeys.map((key) => {
          const isAll = key === 'all';
          const cat = isAll ? null : CATEGORIES[key];
          const count = key === 'all' ? records.length : records.filter(r => r.category === key).length;
          return (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-full font-sans font-bold text-[11px] border cursor-pointer transition-colors ${
                activeCategory === key
                  ? 'bg-primary-500 text-white border-primary-500 dark:bg-primary-600 dark:border-primary-600'
                  : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800'
              }`}
            >
              {isAll ? '\uD83D\uDCE6' : cat!.icon}
              <span>{isAll ? 'All' : cat!.label}</span>
              <span className={`text-[10px] ${activeCategory === key ? 'text-white/70' : 'text-neutral-400'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="text-center py-12 text-neutral-400 font-sans text-[13px]">Loading records...</div>
      ) : filteredRecords.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-3xl mb-3">{activeCategory === 'all' ? '\uD83D\uDCC1' : CATEGORIES[activeCategory as Exclude<CategoryKey, 'all'>]?.icon || '\uD83D\uDCC1'}</p>
            <p className="font-sans text-neutral-500 dark:text-neutral-400 text-[13px]">
              {searchQuery ? 'No records match your search' : 'No records in this category'}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { resetUploadForm(); setShowUpload(true); }}
              className="mt-3 gap-1.5 font-sans text-[12px]"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Record
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredRecords.map((record) => {
            const cat = CATEGORIES[record.category as Exclude<CategoryKey, 'all'>] || CATEGORIES.other;
            return (
              <Card
                key={record.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => openDetail(record)}
              >
                <CardContent className="p-3.5">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 bg-neutral-50 dark:bg-neutral-800">
                      {cat.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-sans font-bold text-[13px] text-neutral-800 dark:text-neutral-100 leading-tight truncate">
                          {record.name}
                        </p>
                        <span className="font-sans text-[10px] text-neutral-400 shrink-0 mt-0.5">
                          {formatDate(record.date)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`${cat.color} ${cat.darkColor} text-[10px] px-1.5 py-0 font-semibold border-0`}>
                          {cat.label}
                        </Badge>
                        <span className="font-sans text-[10px] text-neutral-400">
                          {formatFileSize(record.file_size)}
                        </span>
                        {record.is_seed && (
                          <span className="font-sans text-[9px] text-neutral-300 dark:text-neutral-600 italic">sample</span>
                        )}
                      </div>
                      {record.provider && (
                        <p className="font-sans text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 truncate">
                          {record.provider}
                        </p>
                      )}
                      {record.notes && (
                        <p className="font-sans text-[11px] text-neutral-400 dark:text-neutral-500 mt-1 line-clamp-1">
                          {record.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg">Upload Medical Record</DialogTitle>
            <DialogDescription className="font-sans text-[12px] text-neutral-400">
              Add a lab result, imaging report, or other medical document
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="font-sans text-[12px] font-bold text-neutral-600 dark:text-neutral-300">File</Label>
              <Input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xls,.xlsx"
                className="h-10 font-sans text-[12px]"
              />
              {uploadFile && (
                <div className="flex items-center justify-between p-2 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileUp className="w-4 h-4 text-neutral-400 shrink-0" />
                    <span className="font-sans text-[12px] text-neutral-600 dark:text-neutral-300 truncate">{uploadFile.name}</span>
                    <span className="font-sans text-[10px] text-neutral-400 shrink-0">{formatFileSize(uploadFile.size)}</span>
                  </div>
                  <button onClick={() => { setUploadFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="cursor-pointer bg-transparent border-none p-0.5" aria-label="Remove file">
                    <X className="w-3.5 h-3.5 text-neutral-400" aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="font-sans text-[12px] font-bold text-neutral-600 dark:text-neutral-300">Record Name *</Label>
              <Input
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
                placeholder="e.g. Strep Panel Results"
                className="h-10 font-sans text-[13px]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="font-sans text-[12px] font-bold text-neutral-600 dark:text-neutral-300">Category *</Label>
              <Select value={uploadCategory} onValueChange={setUploadCategory}>
                <SelectTrigger className="h-10 font-sans text-[13px]">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(CATEGORIES) as [string, typeof CATEGORIES[keyof typeof CATEGORIES]][]).map(([key, cat]) => (
                    <SelectItem key={key} value={key}>
                      <span className="flex items-center gap-2">
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="font-sans text-[12px] font-bold text-neutral-600 dark:text-neutral-300">Provider</Label>
              <Input
                value={uploadProvider}
                onChange={(e) => setUploadProvider(e.target.value)}
                placeholder="e.g. Quest Diagnostics"
                className="h-10 font-sans text-[13px]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="font-sans text-[12px] font-bold text-neutral-600 dark:text-neutral-300">Date</Label>
              <Input
                type="date"
                value={uploadDate}
                onChange={(e) => setUploadDate(e.target.value)}
                className="h-10 font-sans text-[13px]"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="font-sans text-[12px] font-bold text-neutral-600 dark:text-neutral-300">Notes</Label>
              <Textarea
                value={uploadNotes}
                onChange={(e) => setUploadNotes(e.target.value)}
                placeholder="Key findings, follow-up needed, etc."
                rows={3}
                className="resize-none font-sans text-[13px]"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowUpload(false)} className="font-sans text-[12px]">
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!uploadFile || !uploadName || !uploadCategory || uploading}
              className="font-sans font-bold text-[12px] gap-1.5"
            >
              {uploading ? 'Uploading...' : 'Save Record'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDetail} onOpenChange={(open) => { if (!open) { setShowDetail(false); setEditMode(false); } }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          {selectedRecord && !editMode && (() => {
            const cat = CATEGORIES[selectedRecord.category as Exclude<CategoryKey, 'all'>] || CATEGORIES.other;
            return (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{cat.icon}</span>
                    <DialogTitle className="font-serif text-lg">{selectedRecord.name}</DialogTitle>
                  </div>
                  <DialogDescription className="sr-only">Record details</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge className={`${cat.color} ${cat.darkColor} text-[11px] px-2 py-0.5 font-semibold border-0`}>
                      {cat.label}
                    </Badge>
                    {selectedRecord.is_seed && (
                      <span className="font-sans text-[10px] text-neutral-400 italic">Sample data</span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="font-sans text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Date</p>
                      <p className="font-sans text-[13px] text-neutral-700 dark:text-neutral-200">{formatDate(selectedRecord.date)}</p>
                    </div>
                    <div>
                      <p className="font-sans text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Provider</p>
                      <p className="font-sans text-[13px] text-neutral-700 dark:text-neutral-200">{selectedRecord.provider || '\u2014'}</p>
                    </div>
                    <div>
                      <p className="font-sans text-[10px] font-bold text-neutral-400 uppercase tracking-wider">File</p>
                      <p className="font-sans text-[12px] text-neutral-500 dark:text-neutral-400 truncate">{selectedRecord.file_name}</p>
                    </div>
                    <div>
                      <p className="font-sans text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Size</p>
                      <p className="font-sans text-[12px] text-neutral-500 dark:text-neutral-400">{formatFileSize(selectedRecord.file_size)}</p>
                    </div>
                  </div>

                  {selectedRecord.download_url && isImageFile(selectedRecord.file_type) && (
                    <div className="rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700">
                      <img src={selectedRecord.download_url} alt={selectedRecord.name} className="w-full h-auto max-h-64 object-contain bg-neutral-50 dark:bg-neutral-800" />
                    </div>
                  )}

                  {selectedRecord.notes && (
                    <div>
                      <p className="font-sans text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Notes</p>
                      <p className="font-sans text-[13px] text-neutral-600 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
                        {selectedRecord.notes}
                      </p>
                    </div>
                  )}

                  {selectedRecord.download_url && (
                    <button
                      onClick={() => openUrl(selectedRecord.download_url!)}
                      className="inline-flex items-center gap-1.5 font-sans font-bold text-[12px] text-primary-600 hover:text-primary-700 bg-transparent border-none cursor-pointer p-0"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View / Download File
                    </button>
                  )}
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                  {!selectedRecord.is_seed && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 font-sans text-[12px]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={startEdit}
                        className="gap-1.5 font-sans text-[12px]"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </Button>
                    </>
                  )}
                </DialogFooter>
              </>
            );
          })()}

          {selectedRecord && editMode && (
            <>
              <DialogHeader>
                <DialogTitle className="font-serif text-lg">Edit Record</DialogTitle>
                <DialogDescription className="sr-only">Edit medical record details</DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="font-sans text-[12px] font-bold text-neutral-600 dark:text-neutral-300">Name</Label>
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-10 font-sans text-[13px]" />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-sans text-[12px] font-bold text-neutral-600 dark:text-neutral-300">Category</Label>
                  <Select value={editCategory} onValueChange={setEditCategory}>
                    <SelectTrigger className="h-10 font-sans text-[13px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.entries(CATEGORIES) as [string, typeof CATEGORIES[keyof typeof CATEGORIES]][]).map(([key, cat]) => (
                        <SelectItem key={key} value={key}>
                          <span className="flex items-center gap-2">
                            <span>{cat.icon}</span>
                            <span>{cat.label}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="font-sans text-[12px] font-bold text-neutral-600 dark:text-neutral-300">Provider</Label>
                  <Input value={editProvider} onChange={(e) => setEditProvider(e.target.value)} className="h-10 font-sans text-[13px]" />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-sans text-[12px] font-bold text-neutral-600 dark:text-neutral-300">Date</Label>
                  <Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="h-10 font-sans text-[13px]" />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-sans text-[12px] font-bold text-neutral-600 dark:text-neutral-300">Notes</Label>
                  <Textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={3} className="resize-none font-sans text-[13px]" />
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" size="sm" onClick={() => setEditMode(false)} className="font-sans text-[12px]">
                  Cancel
                </Button>
                <Button size="sm" onClick={saveEdit} className="font-sans font-bold text-[12px]">
                  Save Changes
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg">Delete Record</DialogTitle>
            <DialogDescription className="font-sans text-[13px] text-neutral-500">
              Are you sure you want to delete &quot;{selectedRecord?.name}&quot;? This will also remove the uploaded file. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setShowDeleteConfirm(false)} className="font-sans text-[12px]">
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={confirmDelete} className="font-sans font-bold text-[12px]">
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MedicalRecordsScreen;
