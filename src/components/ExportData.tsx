
import React, { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveFile, saveBlobFile } from '@/lib/capacitor';
import { csvRow } from '@/lib/csvSanitize';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase';
import { EmailAuthProvider, GoogleAuthProvider, OAuthProvider, reauthenticateWithCredential, reauthenticateWithPopup } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc, Timestamp } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

const serializeFirestoreData = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Timestamp) return obj.toDate().toISOString();
  if (obj?.toDate && typeof obj.toDate === 'function') return obj.toDate().toISOString();
  if (Array.isArray(obj)) return obj.map(serializeFirestoreData);
  if (typeof obj === 'object') {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = serializeFirestoreData(value);
    }
    return result;
  }
  return obj;
};

const USER_ID_COLLECTIONS = [
  'vital_signs', 'food_diary', 'symptom_ratings', 'symptoms',
  'medical_visits', 'medication_reminders', 'notes', 'supplement_recipes',
  'recipes', 'file_uploads', 'healthcare_providers', 'allergy_records',
  'medical_records', 'trigger_events', 'treatments', 'activities',
];

const USERID_COLLECTIONS = ['children', 'patient_profiles'];

const CHILD_SUBCOLLECTIONS = ['symptoms', 'treatments', 'notes', 'vital_signs', 'food_diary'];

const SINGLE_DOC_COLLECTIONS = ['users', 'privacy_settings', 'user_consents'];

const ExportData: React.FC = () => {
  const { children, treatments, childProfile } = useApp();
  const { user } = useAuth();
  const { toast } = useToast();
  const [reauthOpen, setReauthOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [reauthError, setReauthError] = useState<string | null>(null);
  const [reauthenticating, setReauthenticating] = useState(false);
  const [pendingExport, setPendingExport] = useState<(() => Promise<void>) | null>(null);
  const [jsonExporting, setJsonExporting] = useState(false);

  const providerId = auth.currentUser?.providerData?.[0]?.providerId;

  const requireReauth = (exportFn: () => Promise<void>) => {
    setPendingExport(() => exportFn);
    setReauthOpen(true);
  };

  const handleReauth = async () => {
    if (!auth.currentUser) return;
    setReauthenticating(true);
    setReauthError(null);
    try {
      if (providerId === 'google.com') {
        await reauthenticateWithPopup(auth.currentUser, new GoogleAuthProvider());
      } else if (providerId === 'apple.com') {
        const provider = new OAuthProvider('apple.com');
        provider.addScope('email');
        await reauthenticateWithPopup(auth.currentUser, provider);
      } else {
        if (!password) { setReauthError('Password is required'); setReauthenticating(false); return; }
        const credential = EmailAuthProvider.credential(auth.currentUser.email!, password);
        await reauthenticateWithCredential(auth.currentUser, credential);
      }
      setReauthOpen(false);
      setPassword('');
      setReauthError(null);
      if (pendingExport) await pendingExport();
      setPendingExport(null);
    } catch (err: any) {
      setReauthError(err?.message?.includes('wrong-password') ? 'Incorrect password' : 'Re-authentication failed. Please try again.');
    } finally {
      setReauthenticating(false);
    }
  };

  const resetDialog = (open: boolean) => {
    setReauthOpen(open);
    if (!open) { setPassword(''); setReauthError(null); setPendingExport(null); }
  };

  const exportToTxt = async () => {
    let text = '';
    text += 'Children Data:\n';
    children.forEach(child => {
        text += `ID: ${child.id}\n`;
        text += `Name: ${child.name}\n`;
        text += `Date of Birth: ${child.dateOfBirth}\n`;
        text += `Diagnosis Date: ${child.diagnosisDate}\n`;
        text += '--------------------\n';
    });

    text += '\nTreatments Data:\n';
    treatments.forEach(treatment => {
        text += `ID: ${treatment.id}\n`;
        text += `Type: ${treatment.treatment_type}\n`;
        text += `Medication: ${treatment.medication_name}\n`;
        text += `Dosage: ${treatment.dosage}\n`;
        text += `Date: ${treatment.administration_date}\n`;
        text += `Time: ${treatment.administration_time}\n`;
        text += '--------------------\n';
    });

    await saveFile('export.txt', text, 'text/plain;charset=utf-8');
    toast({ title: 'Success', description: 'File exported successfully' });
  };

  const exportToCsv = async () => {
    let csv = '';
    csv += 'Children Data\n';
    csv += 'ID,Name,Date of Birth,Diagnosis Date\n';
    children.forEach(child => {
        csv += csvRow([child.id, child.name, child.dateOfBirth, child.diagnosisDate]);
    });

    csv += '\nTreatments Data\n';
    csv += 'ID,Type,Medication,Dosage,Date,Time\n';
    treatments.forEach(treatment => {
        csv += csvRow([treatment.id, treatment.treatment_type, treatment.medication_name, treatment.dosage, treatment.administration_date, treatment.administration_time]);
    });

    await saveFile('export.csv', csv, 'text/csv;charset=utf-8');
    toast({ title: 'Success', description: 'File exported successfully' });
  };

  const exportToPdf = async () => {
    const doc = new jsPDF();
    let y = 10;

    doc.text('Children Data', 10, y);
    y += 10;
    children.forEach(child => {
        doc.text(`ID: ${child.id}`, 10, y);
        y += 10;
        doc.text(`Name: ${child.name}`, 10, y);
        y += 10;
        doc.text(`Date of Birth: ${child.dateOfBirth}`, 10, y);
        y += 10;
        doc.text(`Diagnosis Date: ${child.diagnosisDate}`, 10, y);
        y += 10;
        doc.text('--------------------', 10, y);
        y += 10;
    });

    y += 10;
    doc.text('Treatments Data', 10, y);
    y += 10;
    treatments.forEach(treatment => {
        doc.text(`ID: ${treatment.id}`, 10, y);
        y += 10;
        doc.text(`Type: ${treatment.treatment_type}`, 10, y);
        y += 10;
        doc.text(`Medication: ${treatment.medication_name}`, 10, y);
        y += 10;
        doc.text(`Dosage: ${treatment.dosage}`, 10, y);
        y += 10;
        doc.text(`Date: ${treatment.administration_date}`, 10, y);
        y += 10;
        doc.text(`Time: ${treatment.administration_time}`, 10, y);
        y += 10;
        doc.text('--------------------', 10, y);
        y += 10;
    });

    const pdfBlob = doc.output('blob');
    await saveBlobFile('export.pdf', pdfBlob);
    toast({ title: 'Success', description: 'File exported successfully' });
  };

  const exportToWord = async () => {
    const doc = new Document({
        sections: [{
            children: [
                new Paragraph({
                    children: [
                        new TextRun({
                            text: 'Children Data',
                            bold: true,
                        }),
                    ],
                }),
                ...children.flatMap(child => [
                    new Paragraph(`ID: ${child.id}`),
                    new Paragraph(`Name: ${child.name}`),
                    new Paragraph(`Date of Birth: ${child.dateOfBirth}`),
                    new Paragraph(`Diagnosis Date: ${child.diagnosisDate}`),
                    new Paragraph('--------------------'),
                ]),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: '\nTreatments Data',
                            bold: true,
                        }),
                    ],
                }),
                ...treatments.flatMap(treatment => [
                    new Paragraph(`ID: ${treatment.id}`),
                    new Paragraph(`Type: ${treatment.treatment_type}`),
                    new Paragraph(`Medication: ${treatment.medication_name}`),
                    new Paragraph(`Dosage: ${treatment.dosage}`),
                    new Paragraph(`Date: ${treatment.administration_date}`),
                    new Paragraph(`Time: ${treatment.administration_time}`),
                    new Paragraph('--------------------'),
                ]),
            ],
        }],
    });

    const blob = await Packer.toBlob(doc);
    await saveBlobFile('export.docx', blob);
    toast({ title: 'Success', description: 'File exported successfully' });
  };

  const exportAllDataAsJson = async () => {
    const uid = user?.uid;
    if (!uid) {
      toast({ title: 'Error', description: 'You must be signed in to export data', variant: 'destructive' });
      return;
    }

    setJsonExporting(true);
    try {
      const allData: Record<string, any> = {};

      const userIdResults = await Promise.all(
        USER_ID_COLLECTIONS.map(async (col) => {
          const q = query(collection(db, col), where('user_id', '==', uid));
          const snap = await getDocs(q);
          return { col, docs: snap.docs.map((d) => ({ id: d.id, ...serializeFirestoreData(d.data()) })) };
        })
      );
      for (const { col, docs } of userIdResults) {
        if (docs.length > 0) allData[col] = docs;
      }

      const userIdFieldResults = await Promise.all(
        USERID_COLLECTIONS.map(async (col) => {
          const q = query(collection(db, col), where('userId', '==', uid));
          const snap = await getDocs(q);
          return { col, docs: snap.docs.map((d) => ({ id: d.id, ...serializeFirestoreData(d.data()) })) };
        })
      );
      for (const { col, docs } of userIdFieldResults) {
        if (docs.length > 0) allData[col] = docs;
      }

      if (allData.children && Array.isArray(allData.children)) {
        for (const child of allData.children) {
          const childId = child.id;
          const subResults = await Promise.all(
            CHILD_SUBCOLLECTIONS.map(async (sub) => {
              const subSnap = await getDocs(collection(db, 'children', childId, sub));
              return { sub, docs: subSnap.docs.map((d) => ({ id: d.id, ...serializeFirestoreData(d.data()) })) };
            })
          );
          for (const { sub, docs } of subResults) {
            if (docs.length > 0) child[sub] = docs;
          }
        }
      }

      const insuranceQ = query(collection(db, 'insurance_info'), where('userId', '==', uid));
      const insuranceSnap = await getDocs(insuranceQ);
      let insuranceDocs = insuranceSnap.docs.map((d) => ({ id: d.id, ...serializeFirestoreData(d.data()) }));
      if (insuranceDocs.length === 0) {
        const prefixSnap = await getDocs(collection(db, 'insurance_info'));
        insuranceDocs = prefixSnap.docs
          .filter((d) => d.id.startsWith(`${uid}_`))
          .map((d) => ({ id: d.id, ...serializeFirestoreData(d.data()) }));
      }
      if (insuranceDocs.length > 0) allData.insurance_info = insuranceDocs;

      const singleDocResults = await Promise.all(
        SINGLE_DOC_COLLECTIONS.map(async (col) => {
          const ref = doc(db, col, uid);
          const snap = await getDoc(ref);
          return { col, exists: snap.exists(), data: snap.exists() ? { id: snap.id, ...serializeFirestoreData(snap.data()) } : null };
        })
      );
      for (const { col, exists, data } of singleDocResults) {
        if (exists && data) allData[col] = data;
      }

      const exportPayload = {
        exportedAt: new Date().toISOString(),
        userId: uid,
        data: allData,
      };

      const json = JSON.stringify(exportPayload, null, 2);
      await saveFile('full-data-export.json', json, 'application/json;charset=utf-8');
      toast({ title: 'Success', description: 'Full data export completed' });
    } catch (err: any) {
      console.error('JSON export error:', err);
      toast({ title: 'Export failed', description: err?.message || 'An error occurred during export', variant: 'destructive' });
    } finally {
      setJsonExporting(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Export Data</h2>
      <div className="flex flex-wrap gap-3 mb-6">
        <Button onClick={() => requireReauth(exportToTxt)}>Export as .txt</Button>
        <Button onClick={() => requireReauth(exportToCsv)}>Export as .csv</Button>
        <Button onClick={() => requireReauth(exportToPdf)}>Export as .pdf</Button>
        <Button onClick={() => requireReauth(exportToWord)}>Export as .docx</Button>
      </div>
      <div className="border-t pt-4">
        <h3 className="text-lg font-semibold mb-2">Full Data Export (GDPR)</h3>
        <p className="text-sm text-muted-foreground mb-3">
          Download all your data in machine-readable JSON format. This includes every collection associated with your account.
        </p>
        <Button
          onClick={() => requireReauth(exportAllDataAsJson)}
          disabled={jsonExporting}
          variant="outline"
        >
          {jsonExporting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {jsonExporting ? 'Exporting...' : 'Export All Data (JSON)'}
        </Button>
      </div>

      <Dialog open={reauthOpen} onOpenChange={resetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify your identity</DialogTitle>
            <DialogDescription>
              For security, please re-authenticate before exporting your health data.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {providerId === 'google.com' ? (
              <Button onClick={handleReauth} disabled={reauthenticating} className="w-full">
                {reauthenticating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Re-authenticate with Google
              </Button>
            ) : providerId === 'apple.com' ? (
              <Button onClick={handleReauth} disabled={reauthenticating} className="w-full">
                {reauthenticating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Re-authenticate with Apple
              </Button>
            ) : (
              <>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleReauth()}
                />
                <Button onClick={handleReauth} disabled={reauthenticating} className="w-full">
                  {reauthenticating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Verify Password
                </Button>
              </>
            )}
            {reauthError && <p className="text-sm text-red-600">{reauthError}</p>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExportData;
