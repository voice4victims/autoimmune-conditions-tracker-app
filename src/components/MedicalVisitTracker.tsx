import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Hospital, Plus, List } from 'lucide-react';
import MedicalVisitForm from './MedicalVisitForm';
import MedicalVisitList from './MedicalVisitList';

const MedicalVisitTracker: React.FC = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState('add');

  const handleVisitAdded = () => {
    setRefreshKey(prev => prev + 1);
    setActiveTab('list');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hospital className="w-6 h-6" />
            Medical Visits & Hospitalizations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="add" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Visit
              </TabsTrigger>
              <TabsTrigger value="list" className="flex items-center gap-2">
                <List className="w-4 h-4" />
                View History
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="add" className="mt-4">
              <MedicalVisitForm onSuccess={handleVisitAdded} />
            </TabsContent>
            
            <TabsContent value="list" className="mt-4">
              <MedicalVisitList refresh={refreshKey} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default MedicalVisitTracker;