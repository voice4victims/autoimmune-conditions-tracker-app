
import React from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { saveAs } from 'file-saver';

const ExportData: React.FC = () => {
  const { children, treatments, childProfile } = useApp();

  const exportToTxt = () => {
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

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, 'export.txt');
  };

  const exportToCsv = () => {
    let csv = 'data:text/csv;charset=utf-8,';
    csv += 'Children Data\n';
    csv += 'ID,Name,Date of Birth,Diagnosis Date\n';
    children.forEach(child => {
        csv += `${child.id},${child.name},${child.dateOfBirth},${child.diagnosisDate}\n`;
    });

    csv += '\nTreatments Data\n';
    csv += 'ID,Type,Medication,Dosage,Date,Time\n';
    treatments.forEach(treatment => {
        csv += `${treatment.id},${treatment.treatment_type},${treatment.medication_name},${treatment.dosage},${treatment.administration_date},${treatment.administration_time}\n`;
    });

    const encodedUri = encodeURI(csv);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPdf = () => {
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

    doc.save('export.pdf');
  };

  const exportToWord = () => {
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

    Packer.toBlob(doc).then(blob => {
        saveAs(blob, 'export.docx');
    });
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Export Data</h2>
      <div className="flex space-x-4">
        <Button onClick={exportToTxt}>Export as .txt</Button>
        <Button onClick={exportToCsv}>Export as .csv</Button>
        <Button onClick={exportToPdf}>Export as .pdf</Button>
        <Button onClick={exportToWord}>Export as .docx</Button>
      </div>
    </div>
  );
};

export default ExportData;
