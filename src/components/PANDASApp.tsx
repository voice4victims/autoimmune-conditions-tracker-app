import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useApp } from '@/contexts/AppContext';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import MedicalDisclaimer from './MedicalDisclaimer';
import SelfCareBanner from './SelfCareBanner';
import ChildProfileForm from './ChildProfileForm';
import ChildSelector from './ChildSelector';
import ChildManager from './ChildManager';
import SymptomTracker from './SymptomTracker';
import SymptomChart from './SymptomChart';
import SymptomHeatmap from './SymptomHeatmap';
import TreatmentTracker from './TreatmentTracker';
import NotesTracker from './NotesTracker';
import MedicationReminders from './MedicationReminders';
import SupplementRecipes from './SupplementRecipes';
import VitalSignsTracker from './VitalSignsTracker';
import FoodDiaryTracker from './FoodDiaryTracker';
import FileManager from './FileManager';
import ProviderTracker from './ProviderTracker';
import ActivityTracker from './ActivityTracker';
import SelfCareGuide from './SelfCareGuide';
import EmailRecordsForm from './EmailRecordsForm';
import DrugInteractionChecker from './DrugInteractionChecker';
import ResourcesTab from './ResourcesTab';
import { FamilyManager } from './FamilyManager';
import FAQ from './FAQ';
import MoreMenu from './MoreMenu';
import PTECTracker from './PTECTracker';
import AdvancedAnalyticsDashboard from './AdvancedAnalyticsDashboard';
import { DiagnosisTracker } from './DiagnosisTracker';
import { Activity, User, Settings, Utensils, Users, Clock, HelpCircle, MoreHorizontal, Search, ListTree } from 'lucide-react';


const PANDASApp: React.FC = () => {
  const { 
    childProfile, 
    children, 
    setChildProfile, 
    saveChildProfile, 
    addSymptom,
    customSymptoms,
    addCustomSymptom
  } = useApp();
  
  const deviceInfo = useDeviceDetection();
  const [showChildManager, setShowChildManager] = useState(false);
  const [activeMoreTab, setActiveMoreTab] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState('track');

  const handleCreateProfile = async (profile: any) => {
    await saveChildProfile(profile);
  };

  const handleAddSymptom = async (symptom: any) => {
    await addSymptom(symptom);
  };

  const handleChildSelect = (childId: string) => {
    const selectedChild = children.find(child => child.id === childId);
    if (selectedChild) {
      setChildProfile(selectedChild);
    }
  };

  const handleAddChild = () => {
    setShowChildManager(true);
  };

  const handleMoreTabClick = (tabName: string) => {
    setActiveMoreTab(tabName);
  };

  const handleBackToMoreMenu = () => {
    setActiveMoreTab(null);
  };

  const handleTabChange = (value: string) => {
    setCurrentTab(value);
    if (value === 'more') {
      setActiveMoreTab(null);
    }
  };

  if (children.length === 0) {
    return (
      <div className="max-w-2xl mx-auto pt-4 px-2">
        <MedicalDisclaimer />
        <div className="text-center mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Create Child Profile</h2>
          <p className="text-gray-600 px-4">Start by creating a profile for your child</p>
        </div>
        <ChildProfileForm onCreateProfile={handleCreateProfile} />
      </div>
    );
  }

   return (
     <div className={`max-w-6xl mx-auto px-1 sm:px-2 ${deviceInfo.isMobile ? 'responsive-grid' : ''}`}>
      <MedicalDisclaimer />
      <SelfCareBanner />
      
      <div className="text-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
          PANDAS Symptom Tracker
        </h2>
        
        <div className="flex flex-col gap-4 items-center">
          <ChildSelector
            children={children}
            selectedChild={childProfile}
            onChildSelect={handleChildSelect}
            onAddChild={handleAddChild}
          />
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowChildManager(true)}
            className="flex items-center gap-2 h-12 px-4 touch-manipulation"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Manage Children</span>
            <span className="sm:hidden">Manage</span>
          </Button>
        </div>
        
        {childProfile && (
          <p className="text-sm text-gray-500 mt-3">Tracking for {childProfile.name}</p>
        )}
      </div>

      {childProfile ? (
        <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-6">
          <div className="sticky top-20 bg-background/95 backdrop-blur-sm z-40 pb-2">
            <ScrollArea className="w-full">
              <TabsList className="inline-flex h-auto p-1.5 bg-muted rounded-lg w-full">
                <div className="grid grid-cols-8 gap-0.5 sm:gap-1 w-full">
                  <TabsTrigger value="track" className="flex flex-col items-center gap-1 py-2 px-1 sm:py-3 sm:px-2 text-[10px] sm:text-xs touch-manipulation min-w-0">
                    <Activity className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span className="truncate">Track</span>
                  </TabsTrigger>
                  <TabsTrigger value="diagnosis" className="flex flex-col items-center gap-1 py-2 px-1 sm:py-3 sm:px-2 text-[10px] sm:text-xs touch-manipulation min-w-0">
                    <ListTree className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span className="truncate">Diagnosis</span>
                  </TabsTrigger>
                  <TabsTrigger value="providers" className="flex flex-col items-center gap-1 py-2 px-1 sm:py-3 sm:px-2 text-[10px] sm:text-xs touch-manipulation min-w-0">
                    <Search className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span className="truncate">Find</span>
                  </TabsTrigger>
                  <TabsTrigger value="activities" className="flex flex-col items-center gap-1 py-2 px-1 sm:py-3 sm:px-2 text-[10px] sm:text-xs touch-manipulation min-w-0">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span className="truncate">Activity</span>
                  </TabsTrigger>
                  <TabsTrigger value="food" className="flex flex-col items-center gap-1 py-2 px-1 sm:py-3 sm:px-2 text-[10px] sm:text-xs touch-manipulation min-w-0">
                    <Utensils className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span className="truncate">Food</span>
                  </TabsTrigger>
                  <TabsTrigger value="family" className="flex flex-col items-center gap-1 py-2 px-1 sm:py-3 sm:px-2 text-[10px] sm:text-xs touch-manipulation min-w-0">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span className="truncate">Family</span>
                  </TabsTrigger>
                  <TabsTrigger value="faq" className="flex flex-col items-center gap-1 py-2 px-1 sm:py-3 sm:px-2 text-[10px] sm:text-xs touch-manipulation min-w-0">
                    <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span className="truncate">FAQ</span>
                  </TabsTrigger>
                  <TabsTrigger value="more" className="flex flex-col items-center gap-1 py-2 px-1 sm:py-3 sm:px-2 text-[10px] sm:text-xs touch-manipulation min-w-0">
                    <MoreHorizontal className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span className="truncate">More</span>
                  </TabsTrigger>
                </div>
              </TabsList>
            </ScrollArea>
          </div>

          <TabsContent value="track" className="mt-6">
            <SymptomTracker 
              onAddSymptom={handleAddSymptom} 
              customSymptoms={customSymptoms}
              onAddCustomSymptom={addCustomSymptom}
            />
          </TabsContent>
          
          <TabsContent value="diagnosis" className="mt-6">
            <DiagnosisTracker />
          </TabsContent>

          <TabsContent value="providers" className="mt-6">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Search className="w-16 h-16 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  Provider Search Unavailable
                </h3>
                <p className="text-gray-500 text-center px-4">
                  This feature is temporarily disabled. Please check the "More" tab for provider tracking options.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activities" className="mt-6">
            <ActivityTracker />
          </TabsContent>

          <TabsContent value="food" className="mt-6">
            <FoodDiaryTracker />
          </TabsContent>

          <TabsContent value="family" className="mt-6">
            <FamilyManager />
          </TabsContent>

          <TabsContent value="faq" className="mt-6">
            <FAQ />
          </TabsContent>

          <TabsContent value="more" className="mt-6">
            <div className="space-y-4">
              <MoreMenu 
                activeMoreTab={activeMoreTab}
                onMoreTabClick={handleMoreTabClick}
                onBackToMenu={handleBackToMoreMenu}
              />
              
              {activeMoreTab === 'analytics' && <AdvancedAnalyticsDashboard />}
              {activeMoreTab === 'ptec' && <PTECTracker />}
              {activeMoreTab === 'selfcare' && <SelfCareGuide />}
              {activeMoreTab === 'vitals' && <VitalSignsTracker />}
              {activeMoreTab === 'treatments' && <TreatmentTracker />}
              {activeMoreTab === 'reminders' && <MedicationReminders />}
              {activeMoreTab === 'recipes' && <SupplementRecipes />}
              {activeMoreTab === 'notes' && <NotesTracker />}
              {activeMoreTab === 'history' && <SymptomChart />}
              {activeMoreTab === 'heatmap' && <SymptomHeatmap />}
              {activeMoreTab === 'providers' && <ProviderTracker />}
              {activeMoreTab === 'files' && <FileManager />}
              {activeMoreTab === 'email' && <EmailRecordsForm />}
              {activeMoreTab === 'drug-safety' && <DrugInteractionChecker />}
              {activeMoreTab === 'resources' && <ResourcesTab />}

            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <User className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              Select a Child Profile
            </h3>
            <p className="text-gray-500 text-center px-4">
              Choose a child from the dropdown above to start tracking symptoms
            </p>
          </CardContent>
        </Card>
      )}
      
      <ChildManager 
        isOpen={showChildManager} 
        onClose={() => setShowChildManager(false)} 
      />
    </div>
  );
};

export default PANDASApp;
