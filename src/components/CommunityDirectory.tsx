import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import {
  collection, query, getDocs, addDoc, doc, updateDoc, increment, setDoc, getDoc, serverTimestamp, orderBy,
} from 'firebase/firestore';
import { US_STATES, PROVIDER_SPECIALTIES } from '@/types/pandas';
import { Globe, ThumbsUp, Search, Plus, Info, ExternalLink } from 'lucide-react';

interface Provider {
  id: string;
  name: string;
  specialty: string;
  practice?: string;
  city: string;
  state: string;
  website?: string;
  notes?: string;
  votes: number;
}

const SEED_PROVIDERS: Omit<Provider, 'id'>[] = [
  { name: 'Dr. Susan Swedo', specialty: 'Pediatric Neurologist', city: 'Bethesda', state: 'MD', votes: 0, notes: 'NIH researcher who first described PANDAS' },
  { name: 'Dr. Tanya Murphy', specialty: 'Pediatric Psychiatrist', city: 'Tampa', state: 'FL', votes: 0, notes: 'University of South Florida PANS/PANDAS clinic' },
  { name: 'Dr. Dritan Agalliu', specialty: 'Pediatric Neurologist', city: 'New York', state: 'NY', votes: 0, notes: 'Columbia University PANDAS researcher' },
  { name: 'Dr. Madeleine Cunningham', specialty: 'Pediatric Immunologist', city: 'Oklahoma City', state: 'OK', votes: 0, notes: 'Creator of the Cunningham Panel' },
  { name: 'Dr. Rosario Trifiletti', specialty: 'Pediatric Neurologist', city: 'Ramsey', state: 'NJ', votes: 0, notes: 'Specializes in PANDAS/PANS diagnosis and treatment' },
];

const CommunityDirectory: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState('all');
  const [filterState, setFilterState] = useState('all');
  const [sortBy, setSortBy] = useState<'votes' | 'name'>('votes');
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '', specialty: '', practice: '', city: '', state: '', website: '', notes: '',
  });

  const fetchProviders = async () => {
    try {
      const snap = await getDocs(query(collection(db, 'community_providers'), orderBy('votes', 'desc')));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Provider));
      setProviders(data.length > 0 ? data : SEED_PROVIDERS.map((p, i) => ({ ...p, id: `seed-${i}` })));
    } catch {
      setProviders(SEED_PROVIDERS.map((p, i) => ({ ...p, id: `seed-${i}` })));
    } finally {
      setLoading(false);
    }
  };

  const fetchVotes = async () => {
    if (!user) return;
    try {
      const snap = await getDocs(collection(db, 'user_votes'));
      const myVotes = snap.docs.filter(d => d.data().user_id === user.uid).map(d => d.data().provider_id);
      setVotedIds(new Set(myVotes));
    } catch { /* ignore */ }
  };

  useEffect(() => {
    fetchProviders();
    fetchVotes();
  }, [user]);

  const handleVote = async (providerId: string) => {
    if (!user || votedIds.has(providerId) || providerId.startsWith('seed-')) return;
    try {
      const voteDocId = `${user.uid}_${providerId}`;
      const voteRef = doc(db, 'user_votes', voteDocId);
      const existing = await getDoc(voteRef);
      if (existing.exists()) {
        toast({ title: 'Already Voted', description: 'You already voted for this provider' });
        return;
      }
      await setDoc(voteRef, { user_id: user.uid, provider_id: providerId, created_at: serverTimestamp() });
      await updateDoc(doc(db, 'community_providers', providerId), { votes: increment(1) });
      setVotedIds(prev => new Set([...prev, providerId]));
      setProviders(prev => prev.map(p => p.id === providerId ? { ...p, votes: p.votes + 1 } : p));
      toast({ title: 'Voted!', description: 'Thank you for your recommendation' });
    } catch {
      toast({ title: 'Error', description: 'Failed to vote', variant: 'destructive' });
    }
  };

  const handleAddProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.name || !form.specialty || !form.city || !form.state) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'community_providers'), {
        ...form,
        votes: 0,
        added_by: user.uid,
        created_at: serverTimestamp(),
      });
      setForm({ name: '', specialty: '', practice: '', city: '', state: '', website: '', notes: '' });
      toast({ title: 'Added', description: 'Provider added to directory' });
      await fetchProviders();
    } catch {
      toast({ title: 'Error', description: 'Failed to add provider', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = providers
    .filter(p => {
      if (searchTerm) {
        const s = searchTerm.toLowerCase();
        if (!p.name.toLowerCase().includes(s) && !p.city.toLowerCase().includes(s) && !(p.practice || '').toLowerCase().includes(s)) return false;
      }
      if (filterSpecialty !== 'all' && p.specialty !== filterSpecialty) return false;
      if (filterState !== 'all' && p.state !== filterState) return false;
      return true;
    })
    .sort((a, b) => sortBy === 'votes' ? b.votes - a.votes : a.name.localeCompare(b.name));

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold mb-2">Community Provider Directory</h3>
        <p className="text-gray-600">Find and recommend PANDAS/PANS providers</p>
      </div>

      <Tabs defaultValue="browse" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="browse" className="flex items-center gap-1 text-xs">
            <Search className="w-3 h-3" /> Browse
          </TabsTrigger>
          <TabsTrigger value="add" className="flex items-center gap-1 text-xs">
            <Plus className="w-3 h-3" /> Add
          </TabsTrigger>
          <TabsTrigger value="about" className="flex items-center gap-1 text-xs">
            <Info className="w-3 h-3" /> About
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          <Card>
            <CardContent className="pt-4 space-y-3">
              <Input
                placeholder="Search by name, city, or practice..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                <Select value={filterSpecialty} onValueChange={setFilterSpecialty}>
                  <SelectTrigger className="w-[180px]"><SelectValue placeholder="Specialty" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Specialties</SelectItem>
                    {PROVIDER_SPECIALTIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={filterState} onValueChange={setFilterState}>
                  <SelectTrigger className="w-[120px]"><SelectValue placeholder="State" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    {US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={v => setSortBy(v as 'votes' | 'name')}>
                  <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="votes">Most Voted</SelectItem>
                    <SelectItem value="name">Name A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading providers...</div>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">No providers match your search</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filtered.map(p => (
                <Card key={p.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium">{p.name}</h4>
                        <Badge variant="secondary" className="text-xs mt-1">{p.specialty}</Badge>
                        {p.practice && <div className="text-sm text-gray-600 mt-1">{p.practice}</div>}
                        <div className="text-sm text-gray-500 mt-1">{p.city}, {p.state}</div>
                        {p.notes && <div className="text-xs text-gray-500 mt-2">{p.notes}</div>}
                        {p.website && (
                          <a href={p.website.startsWith('http') ? p.website : `https://${p.website}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1">
                            Website <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <Button
                        variant={votedIds.has(p.id) ? 'secondary' : 'outline'}
                        size="sm"
                        onClick={() => handleVote(p.id)}
                        disabled={votedIds.has(p.id) || p.id.startsWith('seed-')}
                        className="flex items-center gap-1 ml-3"
                      >
                        <ThumbsUp className="w-3 h-3" />
                        {p.votes}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="add">
          <Card>
            <CardHeader>
              <CardTitle>Add a Provider</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddProvider} className="space-y-4">
                <div>
                  <Label>Provider Name *</Label>
                  <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
                </div>
                <div>
                  <Label>Specialty *</Label>
                  <Select value={form.specialty} onValueChange={v => setForm(p => ({ ...p, specialty: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select specialty" /></SelectTrigger>
                    <SelectContent>
                      {PROVIDER_SPECIALTIES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Practice Name</Label>
                  <Input value={form.practice} onChange={e => setForm(p => ({ ...p, practice: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>City *</Label>
                    <Input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} required />
                  </div>
                  <div>
                    <Label>State *</Label>
                    <Select value={form.state} onValueChange={v => setForm(p => ({ ...p, state: v }))}>
                      <SelectTrigger><SelectValue placeholder="State" /></SelectTrigger>
                      <SelectContent>
                        {US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Website</Label>
                  <Input value={form.website} onChange={e => setForm(p => ({ ...p, website: e.target.value }))} placeholder="https://..." />
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Any helpful info about this provider..." />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? 'Adding...' : 'Add Provider'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="about">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                About the Community Directory
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-700">
              <p>This directory is built by and for the PANS/PANDAS community. Providers listed here have been recommended by other families.</p>
              <p><strong>How it works:</strong></p>
              <ul className="list-disc list-inside space-y-1">
                <li>Browse providers by specialty, state, or search by name</li>
                <li>Vote for providers you recommend (one vote per provider)</li>
                <li>Add new providers you've had positive experiences with</li>
              </ul>
              <p className="text-xs text-gray-500 mt-4">Disclaimer: Listing in this directory does not constitute an endorsement. Always consult with your healthcare team before making treatment decisions.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CommunityDirectory;
