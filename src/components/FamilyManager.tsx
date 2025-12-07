import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FamilyInviteForm } from './FamilyInviteForm';
import { FamilyAcceptInvite } from './FamilyAcceptInvite';
import { InviteCodeRetrieval } from './InviteCodeRetrieval';
import { FamilyAccessManager } from './FamilyAccessManager';
import { useIsMobile } from '@/hooks/use-mobile';

export const FamilyManager: React.FC = () => {
  const isMobile = useIsMobile();

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="px-1">
        <h2 className="text-xl md:text-2xl font-bold mb-2">Family Access</h2>
        <p className="text-sm md:text-base text-muted-foreground">
          Share access to your child's data with other parents or caregivers.
        </p>
      </div>
      
      <Tabs defaultValue="invite" className="w-full">
        {isMobile ? (
          <ScrollArea className="w-full whitespace-nowrap">
            <TabsList className="inline-flex h-9 items-center justify-start rounded-lg bg-muted p-1 text-muted-foreground w-max">
              <TabsTrigger value="invite" className="text-xs px-2 py-1">Invite</TabsTrigger>
              <TabsTrigger value="codes" className="text-xs px-2 py-1">Codes</TabsTrigger>
              <TabsTrigger value="manage" className="text-xs px-2 py-1">Manage</TabsTrigger>
              <TabsTrigger value="join" className="text-xs px-2 py-1">Join</TabsTrigger>
            </TabsList>
          </ScrollArea>
        ) : (
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="invite">Send Invitation</TabsTrigger>
            <TabsTrigger value="codes">View Codes</TabsTrigger>
            <TabsTrigger value="manage">Manage Access</TabsTrigger>
            <TabsTrigger value="join">Join Family</TabsTrigger>
          </TabsList>
        )}
        
        <TabsContent value="invite" className="space-y-4 mt-4">
          <FamilyInviteForm />
        </TabsContent>
        
        <TabsContent value="codes" className="space-y-4 mt-4">
          <InviteCodeRetrieval />
        </TabsContent>
        
        <TabsContent value="manage" className="space-y-4 mt-4">
          <FamilyAccessManager />
        </TabsContent>
        
        <TabsContent value="join" className="space-y-4 mt-4">
          <FamilyAcceptInvite />
        </TabsContent>
      </Tabs>
    </div>
  );
};