import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MagicLinkGenerator } from './MagicLinkGenerator';
import { MagicLinkManager } from './MagicLinkManager';
import { Link2, Settings, Shield, Info } from 'lucide-react';

export const ProviderAccessManager: React.FC = () => {
    return (
        <div className="space-y-6">
            {/* Info Banner */}
            <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                            <h4 className="font-semibold text-blue-900 mb-2">Secure Provider Access</h4>
                            <p className="text-sm text-blue-800 mb-3">
                                Generate secure, time-limited links to share your child's medical data with healthcare providers.
                                These links don't require providers to create accounts and automatically expire for security.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-blue-700">
                                <div>
                                    <h5 className="font-medium mb-1">Security Features:</h5>
                                    <ul className="space-y-1">
                                        <li>• Cryptographically secure tokens</li>
                                        <li>• Automatic expiration</li>
                                        <li>• Access count limits</li>
                                        <li>• Detailed audit logs</li>
                                    </ul>
                                </div>
                                <div>
                                    <h5 className="font-medium mb-1">Best Practices:</h5>
                                    <ul className="space-y-1">
                                        <li>• Set appropriate expiration times</li>
                                        <li>• Only grant necessary permissions</li>
                                        <li>• Share links through secure channels</li>
                                        <li>• Revoke access when no longer needed</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Main Tabs */}
            <Tabs defaultValue="generate" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="generate" className="flex items-center gap-2">
                        <Link2 className="w-4 h-4" />
                        Generate Link
                    </TabsTrigger>
                    <TabsTrigger value="manage" className="flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Manage Links
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="generate">
                    <MagicLinkGenerator />
                </TabsContent>

                <TabsContent value="manage">
                    <MagicLinkManager />
                </TabsContent>
            </Tabs>

            {/* Security Notice */}
            <Card className="border-amber-200 bg-amber-50">
                <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div>
                            <h4 className="font-semibold text-amber-900 mb-2">Important Security Notice</h4>
                            <p className="text-sm text-amber-800">
                                Provider access links contain sensitive medical information. Always verify the recipient's
                                identity before sharing and use secure communication methods (encrypted email, secure messaging).
                                Never share these links on social media or unsecured platforms.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};