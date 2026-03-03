import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, ExternalLink } from 'lucide-react';

const InfoCard: React.FC<{ title: string; color: string; children: React.ReactNode }> = ({ title, color, children }) => (
  <Card className={`border-l-4 ${color}`}>
    <CardHeader className="pb-2">
      <CardTitle className="text-base">{title}</CardTitle>
    </CardHeader>
    <CardContent className="text-sm text-gray-700 space-y-2">{children}</CardContent>
  </Card>
);

const TriggerPill: React.FC<{ label: string }> = ({ label }) => (
  <Badge variant="secondary" className="text-xs">{label}</Badge>
);

const EducationHub: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">Education Hub</h3>
        <p className="text-gray-600">Learn about PANS/PANDAS</p>
      </div>

      <Tabs defaultValue="what" className="space-y-4">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="what" className="text-xs">What is it?</TabsTrigger>
          <TabsTrigger value="causes" className="text-xs">Causes</TabsTrigger>
          <TabsTrigger value="symptoms" className="text-xs">Symptoms</TabsTrigger>
          <TabsTrigger value="treatments" className="text-xs">Treatments</TabsTrigger>
          <TabsTrigger value="school" className="text-xs">School</TabsTrigger>
          <TabsTrigger value="resources" className="text-xs">Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="what" className="space-y-4">
          <InfoCard title="PANDAS" color="border-blue-500">
            <p><strong>Pediatric Autoimmune Neuropsychiatric Disorders Associated with Streptococcal Infections</strong></p>
            <p>PANDAS is a condition where a streptococcal (strep) infection triggers the immune system to attack the brain, causing sudden-onset OCD, tics, and other neuropsychiatric symptoms in children.</p>
            <p>First described by Dr. Susan Swedo at the NIH in 1998, PANDAS occurs when antibodies meant to fight strep cross-react with brain tissue, particularly the basal ganglia.</p>
          </InfoCard>
          <InfoCard title="PANS" color="border-purple-500">
            <p><strong>Pediatric Acute-onset Neuropsychiatric Syndrome</strong></p>
            <p>PANS is a broader diagnosis that encompasses PANDAS and includes cases triggered by infections other than strep, environmental factors, or metabolic disturbances.</p>
            <p>The hallmark feature is an abrupt, dramatic onset of OCD or severely restricted food intake, along with at least two other neuropsychiatric symptoms.</p>
          </InfoCard>
        </TabsContent>

        <TabsContent value="causes" className="space-y-4">
          <InfoCard title="Known Triggers" color="border-orange-500">
            <p>PANS/PANDAS can be triggered by various infections and factors:</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <TriggerPill label="Group A Strep" />
              <TriggerPill label="Mycoplasma Pneumoniae" />
              <TriggerPill label="Lyme Disease" />
              <TriggerPill label="Influenza" />
              <TriggerPill label="Epstein-Barr Virus" />
              <TriggerPill label="Herpes Simplex" />
              <TriggerPill label="Coxsackie Virus" />
              <TriggerPill label="Mold Exposure" />
              <TriggerPill label="Metabolic Factors" />
            </div>
          </InfoCard>
          <InfoCard title="The Autoimmune Process" color="border-red-500">
            <p>In PANS/PANDAS, the immune system produces antibodies that cross-react with neurons in the basal ganglia — a brain region involved in movement, behavior, and emotions.</p>
            <p>This process, called molecular mimicry, leads to inflammation and disruption of normal brain function, causing the characteristic sudden-onset symptoms.</p>
          </InfoCard>
        </TabsContent>

        <TabsContent value="symptoms" className="space-y-4">
          <InfoCard title="Core Diagnostic Criteria" color="border-green-500">
            <p>Abrupt, dramatic onset (often described as "overnight") of:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Obsessive-Compulsive Disorder (OCD)</li>
              <li>Severely restricted food intake</li>
              <li>Tic disorder</li>
            </ul>
          </InfoCard>
          <InfoCard title="Associated Symptoms" color="border-teal-500">
            <ul className="list-disc list-inside space-y-1">
              <li>Anxiety (separation anxiety, generalized, social)</li>
              <li>Emotional lability / depression</li>
              <li>Irritability / aggression / rage episodes</li>
              <li>Behavioral regression (baby talk, clinginess)</li>
              <li>Deterioration in handwriting or math skills</li>
              <li>Sleep disturbances / insomnia</li>
              <li>Urinary frequency / bedwetting</li>
              <li>Sensory sensitivities (light, sound, texture)</li>
              <li>Dilated pupils</li>
              <li>Hallucinations</li>
              <li>Motor abnormalities / choreiform movements</li>
              <li>Suicidal ideation (in severe cases)</li>
            </ul>
          </InfoCard>
        </TabsContent>

        <TabsContent value="treatments" className="space-y-4">
          <InfoCard title="Antibiotics" color="border-blue-500">
            <p>First-line treatment for active strep or other bacterial infections. Commonly prescribed:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Amoxicillin / Augmentin</li>
              <li>Azithromycin (Zithromax)</li>
              <li>Cephalosporins (Cefdinir, Cephalexin)</li>
              <li>Penicillin (prophylactic)</li>
            </ul>
          </InfoCard>
          <InfoCard title="Anti-Inflammatory / Immune Modulation" color="border-purple-500">
            <ul className="list-disc list-inside space-y-1">
              <li>NSAIDs (Ibuprofen / Naproxen) — reduces neuroinflammation</li>
              <li>Corticosteroids — short-term bursts for severe flares</li>
              <li>IVIG (Intravenous Immunoglobulin) — modulates immune response</li>
              <li>Plasmapheresis — removes harmful antibodies</li>
              <li>Rituximab — for refractory cases</li>
            </ul>
          </InfoCard>
          <InfoCard title="Supportive Therapies" color="border-green-500">
            <ul className="list-disc list-inside space-y-1">
              <li>Cognitive Behavioral Therapy (CBT) / Exposure Response Prevention (ERP)</li>
              <li>Supplements: Omega-3, Vitamin D, Probiotics, NAC</li>
              <li>Anti-inflammatory diet</li>
              <li>Psychiatric medication (SSRIs at low doses, if needed)</li>
              <li>Occupational therapy for sensory issues</li>
            </ul>
          </InfoCard>
        </TabsContent>

        <TabsContent value="school" className="space-y-4">
          <InfoCard title="504 Plan Accommodations" color="border-indigo-500">
            <p>Children with PANS/PANDAS may qualify for a 504 Plan. Common accommodations include:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Extended time on tests and assignments</li>
              <li>Reduced homework load during flares</li>
              <li>Preferential seating (near door, away from distractions)</li>
              <li>Frequent bathroom breaks</li>
              <li>Written instructions for all assignments</li>
              <li>Access to a safe space / counselor during anxiety episodes</li>
              <li>Modified handwriting expectations (typing allowed)</li>
              <li>Home instruction during severe flares</li>
            </ul>
          </InfoCard>
          <InfoCard title="IEP Considerations" color="border-pink-500">
            <p>For children requiring more support, an IEP (Individualized Education Program) may be appropriate under the "Other Health Impairment" category.</p>
            <p className="mt-2">Key areas to address: executive function, emotional regulation, sensory needs, social skills, and academic regression during flares.</p>
          </InfoCard>
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <InfoCard title="Organizations & Websites" color="border-cyan-500">
            <ul className="space-y-3">
              <li>
                <a href="https://www.aspire.care" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                  ASPIRE (Autoimmune Syndrome Prompted by Infection Research & Education) <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="https://www.pandasnetwork.org" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                  PANDAS Network <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="https://www.pandasppn.org" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                  PANDAS Physicians Network <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="https://www.nimh.nih.gov/health/publications/pandas" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                  NIH / NIMH PANDAS Resources <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </InfoCard>
          <InfoCard title="Books & Publications" color="border-amber-500">
            <ul className="list-disc list-inside space-y-1">
              <li>"Saving Sammy" by Beth Alison Maloney</li>
              <li>"Brain on Fire" by Susannah Cahalan</li>
              <li>"Childhood Interrupted" by Beth Alison Maloney</li>
              <li>PANS/PANDAS Clinical Guidelines (Journal of Child & Adolescent Psychopharmacology)</li>
            </ul>
          </InfoCard>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EducationHub;
