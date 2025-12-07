import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, AlertTriangle, FileText } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const DrugInteractionChecker: React.FC = () => {
  const handleDrugsComClick = () => {
    window.open('https://www.drugs.com/drug_interactions.html', '_blank', 'noopener,noreferrer');
  };

  const handleFDAClick = () => {
    window.open('https://www.fda.gov/safety/medwatch-fda-safety-information-and-adverse-event-reporting-program', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Drug Safety Resources</h2>
        <p className="text-gray-600">Important tools for medication safety and reporting</p>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Always consult with your healthcare provider before making any changes to medications.
          These tools are for informational purposes only.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Drug Interaction Checker
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Check for potential interactions between medications your child is taking.
              This tool helps identify possible drug interactions that could affect treatment.
            </p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>• Check multiple medications at once</li>
              <li>• Comprehensive interaction database</li>
              <li>• Severity ratings for interactions</li>
              <li>• Professional drug information</li>
            </ul>
            <Button 
              onClick={handleDrugsComClick}
              className="w-full flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Check Drug Interactions on Drugs.com
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Report Side Effects
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">
              Report adverse reactions or side effects from medications to the FDA.
              Your reports help improve medication safety for everyone.
            </p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>• Report serious side effects</li>
              <li>• Help improve drug safety</li>
              <li>• Confidential reporting system</li>
              <li>• No medical advice provided</li>
            </ul>
            <Button 
              onClick={handleFDAClick}
              variant="outline"
              className="w-full flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Report to FDA MedWatch
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How to Use These Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Drug Interaction Checker:</h4>
              <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                <li>Click the "Check Drug Interactions" button above</li>
                <li>Enter all medications your child is currently taking</li>
                <li>Review the interaction results carefully</li>
                <li>Discuss any concerning interactions with your doctor</li>
              </ol>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Reporting Side Effects:</h4>
              <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                <li>Click the "Report to FDA MedWatch" button above</li>
                <li>Complete the online form with details about the side effect</li>
                <li>Include medication name, dosage, and reaction details</li>
                <li>Submit the report to help improve medication safety</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DrugInteractionChecker;