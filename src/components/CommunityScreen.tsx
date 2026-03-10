import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

const TABS = [
  { id: 'orgs', icon: '🏛️', label: 'Organizations' },
  { id: 'support', icon: '🤝', label: 'Support' },
  { id: 'providers', icon: '🩺', label: 'Find Doctors' },
  { id: 'caregiver', icon: '💜', label: 'Caregivers' },
  { id: 'research', icon: '🔬', label: 'Research' },
];

const LinkCard: React.FC<{
  icon: string;
  title: string;
  description: string;
  url?: string;
  color: string;
  tag?: string;
}> = ({ icon, title, description, url, color, tag }) => (
  <Card
    className={cn('mb-3', url && 'cursor-pointer hover:shadow-md transition-shadow')}
    onClick={() => url && window.open(url, '_blank')}
  >
    <CardContent className="p-4">
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-[18px] shrink-0"
          style={{ background: color + '18' }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-sans font-extrabold text-[13px] text-neutral-800 dark:text-neutral-100 m-0">{title}</p>
            {tag && (
              <span
                className="font-sans font-bold text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                style={{ background: color + '20', color }}
              >
                {tag}
              </span>
            )}
          </div>
          <p className="font-sans text-[12px] text-neutral-500 dark:text-neutral-400 leading-relaxed m-0">{description}</p>
          {url && (
            <p className="font-sans text-[11px] text-primary-500 mt-1.5 m-0 truncate">{url.replace('https://', '')}</p>
          )}
        </div>
        {url && <span className="text-neutral-300 dark:text-neutral-600 text-sm shrink-0 mt-1">↗</span>}
      </div>
    </CardContent>
  </Card>
);

const SectionHeader: React.FC<{ icon: string; title: string; subtitle?: string }> = ({ icon, title, subtitle }) => (
  <div className="mb-3 mt-1">
    <div className="flex items-center gap-2">
      <span className="text-base">{icon}</span>
      <p className="font-sans font-extrabold text-[14px] text-neutral-800 dark:text-neutral-100 m-0">{title}</p>
    </div>
    {subtitle && (
      <p className="font-sans text-[12px] text-neutral-400 mt-0.5 ml-7 m-0">{subtitle}</p>
    )}
  </div>
);

const BulletCard: React.FC<{
  icon: string;
  title: string;
  items: string[];
  color: string;
}> = ({ icon, title, items, color }) => (
  <Card className="mb-3">
    <CardContent className="p-4">
      <div className="flex items-center gap-2 mb-2.5">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[14px] shrink-0"
          style={{ background: color + '18' }}
        >
          {icon}
        </div>
        <p className="font-sans font-extrabold text-[13px] text-neutral-800 dark:text-neutral-100 m-0">{title}</p>
      </div>
      <ul className="list-none p-0 m-0 space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="text-[10px] mt-1 shrink-0" style={{ color }}>●</span>
            <span className="font-sans text-[12px] text-neutral-600 dark:text-neutral-300 leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </CardContent>
  </Card>
);

const CommunityScreen: React.FC = () => {
  const [tab, setTab] = useState('orgs');

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
            Community & Resources
          </p>
          <p className="font-serif text-lg text-white m-0">PANDAS/PANS Community</p>
        </div>
      </div>

      <div className="flex overflow-x-auto gap-1 px-4 py-2.5 bg-white dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-[1.5px] font-sans font-extrabold text-[12px] cursor-pointer whitespace-nowrap transition-colors',
              tab === t.id
                ? 'border-primary-400 bg-primary-50 text-primary-600'
                : 'border-neutral-200 dark:border-neutral-700 bg-transparent text-neutral-400'
            )}
          >
            <span>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24">
        {tab === 'orgs' && (
          <>
            <div
              className="rounded-2xl p-4 mb-4 border border-primary-100"
              style={{ background: 'linear-gradient(135deg, #EDF6F9, #F4F0FA)' }}
            >
              <p className="font-serif text-[22px] text-primary-700 mb-2">Key Organizations</p>
              <p className="font-sans text-[13px] text-neutral-600 dark:text-neutral-300 leading-relaxed m-0">
                These organizations are at the forefront of PANDAS/PANS research, advocacy, and family support. They provide trusted information and can connect you with knowledgeable providers.
              </p>
            </div>

            <LinkCard
              icon="🌐"
              title="PANDAS Network"
              description="Leading advocacy organization providing family support, provider directories, and awareness campaigns for PANDAS/PANS."
              url="https://pandasnetwork.org"
              color="#1F8DB5"
              tag="Advocacy"
            />
            <LinkCard
              icon="🔬"
              title="ASPIRE"
              description="Research and education hub for post-infectious autoimmune conditions including PANS/PANDAS. Clinician guidelines and patient resources."
              url="https://aspire.care"
              color="#8A6DD2"
              tag="Research"
            />
            <LinkCard
              icon="👨‍⚕️"
              title="PANDAS Physicians Network"
              description="A network of healthcare providers experienced in diagnosing and treating PANDAS/PANS. Clinical resources and provider directory."
              url="https://pandasppn.org"
              color="#28BC79"
              tag="Providers"
            />
            <LinkCard
              icon="🧪"
              title="Moleculera Labs"
              description="Creators of the Cunningham Panel — specialized blood test measuring autoimmune biomarkers associated with neuropsychiatric conditions."
              url="https://moleculeralabs.com"
              color="#E07030"
              tag="Testing"
            />
            <LinkCard
              icon="🧠"
              title="Brain on Fire Foundation"
              description="Foundation raising awareness of autoimmune encephalitis and related neuroimmune conditions affecting children and adults."
              color="#FF4545"
              tag="Awareness"
            />
            <LinkCard
              icon="📊"
              title="ACN Latitudes"
              description="Integrative health information for tics, Tourette syndrome, PANS/PANDAS, and related neurological conditions."
              url="https://latitudes.org"
              color="#F5A81A"
            />
          </>
        )}

        {tab === 'support' && (
          <>
            <div
              className="rounded-2xl p-4 mb-4 border border-[#FFE0A0]"
              style={{ background: 'linear-gradient(135deg, #FFF8E6, #FFF0D4)' }}
            >
              <p className="font-serif text-lg text-[#A06000] mb-1.5">You Are Not Alone</p>
              <p className="font-sans text-[13px] text-[#7A4800] leading-relaxed m-0">
                Connecting with other families navigating PANDAS/PANS can be one of the most powerful things you do. These communities offer real-world experience, emotional support, and practical advice.
              </p>
            </div>

            <SectionHeader icon="📘" title="Facebook Groups" subtitle="Active communities with thousands of members" />

            <LinkCard
              icon="👥"
              title="PANDAS/PANS Parents"
              description="The largest Facebook group for PANDAS/PANS families with 40,000+ members. Active daily discussions on symptoms, treatments, and doctor recommendations."
              url="https://facebook.com/groups/pandasparents"
              color="#1877F2"
              tag="40K+ members"
            />
            <LinkCard
              icon="👥"
              title="PANDAS/PANS Support Network"
              description="Supportive community focused on sharing treatment experiences, lab results, and recovery stories. Great for newly diagnosed families."
              url="https://facebook.com/groups/pandaspanssupport"
              color="#1877F2"
            />
            <LinkCard
              icon="👥"
              title="PANS/PANDAS Moms"
              description="A mothers-focused group providing emotional support and practical parenting strategies for managing flares and daily challenges."
              url="https://facebook.com/groups/pandaspansmoms"
              color="#1877F2"
            />

            <SectionHeader icon="🟠" title="Reddit Communities" subtitle="Anonymous discussion and advice" />

            <LinkCard
              icon="💬"
              title="r/PANDAS"
              description="Reddit community for discussing PANDAS/PANS diagnosis, treatment options, and sharing experiences. Good for anonymous questions."
              url="https://reddit.com/r/PANDAS"
              color="#FF4500"
            />
            <LinkCard
              icon="💬"
              title="r/Autoimmune"
              description="Broader autoimmune condition discussions including PANS/PANDAS. Useful for understanding overlapping conditions."
              url="https://reddit.com/r/Autoimmune"
              color="#FF4500"
            />

            <SectionHeader icon="📍" title="Local Support" subtitle="Find groups near you" />

            <LinkCard
              icon="🗺️"
              title="PANDAS Network Local Chapters"
              description="Find a PANDAS Network chapter in your area for local meetups, educational events, and face-to-face support from nearby families."
              url="https://pandasnetwork.org/chapters"
              color="#28BC79"
            />
            <LinkCard
              icon="🏥"
              title="Hospital Support Groups"
              description="Many children's hospitals host neuroimmune and autoimmune support groups. Ask your child's care team about local options."
              color="#6E50C3"
            />
          </>
        )}

        {tab === 'providers' && (
          <>
            <div
              className="rounded-2xl p-4 mb-4 border border-primary-100"
              style={{ background: 'linear-gradient(135deg, #EDF6F9, #F4F0FA)' }}
            >
              <p className="font-serif text-[22px] text-primary-700 mb-2">Finding the Right Doctor</p>
              <p className="font-sans text-[13px] text-neutral-600 dark:text-neutral-300 leading-relaxed m-0">
                Not all physicians are familiar with PANDAS/PANS. Finding a provider who understands and believes in the condition is critical for proper diagnosis and treatment.
              </p>
            </div>

            <SectionHeader icon="🔍" title="Provider Directories" />

            <LinkCard
              icon="📋"
              title="PANDAS Network Provider Directory"
              description="Community-curated directory of physicians experienced with PANDAS/PANS across the US and internationally. Searchable by location and specialty."
              url="https://pandasnetwork.org/find-a-provider"
              color="#1F8DB5"
              tag="Directory"
            />
            <LinkCard
              icon="📋"
              title="PANDAS Physicians Network Directory"
              description="Physician-vetted directory of providers who follow published PANS/PANDAS treatment guidelines."
              url="https://pandasppn.org/providers"
              color="#28BC79"
              tag="Directory"
            />
            <LinkCard
              icon="📋"
              title="ASPIRE Clinician Directory"
              description="Find clinicians trained in post-infectious neuroimmune conditions through ASPIRE's education programs."
              url="https://aspire.care/find-a-clinician"
              color="#8A6DD2"
              tag="Directory"
            />

            <SectionHeader icon="❓" title="Questions to Ask a Provider" subtitle="Bring these to your first appointment" />

            <BulletCard
              icon="🩺"
              title="Before the Appointment"
              items={[
                'Are you familiar with PANDAS/PANS diagnostic criteria?',
                'How many PANDAS/PANS patients have you treated?',
                'Do you follow the 2017 JCAP treatment guidelines?',
                'Will you order the Cunningham Panel or relevant bloodwork?',
                'Do you coordinate with other specialists (immunology, neurology, psychiatry)?',
              ]}
              color="#1F8DB5"
            />
            <BulletCard
              icon="💊"
              title="About Treatment Approach"
              items={[
                'What is your first-line treatment protocol?',
                'Under what circumstances do you consider IVIG or plasmapheresis?',
                'Do you prescribe prophylactic antibiotics?',
                'How do you manage psychiatric symptoms during a flare?',
                'What is your approach to chronic or relapsing cases?',
              ]}
              color="#8A6DD2"
            />

            <SectionHeader icon="💡" title="Tips for Finding Providers" />

            <BulletCard
              icon="🔑"
              title="What to Look For"
              items={[
                'Look for providers in pediatric neurology, immunology, or integrative medicine',
                'Ask in PANDAS/PANS parent groups for recommendations in your area',
                'Some families travel for initial diagnosis and work with local doctors for ongoing care',
                'Telehealth has expanded access — many PANDAS-literate doctors now see patients remotely',
                'Document everything before your visit: sudden onset date, symptom progression, and infection history',
              ]}
              color="#28BC79"
            />
          </>
        )}

        {tab === 'caregiver' && (
          <>
            <div
              className="rounded-2xl p-4 mb-4 border border-[#E8D4F8]"
              style={{ background: 'linear-gradient(135deg, #F9F0FF, #F4EAFF)' }}
            >
              <p className="font-serif text-lg text-[#7B3FA0] mb-1.5">Taking Care of the Caregiver</p>
              <p className="font-sans text-[13px] text-[#6B3590] leading-relaxed m-0">
                Caring for a child with PANDAS/PANS can be emotionally and physically exhausting. Your well-being matters. These resources are here to help you stay strong for your family.
              </p>
            </div>

            <SectionHeader icon="🧘" title="Self-Care for Caregivers" />

            <BulletCard
              icon="💜"
              title="Daily Self-Care Practices"
              items={[
                'Set small, achievable daily goals — even 10 minutes of quiet time counts',
                'Join a support group so you have an outlet with people who truly understand',
                'Ask for help — from family, friends, or respite care services',
                "Track your own stress levels alongside your child's symptoms",
                'Celebrate small wins and progress, even when setbacks happen',
                'Maintain at least one personal activity or hobby for yourself',
              ]}
              color="#8A6DD2"
            />

            <SectionHeader icon="🧠" title="Mental Health Resources" />

            <LinkCard
              icon="📞"
              title="Crisis Text Line"
              description="Text HOME to 741741 for free 24/7 crisis counseling. Available for caregivers experiencing stress, anxiety, or burnout."
              color="#28BC79"
              tag="Free"
            />
            <LinkCard
              icon="🌐"
              title="NAMI Caregiver Support"
              description="National Alliance on Mental Illness provides caregiver support groups, education programs, and a helpline for family members."
              url="https://nami.org/Support-Education/Support-Groups"
              color="#1F8DB5"
            />
            <LinkCard
              icon="💻"
              title="BetterHelp / Talkspace"
              description="Online therapy platforms offering convenient, affordable counseling. Many offer specialized support for parents of chronically ill children."
              url="https://betterhelp.com"
              color="#6E50C3"
            />

            <SectionHeader icon="👧" title="Sibling Support" subtitle="Helping brothers and sisters cope" />

            <BulletCard
              icon="🧸"
              title="Supporting Siblings"
              items={[
                'Give siblings age-appropriate explanations of what PANDAS/PANS is',
                'Validate their feelings — anger, confusion, and jealousy are normal',
                'Schedule dedicated one-on-one time with each sibling',
                'Watch for signs of stress: behavioral changes, academic decline, withdrawal',
                'Consider sibling support groups or family therapy',
                'Let them help in small ways — involvement reduces feelings of helplessness',
              ]}
              color="#F5A81A"
            />

            <SectionHeader icon="🏫" title="School Accommodations" subtitle="IEP & 504 Plan guidance" />

            <LinkCard
              icon="📋"
              title="Understood.org — IEP vs 504"
              description="Comprehensive guide explaining the differences between IEP and 504 plans, eligibility criteria, and how to request evaluations."
              url="https://understood.org/en/articles/the-difference-between-ieps-and-504-plans"
              color="#1F8DB5"
            />
            <LinkCard
              icon="📋"
              title="Wrightslaw — Special Education Law"
              description="The leading resource for special education law and advocacy. Templates, sample letters, and step-by-step guides for parents."
              url="https://wrightslaw.com"
              color="#E07030"
            />

            <BulletCard
              icon="🏫"
              title="Requesting Accommodations"
              items={[
                "Send a written request to the school citing your child's medical diagnosis",
                "Provide documentation from your child's treating physician",
                'Request extended time on tests and reduced homework during flares',
                'Ask for a quiet room or break space for anxiety and sensory episodes',
                'Include attendance flexibility — flares can cause school avoidance',
                'Bring symptom logs from this app to the school meeting as evidence',
              ]}
              color="#28BC79"
            />
          </>
        )}

        {tab === 'research' && (
          <>
            <div
              className="rounded-2xl p-4 mb-4 border border-primary-100"
              style={{ background: 'linear-gradient(135deg, #EDF6F9, #F4F0FA)' }}
            >
              <p className="font-serif text-[22px] text-primary-700 mb-2">Research & Updates</p>
              <p className="font-sans text-[13px] text-neutral-600 dark:text-neutral-300 leading-relaxed m-0">
                Stay informed about the latest scientific research, clinical trials, and institutional resources for PANDAS/PANS.
              </p>
            </div>

            <SectionHeader icon="📄" title="Key Research Papers" />

            <LinkCard
              icon="📑"
              title="2017 JCAP Treatment Guidelines"
              description="Swedo et al. — The foundational three-part clinical guideline for diagnosing and treating PANS/PANDAS. Required reading for providers."
              url="https://pubmed.ncbi.nlm.nih.gov/28722868"
              color="#8A6DD2"
              tag="Guidelines"
            />
            <LinkCard
              icon="📑"
              title="PANDAS: Current Understanding"
              description="Comprehensive review of the current understanding of PANDAS pathophysiology, diagnosis, and treatment approaches."
              url="https://pubmed.ncbi.nlm.nih.gov/31340992"
              color="#1F8DB5"
            />
            <LinkCard
              icon="📑"
              title="Cunningham Panel Validation Studies"
              description="Research validating the use of anti-neuronal antibody panels in diagnosing infection-triggered autoimmune neuropsychiatric disorders."
              url="https://moleculeralabs.com/research"
              color="#E07030"
            />

            <SectionHeader icon="🏛️" title="Institutional Resources" />

            <LinkCard
              icon="🇺🇸"
              title="NIH — PANDAS Information"
              description="National Institute of Mental Health fact sheet on PANDAS including definition, symptoms, diagnosis, and current research efforts."
              url="https://www.nimh.nih.gov/health/publications/pandas"
              color="#105270"
              tag="NIH"
            />
            <LinkCard
              icon="🏥"
              title="Stanford PANS Clinic"
              description="One of the leading clinical and research programs for PANS/PANDAS. Resources for families and referring providers."
              url="https://med.stanford.edu/pans"
              color="#8A6DD2"
            />
            <LinkCard
              icon="🏥"
              title="Georgetown PANS Program"
              description="Georgetown University Medical Center's dedicated PANS research and clinical program led by experienced specialists."
              url="https://gumc.georgetown.edu/pans"
              color="#28BC79"
            />

            <SectionHeader icon="🔎" title="Clinical Trials" subtitle="Find active studies" />

            <LinkCard
              icon="🧪"
              title="ClinicalTrials.gov — PANDAS/PANS"
              description="Search active and recruiting clinical trials for PANDAS and PANS. Filter by location, age, and intervention type."
              url="https://clinicaltrials.gov/search?cond=PANDAS+PANS"
              color="#28BC79"
              tag="Active Trials"
            />
            <LinkCard
              icon="🧪"
              title="ASPIRE Research Studies"
              description="Current and upcoming research studies conducted through ASPIRE's network of academic institutions and clinical partners."
              url="https://aspire.care/research"
              color="#6E50C3"
            />

            <SectionHeader icon="📬" title="Stay Updated" />

            <LinkCard
              icon="📧"
              title="PANDAS Network Newsletter"
              description="Monthly updates on research breakthroughs, community events, advocacy efforts, and family resources. Free to subscribe."
              url="https://pandasnetwork.org/newsletter"
              color="#1F8DB5"
            />
            <LinkCard
              icon="🎙️"
              title="PANDAS/PANS Podcasts & Webinars"
              description="Listen to interviews with leading researchers and clinicians. ASPIRE and PANDAS Network regularly host educational webinars."
              url="https://aspire.care/webinars"
              color="#F5A81A"
            />
          </>
        )}
      </div>
    </div>
  );
};

export default CommunityScreen;
