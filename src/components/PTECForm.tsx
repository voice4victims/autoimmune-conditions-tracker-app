import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, ArrowLeft, ArrowRight } from 'lucide-react';
import PTECPatientDetails from './PTECPatientDetails';

interface PTECFormProps {
  onSubmit: (data: any) => void;
  onCancel?: () => void;
}

const symptomCategories = [
  {
    name: 'Behavior/Mood',
    symptoms: [
      'Anxiety/fear', 'Irritability', 'Aggression', 'Oppositional behavior',
      'Emotional lability', 'Depression/sadness', 'Suicidal thoughts/behaviors',
      'Temper tantrums/rages', 'Inappropriate laughter/silliness'
    ]
  },
  {
    name: 'Cognitive',
    symptoms: [
      'Difficulty concentrating', 'Memory problems', 'Confusion/disorientation',
      'Intrusive thoughts', 'Academic decline', 'Handwriting deterioration',
      'Math difficulties', 'Reading difficulties'
    ]
  },
  {
    name: 'Sensory',
    symptoms: [
      'Sensitivity to light', 'Sensitivity to sound', 'Sensitivity to touch',
      'Sensitivity to smell', 'Sensitivity to taste', 'Visual hallucinations',
      'Auditory hallucinations'
    ]
  },
  {
    name: 'Motor',
    symptoms: [
      'Motor tics', 'Vocal tics', 'Choreiform movements', 'Handwriting changes',
      'Clumsiness', 'Joint pain', 'Muscle weakness'
    ]
  },
  {
    name: 'Sleep',
    symptoms: [
      'Difficulty falling asleep', 'Difficulty staying asleep', 'Nightmares',
      'Night terrors', 'Bedwetting', 'Daytime fatigue'
    ]
  },
  {
    name: 'Physical',
    symptoms: [
      'Urinary frequency/urgency', 'Headaches', 'Abdominal pain', 
      'Nausea', 'Loss of appetite', 'Excessive appetite'
    ]
  }
];

const PTECForm: React.FC<PTECFormProps> = ({ onSubmit, onCancel }) => {
  const [step, setStep] = useState(0);
  const [consent, setConsent] = useState(false);
  const [formData, setFormData] = useState<any>({
    patientDetails: {},
    symptoms: {}
  });
  const [submitted, setSubmitted] = useState(false);

  const updatePatientDetails = (data: any) => {
    setFormData((prev: any) => ({
      ...prev,
      patientDetails: data
    }));
  };

  const updateSymptom = (category: string, symptom: string, value: number) => {
    setFormData((prev: any) => ({
      ...prev,
      symptoms: {
        ...prev.symptoms,
        [`${category}-${symptom}`]: value
      }
    }));
  };

  const calculateScore = () => {
    return Object.values(formData.symptoms).reduce((sum: number, val: any) => sum + (val || 0), 0);
  };

  const handleSubmit = () => {
    const score = calculateScore();
    onSubmit({ ...formData, score, date: new Date().toISOString() });
    setSubmitted(true);
  };

  if (submitted) {
    const score = calculateScore();
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            PTEC Submitted
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-semibold text-lg">Total Score: {score} / 306</p>
                <p className="text-sm">
                  Higher scores indicate more severe symptoms. Use this score to compare with future evaluations.
                </p>
              </div>
            </AlertDescription>
          </Alert>
          <Button onClick={onCancel} className="w-full">Close</Button>
        </CardContent>
      </Card>
    );
  }

  if (step === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>PTEC Consent</CardTitle>
          <CardDescription>
            PANS/PANDAS Treatment and Flare Evaluation Checklist
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This tool tracks symptom changes over time. Scores range from 0 (no symptoms) to 306 (most severe). 
              It is NOT a diagnostic tool but helps compare symptoms at different time points.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <div className="flex items-start space-x-2">
              <Checkbox 
                id="consent" 
                checked={consent}
                onCheckedChange={(checked) => setConsent(checked as boolean)}
              />
              <Label htmlFor="consent" className="text-sm leading-relaxed">
                I consent to participate and understand that my responses will be stored securely. 
                I am at least 18 years old.
              </Label>
            </div>
          </div>

          <div className="flex gap-2">
            {onCancel && (
              <Button onClick={onCancel} variant="outline" className="flex-1">
                Cancel
              </Button>
            )}
            <Button onClick={() => setStep(1)} disabled={!consent} className="flex-1">
              Continue <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 1) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Patient Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <PTECPatientDetails 
            data={formData.patientDetails}
            onChange={updatePatientDetails}
          />
          <div className="flex gap-2">
            <Button onClick={() => setStep(0)} variant="outline" className="flex-1">
              <ArrowLeft className="mr-2 w-4 h-4" /> Back
            </Button>
            <Button onClick={() => setStep(2)} className="flex-1">
              Next <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const categoryIndex = step - 2;
  if (categoryIndex < symptomCategories.length) {
    const category = symptomCategories[categoryIndex];
    return (
      <Card>
        <CardHeader>
          <CardTitle>{category.name}</CardTitle>
          <CardDescription>
            Rate each symptom: 0=Not a problem, 1=Minor, 2=Moderate, 3=Serious
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {category.symptoms.map((symptom) => (
            <div key={symptom} className="space-y-2">
              <Label>{symptom}</Label>
              <div className="grid grid-cols-4 gap-2">
                {[0, 1, 2, 3].map((value) => (
                  <Button
                    key={value}
                    variant={formData.symptoms[`${category.name}-${symptom}`] === value ? 'default' : 'outline'}
                    onClick={() => updateSymptom(category.name, symptom, value)}
                    className="w-full"
                  >
                    {value}
                  </Button>
                ))}
              </div>
            </div>
          ))}
          <div className="flex gap-2 pt-4">
            <Button onClick={() => setStep(step - 1)} variant="outline" className="flex-1">
              <ArrowLeft className="mr-2 w-4 h-4" /> Back
            </Button>
            <Button 
              onClick={() => categoryIndex === symptomCategories.length - 1 ? handleSubmit() : setStep(step + 1)} 
              className="flex-1"
            >
              {categoryIndex === symptomCategories.length - 1 ? 'Submit' : 'Next'} 
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};

export default PTECForm;
