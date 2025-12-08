
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';

// Mock data for demonstration purposes. In a real app, this would be fetched from the backend.
const mockAuditLog = [
  { id: 1, event: 'User Login', date: '2023-10-27T10:00:00Z', ipAddress: '192.168.1.1' },
  { id: 2, event: 'View Symptom Record', date: '2023-10-27T10:05:00Z', ipAddress: '192.168.1.1' },
  { id: 3, event: 'Add Medication', date: '2023-10-27T10:15:00Z', ipAddress: '192.168.1.1' },
  { id: 4, event: 'Export Data', date: '2023-10-26T14:30:00Z', ipAddress: '192.168.1.1' },
  { id: 5, event: 'MFA Enabled', date: '2023-10-25T11:00:00Z', ipAddress: '192.168.1.1' },
];

const AuditTrail: React.FC = () => {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Audit Trail</h3>
      <p className="text-sm text-gray-600 mb-4">
        This log shows recent activity in your account. 
      </p>
      <ScrollArea className="h-[200px] border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>IP Address</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockAuditLog.map((log) => (
              <TableRow key={log.id}>
                <TableCell>{log.event}</TableCell>
                <TableCell>{new Date(log.date).toLocaleString()}</TableCell>
                <TableCell>{log.ipAddress}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
};

export default AuditTrail;
