import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

const EDU_TABS = [
  { id: 'about', icon: '📖', label: 'What is PANS' },
  { id: 'causes', icon: '🦠', label: 'Causes' },
  { id: 'symptoms', icon: '🧠', label: 'Symptoms' },
  { id: 'treatment', icon: '💊', label: 'Treatments' },
  { id: 'school', icon: '🏫', label: 'At School' },
  { id: 'resources', icon: '🔗', label: 'Resources' },
];

const InfoCard: React.FC<{
  icon: string;
  title: string;
  color: string;
  children: React.ReactNode;
}> = ({ icon, title, color, children }) => (
  <Card className="mb-3">
    <CardContent className="p-4">
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[16px] shrink-0"
          style={{ background: color + '18' }}
        >
          {icon}
        </div>
        <p className="font-sans font-extrabold text-[13px] text-neutral-800 m-0">{title}</p>
      </div>
      <div className="font-sans text-[13px] text-neutral-600 leading-relaxed">{children}</div>
    </CardContent>
  </Card>
);

const EducationScreen: React.FC = () => {
  const [tab, setTab] = useState('about');

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div
        className="p-4 pb-3.5 flex items-center gap-3 shrink-0"
        style={{ background: 'linear-gradient(135deg, #176F91, #573F9E)' }}
      >
        <img
          src="/owl-mascot.png"
          alt="Esther"
          className="w-12 h-12 object-contain shrink-0"
          style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }}
        />
        <div>
          <p className="font-sans font-extrabold text-[10px] text-white/55 uppercase tracking-[0.08em] m-0">
            Knowledge Hub
          </p>
          <p className="font-serif text-lg text-white m-0">Learn About PANS</p>
        </div>
      </div>

      <div className="flex overflow-x-auto gap-1 px-4 py-2.5 bg-white border-b border-neutral-100 shrink-0">
        {EDU_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-[1.5px] font-sans font-extrabold text-[12px] cursor-pointer whitespace-nowrap transition-colors',
              tab === t.id
                ? 'border-primary-400 bg-primary-50 text-primary-600'
                : 'border-neutral-200 bg-transparent text-neutral-400'
            )}
          >
            <span>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24">
        {tab === 'about' && (
          <>
            <div
              className="rounded-2xl p-4 mb-4 border border-primary-100"
              style={{ background: 'linear-gradient(135deg, #EDF6F9, #F4F0FA)' }}
            >
              <p className="font-serif text-[22px] text-primary-700 mb-2">PANS & PANDAS</p>
              <p className="font-sans text-[13px] text-neutral-600 leading-relaxed m-0">
                <strong>PANS</strong> (Pediatric Acute-onset Neuropsychiatric Syndrome) is a
                clinical condition defined by the sudden onset of OCD and/or severe eating
                restrictions, plus at least two concurrent neurological, behavioral, or cognitive
                symptoms.
              </p>
            </div>
            <InfoCard icon="⚡" title="The PANDAS Subset" color="#FF4545">
              <p className="mb-2">
                <strong>PANDAS</strong> (Pediatric Autoimmune Neuropsychiatric Disorders Associated
                with Streptococcal Infections) is a specific subset of PANS triggered by Group A
                Strep (GAS) infections.
              </p>
              <p className="m-0">
                Symptoms may begin during or right after an active infection — or even a month or
                two after the infection has resolved.
              </p>
            </InfoCard>
            <InfoCard icon="🔬" title="What Happens in the Brain" color="#8A6DD2">
              <p className="mb-2">
                Researchers believe infections trigger an immune response that mistakenly targets
                the brain — specifically the basal ganglia, which controls movement and behavior.
              </p>
              <p className="m-0">
                Post-infectious autoimmunity and/or neuroinflammation are found in{' '}
                <strong>more than 80% of PANS cases</strong>.
              </p>
            </InfoCard>
            <InfoCard icon="👶" title="Who Gets PANS/PANDAS?" color="#28BC79">
              <p className="m-0">
                Most commonly affects children between ages 3 and puberty. The sudden, dramatic
                onset sets it apart from gradually developing conditions. Parents often describe
                their child as a completely different person overnight.
              </p>
            </InfoCard>
            <InfoCard icon="⏰" title="Clinical Urgency" color="#E82020">
              Early identification and treatment significantly affects long-term outcomes. Delays in
              diagnosis allow neuroinflammation to persist. If you suspect PANS/PANDAS, seek
              evaluation promptly.
            </InfoCard>
          </>
        )}

        {tab === 'causes' && (
          <>
            <div className="bg-[#FFF8E6] rounded-2xl p-4 mb-3.5 border border-[#FFE0A0]">
              <p className="font-serif text-lg text-[#A06000] mb-1.5">PANS Has Multiple Triggers</p>
              <p className="font-sans text-[13px] text-[#7A4800] leading-relaxed m-0">
                PANS can be triggered by infections, metabolic disturbances, neurological issues,
                psychosocial stress, and other inflammatory reactions. Post-infectious
                autoimmunity/neuroinflammation is found in <strong>80%+ of cases</strong>.
              </p>
            </div>
            {[
              {
                icon: '🦠',
                title: 'Group A Strep (PANDAS)',
                color: '#FF4545',
                desc: 'The most well-studied trigger. Can affect throat, perianal area, skin, or sinuses. Symptoms can appear weeks after infection resolves.',
              },
              {
                icon: '🤧',
                title: 'Other Bacterial Infections',
                color: '#E07030',
                desc: 'Mycoplasma pneumoniae, Lyme disease and other tick-borne infections, sinusitis, urinary tract infections.',
              },
              {
                icon: '🌡️',
                title: 'Viral Infections',
                color: '#C040C0',
                desc: 'Influenza, EBV (mono), herpes viruses (including HHV-6), enteroviruses. COVID-19 has also been identified as a potential trigger.',
              },
              {
                icon: '😰',
                title: 'Psychosocial Stress',
                color: '#6E50C3',
                desc: 'Severe psychosocial stress can trigger or worsen PANS symptoms in susceptible individuals.',
              },
            ].map((t, i) => (
              <InfoCard key={i} icon={t.icon} title={t.title} color={t.color}>
                {t.desc}
              </InfoCard>
            ))}
          </>
        )}

        {tab === 'symptoms' && (
          <>
            <InfoCard icon="⚡" title="Hallmark: Sudden Onset" color="#FF4545">
              The defining feature of PANS/PANDAS is the{' '}
              <strong>sudden, dramatic onset</strong> — often overnight. This sudden onset
              distinguishes it from typical childhood psychiatric conditions.
            </InfoCard>
            {[
              {
                icon: '🔄',
                title: 'OCD & Compulsive Behaviors',
                color: '#6E50C3',
                desc: 'Sudden onset of obsessions, compulsions, rituals. May be entirely new or dramatically worsened existing tendencies.',
              },
              {
                icon: '😰',
                title: 'Anxiety & Separation Anxiety',
                color: '#E07030',
                desc: 'Intense, sudden-onset fears. Refusal to separate from parents. Phobias appearing out of nowhere.',
              },
              {
                icon: '⚡',
                title: 'Tics & Motor Movements',
                color: '#F5A81A',
                desc: 'Motor tics (blinking, facial grimacing, body movements) or vocal tics may appear or worsen dramatically.',
              },
              {
                icon: '😤',
                title: 'Emotional Dysregulation / Rage',
                color: '#E82020',
                desc: 'Extreme mood swings, rage episodes disproportionate to triggers. Emotional lability.',
              },
              {
                icon: '🧠',
                title: 'Cognitive & Academic Decline',
                color: '#1F8DB5',
                desc: 'Sudden deterioration in handwriting, reading, math. Difficulty concentrating. Sensory sensitivities.',
              },
              {
                icon: '🛏️',
                title: 'Sleep & Urinary Symptoms',
                color: '#105270',
                desc: 'Urinary frequency, bedwetting after being dry, refusal to use the bathroom. Sleep disturbances.',
              },
            ].map((s, i) => (
              <InfoCard key={i} icon={s.icon} title={s.title} color={s.color}>
                {s.desc}
              </InfoCard>
            ))}
          </>
        )}

        {tab === 'treatment' && (
          <>
            <div
              className="rounded-2xl p-4 mb-3.5 border border-primary-100"
              style={{ background: 'linear-gradient(135deg, #EDF6F9, #F4F0FA)' }}
            >
              <p className="font-serif text-lg text-primary-700 mb-1.5">
                Treatment Is Multi-Modal
              </p>
              <p className="font-sans text-[13px] text-neutral-600 leading-relaxed m-0">
                PANS/PANDAS is treated by addressing the underlying cause, reducing
                neuroinflammation, and managing psychiatric symptoms. No single treatment works
                for everyone.
              </p>
            </div>
            {[
              {
                icon: '💊',
                title: 'Antibiotics',
                color: '#28BC79',
                desc: 'First-line for strep-triggered PANDAS. Amoxicillin, Azithromycin, or Augmentin. Prophylactic antibiotics may prevent recurrence.',
              },
              {
                icon: '🧪',
                title: 'Immunomodulation',
                color: '#8A6DD2',
                desc: 'IVIG and therapeutic plasma exchange (TPE/plasmapheresis) are used for severe or refractory cases. Can provide dramatic improvement.',
              },
              {
                icon: '🔥',
                title: 'Anti-inflammatories',
                color: '#E07030',
                desc: 'NSAIDs (ibuprofen) can provide rapid but temporary relief. Steroids are used cautiously due to immune effects.',
              },
              {
                icon: '🧠',
                title: 'Psychiatric / Behavioral',
                color: '#1F8DB5',
                desc: 'CBT, ERP for OCD, SSRI medications. Important: SSRIs may need lower doses and careful titration in PANS.',
              },
              {
                icon: '🌿',
                title: 'Supplements & Integrative',
                color: '#28BC79',
                desc: 'NAC, Omega-3, Vitamin D, probiotics, and other supplements are used by many families. Always discuss with your provider.',
              },
            ].map((t, i) => (
              <InfoCard key={i} icon={t.icon} title={t.title} color={t.color}>
                {t.desc}
              </InfoCard>
            ))}
          </>
        )}

        {tab === 'school' && (
          <>
            <InfoCard icon="🏫" title="Your Child Needs School Accommodations" color="#1F8DB5">
              PANS/PANDAS is a recognized medical condition that qualifies children for educational
              accommodations under Section 504 or an IEP. Don't wait for the school to offer —
              advocate proactively.
            </InfoCard>
            {[
              {
                icon: '📋',
                title: '504 Plan vs. IEP',
                color: '#6E50C3',
                desc: 'A 504 Plan provides accommodations (extended time, reduced assignments). An IEP provides specialized instruction + services. Both require documentation of medical need.',
              },
              {
                icon: '⏰',
                title: 'Attendance & Tardiness Policies',
                color: '#E07030',
                desc: 'Request attendance policy modifications. Flares may cause school refusal or inability to attend. Document in the 504/IEP.',
              },
              {
                icon: '✍️',
                title: 'OT Supports for Handwriting',
                color: '#28BC79',
                desc: 'Sudden handwriting decline is a hallmark PANS symptom. Request OT evaluation. Keyboarding accommodations are appropriate.',
              },
              {
                icon: '🧘',
                title: 'Mental Health Supports',
                color: '#F5A81A',
                desc: 'Anxiety, OCD, and emotional dysregulation require a safe, low-demand environment during flares. Consider a quiet room, flexible scheduling.',
              },
              {
                icon: '📝',
                title: 'What to Bring to the School Meeting',
                color: '#1F8DB5',
                desc: 'Bring a letter from your diagnosing physician, symptom logs from this app, documentation of academic regression, and a list of requested accommodations.',
              },
            ].map((s, i) => (
              <InfoCard key={i} icon={s.icon} title={s.title} color={s.color}>
                {s.desc}
              </InfoCard>
            ))}
          </>
        )}

        {tab === 'resources' && (
          <div className="space-y-3">
            {[
              {
                icon: '🌐',
                title: 'ASPIRE (aspire.care)',
                desc: 'The leading PANS/PANDAS research & education organization. Clinician guidelines, patient resources.',
              },
              {
                icon: '🌐',
                title: 'PANDAS Network',
                desc: 'Patient advocacy. Provider directory, research updates, family support.',
              },
              {
                icon: '🌐',
                title: 'PANDAS Physicians Network (PPN)',
                desc: 'Clinician-focused network. Treatment guidelines, case consultations.',
              },
              {
                icon: '🌐',
                title: 'ACN Latitudes',
                desc: 'Integrative health information for tics, PANS/PANDAS, and related conditions.',
              },
              {
                icon: '📄',
                title: '2017 JCAP Treatment Guidelines',
                desc: 'Swedo et al. Foundational treatment guidelines for PANS/PANDAS clinicians.',
              },
              {
                icon: '👥',
                title: 'PANDAS Parents Facebook Group',
                desc: 'Peer support community with 40,000+ members. Real-world experience sharing.',
              },
            ].map((r, i) => (
              <Card key={i}>
                <CardContent className="p-3.5 flex items-start gap-3">
                  <span className="text-xl shrink-0 mt-0.5">{r.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-sans font-extrabold text-[13px] text-primary-600 m-0">
                      {r.title}
                    </p>
                    <p className="font-sans text-[12px] text-neutral-500 mt-0.5 leading-relaxed m-0">
                      {r.desc}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EducationScreen;
