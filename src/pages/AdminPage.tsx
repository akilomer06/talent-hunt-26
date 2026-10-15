import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Trophy,
  Flame,
  Search,
  FileSpreadsheet,
  Trash2,
  RefreshCw,
  Save,
  CheckCircle2,
  Database,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  Lock,
  ExternalLink,
  Code2,
  Gamepad2,
  Building2,
  Calendar,
  Clock,
  Sparkles,
  ClipboardList,
  Layers,
  ArrowRight,
  LogOut,
  Globe,
  SlidersHorizontal,
} from 'lucide-react';
import {
  fetchRegistrations,
  deleteRegistration,
  saveLiveEvents,
  saveLiveSettings,
  fetchLiveSiteContent,
  type RegistrationRecord,
  type SiteSettings,
  DEFAULT_SITE_SETTINGS,
  loginAdmin,
  logoutAdmin,
  checkBackendHealth,
} from '../lib/supabase';
import { type EventItem, EVENTS as INITIAL_EVENTS } from '../data/eventsData';

interface AdminPageProps {
  onBack: () => void;
}



export const AdminPage: React.FC<AdminPageProps> = ({ onBack }) => {
  // Always enforce LIGHT THEME inside the Admin Portal
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const hadDark = root.classList.contains('dark') || body.classList.contains('dark');
    const hadGame = root.classList.contains('game') || body.classList.contains('game');

    root.classList.remove('dark', 'game');
    body.classList.remove('dark', 'game');

    return () => {
      if (hadDark) {
        root.classList.add('dark');
        body.classList.add('dark');
      }
      if (hadGame) {
        root.classList.add('game');
        body.classList.add('game');
      }
    };
  }, []);

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  useEffect(() => { setIsAuthenticated(!!sessionStorage.getItem('th26_admin_token')); }, []);
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState('');

  // Active Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'roster' | 'editor' | 'database'>('overview');

  // Data states
  const [registrations, setRegistrations] = useState<RegistrationRecord[]>([]);
  const [events, setEvents] = useState<EventItem[]>(INITIAL_EVENTS);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);

  // Filter & Search states for roster
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventFilter, setSelectedEventFilter] = useState('all');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('all');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Editor states
  const defaultEvent = INITIAL_EVENTS[0]!;
  const [editingEventId, setEditingEventId] = useState<string>(defaultEvent.id);
  const [eventDraft, setEventDraft] = useState<EventItem>(defaultEvent);
  const [newRule, setNewRule] = useState('');
  const [settingsDraft, setSettingsDraft] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [saveStatus, setSaveStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Load initial data
  const loadData = async () => {
    setRefreshing(true);
    try {
      const [regs, { events: liveEvents, settings: liveSettings }] = await Promise.all([
        fetchRegistrations(),
        fetchLiveSiteContent(),
      ]);
      setRegistrations(regs);
      setEvents(liveEvents);
      setSettings(liveSettings);
      setSettingsDraft(liveSettings);

      const currentDraft = liveEvents.find((e) => e.id === editingEventId) || liveEvents[0] || defaultEvent;
      setEventDraft(currentDraft);

      // Check DB connection
      setDbConnected(await checkBackendHealth());
    } catch {
      setDbConnected(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  // Auth handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loginAdmin(passcode);
      setIsAuthenticated(true);
      setAuthError('');
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Unable to sign in');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    logoutAdmin();
  };

  // Event Selection in editor
  const handleSelectEditingEvent = (id: string) => {
    setEditingEventId(id);
    const found = events.find((e) => e.id === id);
    if (found) {
      setEventDraft(JSON.parse(JSON.stringify(found)));
    }
    setSaveStatus(null);
  };

  const handleSaveEvent = async () => {
    const updatedEvents = events.map((e) => (e.id === eventDraft.id ? eventDraft : e));
    try {
      await saveLiveEvents(updatedEvents);
      setEvents(updatedEvents);
      setSaveStatus({ message: 'Event saved on the live website.', type: 'success' });
    } catch (error) {
      setSaveStatus({ message: error instanceof Error ? error.message : 'Save failed', type: 'error' });
    }
  };

  const handleSaveSettings = async () => {
    try {
      await saveLiveSettings(settingsDraft);
      setSettings(settingsDraft);
      setSaveStatus({ message: 'Website information saved.', type: 'success' });
    } catch (error) {
      setSaveStatus({ message: error instanceof Error ? error.message : 'Save failed', type: 'error' });
    }
  };

  const handleDeleteRegistration = async (regId: string, name: string) => {
    if (!window.confirm('Delete registration for ' + name + ' (' + regId + ')?')) return;
    try {
      await deleteRegistration(regId);
      setRegistrations((prev) => prev.filter((r) => r.reg_id !== regId));
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Delete failed');
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (registrations.length === 0) {
      alert('No registrations available to export.');
      return;
    }

    const headers = [
      'Registration ID',
      'Name',
      'RRN',
      'Mobile',
      'Programme',
      'Year',
      'Department',
      'Section',
      'Selected Events',
      'Team Count',
      'Team Members Details',
      'Registration Date',
    ];

    const rows = registrations.map((r) => [
      `"${r.reg_id}"`,
      `"${r.name.replace(/"/g, '""')}"`,
      `"${r.rrn}"`,
      `"${r.mobile}"`,
      `"${r.programme}"`,
      `"${r.year}"`,
      `"${r.department}"`,
      `"${r.section || ''}"`,
      `"${r.selected_events.map((id) => events.find((e) => e.id === id)?.title || id).join(', ')}"`,
      `"${r.team_members?.length || 0}"`,
      `"${(r.team_members || []).map((m) => `${m.event_id ? (events.find(event => event.id === m.event_id)?.title || m.event_id) + ": " : ""}${m.name} (${m.rrn}${m.section ? ` Sec ${m.section}` : ''})`).join('; ')}"`,
      `"${r.created_at ? new Date(r.created_at).toLocaleString() : ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Talent-Hunt-2K26-Registrations-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Metrics calculation
  const metrics = useMemo(() => {
    const totalRegs = registrations.length;
    let totalParticipants = 0;
    const eventCounts: Record<string, number> = {};
    const deptCounts: Record<string, number> = {};
    const yearCounts: Record<string, number> = {};

    events.forEach((e) => {
      eventCounts[e.id] = 0;
    });

    registrations.forEach((r) => {
      totalParticipants += new Set([r.rrn, ...(r.team_members || []).map(member => member.rrn)].map(rrn => rrn.trim().toLowerCase())).size;
      deptCounts[r.department] = (deptCounts[r.department] || 0) + 1;
      yearCounts[r.year] = (yearCounts[r.year] || 0) + 1;
      r.selected_events.forEach((evId) => {
        eventCounts[evId] = (eventCounts[evId] || 0) + 1;
      });
    });

    let topEventTitle = 'Awaiting entries';
    let topEventCount = 0;
    Object.entries(eventCounts).forEach(([id, cnt]) => {
      if (cnt > topEventCount) {
        topEventCount = cnt;
        topEventTitle = events.find((e) => e.id === id)?.title || id;
      }
    });

    return { totalRegs, totalParticipants, eventCounts, deptCounts, yearCounts, topEventTitle, topEventCount };
  }, [registrations, events]);

  // Filtered registrations
  const filteredRegistrations = useMemo(() => {
    return registrations.filter((r) => {
      const matchesSearch =
        !searchQuery ||
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.rrn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.mobile.includes(searchQuery) ||
        r.reg_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.section && r.section.toLowerCase().includes(searchQuery.toLowerCase())) ||
        r.selected_events.some((e) => e.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesEvent =
        selectedEventFilter === 'all' || r.selected_events.includes(selectedEventFilter);

      const matchesDept =
        selectedDeptFilter === 'all' || r.department.toLowerCase() === selectedDeptFilter.toLowerCase();

      return matchesSearch && matchesEvent && matchesDept;
    });
  }, [registrations, searchQuery, selectedEventFilter, selectedDeptFilter]);

  // Passcode login modal
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans text-slate-800">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200/80 p-8">
          <div className="flex items-center gap-3.5 mb-6 pb-5 border-b border-slate-100">
            <div className="w-12 h-12 bg-amber-500/10 text-amber-600 rounded-xl flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider">
                Department of CSE
              </span>
              <h2 className="text-xl font-bold text-slate-900">
                Talent Hunt 2K26 Admin
              </h2>
            </div>
          </div>

          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            Enter the admin passcode to access live registration counts, manage participant rosters, and edit website event cards.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Admin Passcode
              </label>
              <input
                type="password"
                required
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="Enter admin passcode"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all font-mono"
                autoFocus
              />
              {authError && <p className="text-red-500 text-xs mt-1.5 font-medium">{authError}</p>}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-sm rounded-lg shadow-sm hover:shadow transition-all"
            >
              Unlock Dashboard
            </button>

            <button
              type="button"
              onClick={onBack}
              className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 font-medium text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Public Site
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">Use the passcode provided by your site administrator.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors"
              title="Return to Public Website"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-600 tracking-wide uppercase">
                  Talent Hunt 2K26
                </span>
                <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                  dbConnected ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${dbConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                  {dbConnected ? 'Live Supabase' : 'Local + Cloud Sync'}
                </span>
              </div>
              <h1 className="text-lg font-bold text-slate-900 leading-snug">
                Organizer Dashboard & CMS
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh Data</span>
            </button>

            <button
              onClick={onBack}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">View Site</span>
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium rounded-lg transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-1 overflow-x-auto border-t border-slate-100 pt-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2.5 px-4 text-xs font-semibold rounded-t-lg transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'text-amber-600 border-b-2 border-amber-600 bg-amber-50/40'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Dashboard Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('roster')}
            className={`py-2.5 px-4 text-xs font-semibold rounded-t-lg transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'roster'
                ? 'text-amber-600 border-b-2 border-amber-600 bg-amber-50/40'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Registrations Roster</span>
            <span className="bg-slate-100 text-slate-600 text-[10px] font-mono px-1.5 py-0.2 rounded-full">
              {registrations.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('editor')}
            className={`py-2.5 px-4 text-xs font-semibold rounded-t-lg transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'editor'
                ? 'text-amber-600 border-b-2 border-amber-600 bg-amber-50/40'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Website CMS & Cards</span>
          </button>

          <button
            onClick={() => setActiveTab('database')}
            className={`py-2.5 px-4 text-xs font-semibold rounded-t-lg transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'database'
                ? 'text-amber-600 border-b-2 border-amber-600 bg-amber-50/40'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Supabase Cloud Config</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        {saveStatus && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs sm:text-sm font-medium flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{saveStatus.message}</span>
            </div>
            <button onClick={() => setSaveStatus(null)} className="text-emerald-600 hover:text-emerald-800">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 1: DASHBOARD OVERVIEW */}
        {/* ======================================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* 4 Clean Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Total Registrations
                  </span>
                  <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                    <ClipboardList className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-slate-900 tracking-tight">
                  {metrics.totalRegs}
                </p>
                <p className="text-xs text-slate-500 mt-1">Confirmed student forms logged</p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Total Participants
                  </span>
                  <div className="w-9 h-9 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-purple-600 tracking-tight">
                  {metrics.totalParticipants}
                </p>
                <p className="text-xs text-slate-500 mt-1">Including team & squad members</p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Active Arenas
                  </span>
                  <div className="w-9 h-9 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center">
                    <Trophy className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-3xl font-bold text-amber-600 tracking-tight">
                  {events.length}
                </p>
                <p className="text-xs text-slate-500 mt-1">8 Technical · 8 Non-Technical</p>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Top Competition
                  </span>
                  <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                    <Flame className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-xl font-bold text-slate-900 tracking-tight truncate">
                  {metrics.topEventCount > 0 ? metrics.topEventTitle : 'Awaiting entries'}
                </p>
                <p className="text-xs text-emerald-600 font-medium mt-1">
                  {metrics.topEventCount > 0 ? `${metrics.topEventCount} sign-ups enrolled` : 'No sign-ups yet'}
                </p>
              </div>
            </div>

            {/* Event Sign-up Heatmap Split by Technical & Non-Technical */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-6 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Competition Enrollment Breakdown
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Real-time counts for all 16 technical and non-technical festival events
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('roster')}
                  className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
                >
                  <span>View Student Roster</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Technical Events Group */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Technical Events (01 – 08)
                    </h4>
                  </div>

                  <div className="space-y-2.5">
                    {events
                      .filter((e) => e.category === 'technical')
                      .map((ev) => {
                        const count = metrics.eventCounts[ev.id] || 0;
                        const pct = metrics.totalRegs > 0 ? Math.round((count / metrics.totalRegs) * 100) : 0;
                        return (
                          <div
                            key={ev.id}
                            className="bg-slate-50 hover:bg-slate-100/80 rounded-lg p-3 transition-colors border border-slate-200/60"
                          >
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-mono font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                  #{ev.number}
                                </span>
                                <span className="text-xs font-semibold text-slate-900">
                                  {ev.title}
                                </span>
                                <span className="text-[11px] text-slate-400 hidden sm:inline">
                                  · {ev.teamSize}
                                </span>
                              </div>
                              <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-white text-slate-900 border border-slate-200">
                                {count} {count === 1 ? 'entry' : 'entries'}
                              </span>
                            </div>

                            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-blue-600 h-full rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(100, (count / (metrics.totalRegs || 1)) * 100)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Non-Technical Events Group */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Non-Technical Events (01 – 08)
                    </h4>
                  </div>

                  <div className="space-y-2.5">
                    {events
                      .filter((e) => e.category === 'non-technical')
                      .map((ev) => {
                        const count = metrics.eventCounts[ev.id] || 0;
                        const pct = metrics.totalRegs > 0 ? Math.round((count / metrics.totalRegs) * 100) : 0;
                        return (
                          <div
                            key={ev.id}
                            className="bg-slate-50 hover:bg-slate-100/80 rounded-lg p-3 transition-colors border border-slate-200/60"
                          >
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-mono font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                                  #{ev.number}
                                </span>
                                <span className="text-xs font-semibold text-slate-900">
                                  {ev.title}
                                </span>
                                <span className="text-[11px] text-slate-400 hidden sm:inline">
                                  · {ev.teamSize}
                                </span>
                              </div>
                              <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-white text-slate-900 border border-slate-200">
                                {count} {count === 1 ? 'entry' : 'entries'}
                              </span>
                            </div>

                            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-amber-500 h-full rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(100, (count / (metrics.totalRegs || 1)) * 100)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>

            {/* Department and Year Demographics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Department breakdown */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                <h4 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                  <span>Enrolled by Department</span>
                  <Building2 className="w-4 h-4 text-slate-400" />
                </h4>
                {Object.keys(metrics.deptCounts).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(metrics.deptCounts).map(([dept, count]) => {
                      const pct = Math.round((count / (metrics.totalRegs || 1)) * 100);
                      return (
                        <div key={dept} className="space-y-1">
                          <div className="flex justify-between text-xs font-medium">
                            <span className="text-slate-800">{dept || 'Other'}</span>
                            <span className="font-mono text-slate-500">
                              {count} ({pct}%)
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-amber-500 h-full rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-4 text-center">No student entries logged yet.</p>
                )}
              </div>

              {/* Year of Study breakdown */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
                <h4 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                  <span>Enrolled by Year of Study</span>
                  <Calendar className="w-4 h-4 text-slate-400" />
                </h4>
                {Object.keys(metrics.yearCounts).length > 0 ? (
                  <div className="space-y-3">
                    {Object.entries(metrics.yearCounts).map(([year, count]) => {
                      const pct = Math.round((count / (metrics.totalRegs || 1)) * 100);
                      return (
                        <div key={year} className="space-y-1">
                          <div className="flex justify-between text-xs font-medium">
                            <span className="text-slate-800">Year {year}</span>
                            <span className="font-mono text-slate-500">
                              {count} ({pct}%)
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-blue-600 h-full rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 py-4 text-center">No year entries logged yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: REGISTRATIONS ROSTER & TABLE */}
        {/* ======================================================== */}
        {activeTab === 'roster' && (
          <div className="space-y-4">
            {/* Filter Toolbar */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by student name, RRN, mobile, or event..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                  />
                </div>

                <select
                  value={selectedEventFilter}
                  onChange={(e) => setSelectedEventFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="all">All Events (16)</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      #{ev.number} {ev.title}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedDeptFilter}
                  onChange={(e) => setSelectedDeptFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="all">All Departments</option>
                  <option value="CSE">CSE</option>
                  <option value="AI&DS">AI&DS</option>
                  <option value="IoT">IoT</option>
                  <option value="Cybersecurity">Cybersecurity</option>
                </select>
              </div>

              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export CSV Roster</span>
              </button>
            </div>

            {/* Table Counter */}
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span>Showing <strong>{filteredRegistrations.length}</strong> of <strong>{registrations.length}</strong> total registrations</span>
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-amber-600 hover:underline">
                  Clear search filter
                </button>
              )}
            </div>

            {/* Clean Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
                      <th className="py-3 px-4">Pass ID</th>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4">RRN</th>
                      <th className="py-3 px-4">Dept & Section</th>
                      <th className="py-3 px-4">Mobile</th>
                      <th className="py-3 px-4">Competitions</th>
                      <th className="py-3 px-4">Squad</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRegistrations.length > 0 ? (
                      filteredRegistrations.map((r) => {
                        const isExpanded = expandedRow === r.reg_id;
                        return (
                          <React.Fragment key={r.reg_id}>
                            <tr className="hover:bg-slate-50/60 transition-colors">
                              <td className="py-3 px-4 font-mono font-bold text-slate-900">
                                <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[11px]">
                                  {r.reg_id}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-semibold text-slate-900">
                                {r.name}
                              </td>
                              <td className="py-3 px-4 font-mono text-slate-600">
                                {r.rrn}
                              </td>
                              <td className="py-3 px-4 text-slate-700">
                                {r.programme} {r.department}
                                {r.section ? (
                                  <span className="ml-1 bg-amber-50 text-amber-700 font-mono font-semibold px-1.5 py-0.2 rounded text-[10px]">
                                    Sec {r.section}
                                  </span>
                                ) : null}
                                <span className="text-slate-400"> · Yr {r.year}</span>
                              </td>
                              <td className="py-3 px-4 font-mono text-slate-600">
                                {r.mobile}
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex flex-wrap gap-1 max-w-xs">
                                  {r.selected_events.map((evId) => {
                                    const evObj = events.find((e) => e.id === evId);
                                    const isTech = evObj?.category === 'technical';
                                    return (
                                      <span
                                        key={evId}
                                        className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                                          isTech
                                            ? 'bg-blue-50 text-blue-700'
                                            : 'bg-amber-50 text-amber-700'
                                        }`}
                                      >
                                        {evObj?.title || evId}
                                      </span>
                                    );
                                  })}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                {r.team_members && r.team_members.length > 0 ? (
                                  <button
                                    onClick={() => setExpandedRow(isExpanded ? null : r.reg_id)}
                                    className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-800"
                                  >
                                    <span>{r.team_members.length} member(s)</span>
                                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                  </button>
                                ) : (
                                  <span className="text-slate-400 text-[11px]">Solo</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  onClick={() => handleDeleteRegistration(r.reg_id, r.name)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                                  title="Delete entry"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>

                            {/* Expanded Squad Members Drawer */}
                            {isExpanded && r.team_members && (
                              <tr className="bg-slate-50/70 border-y border-slate-200">
                                <td colSpan={8} className="p-4">
                                  <div className="space-y-2">
                                    <h5 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                                      Squad Teammates ({r.team_members.length})
                                    </h5>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                      {r.team_members.map((tm, idx) => (
                                        <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 text-xs space-y-0.5">
                                          <p className="font-semibold text-slate-900">#{idx + 1} {tm.name}</p>
                                          {tm.event_id && <p className="text-amber-700 font-medium">{events.find(event => event.id === tm.event_id)?.title || tm.event_id}</p>}
                                          <p className="text-slate-500 font-mono text-[11px]">RRN: {tm.rrn}</p>
                                          <p className="text-slate-500 font-mono text-[11px]">Phone: {tm.mobile}</p>
                                          <p className="text-slate-600 text-[11px]">
                                            {tm.programme} {tm.department} {tm.section ? `Sec ${tm.section}` : ''} (Yr {tm.year})
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400">
                          No student registrations found matching the query.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: CONTENT EDITOR (CMS) */}
        {/* ======================================================== */}
        {activeTab === 'editor' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Event Selector & General Info */}
            <div className="lg:col-span-4 space-y-6">
              {/* Event Picker */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 pb-2 border-b border-slate-100">
                  Select Event to Edit
                </h3>
                <div className="space-y-1 max-h-[380px] overflow-y-auto pr-1">
                  {events.map((ev) => {
                    const isSelected = ev.id === editingEventId;
                    const isTech = ev.category === 'technical';
                    return (
                      <button
                        key={ev.id}
                        onClick={() => handleSelectEditingEvent(ev.id)}
                        className={`w-full text-left p-2.5 rounded-lg text-xs transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-amber-600 text-white font-semibold shadow-xs'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] opacity-80">#{ev.number}</span>
                          <span className="truncate max-w-[160px]">{ev.title}</span>
                        </div>
                        <span className={`text-[10px] uppercase font-mono px-1.5 py-0.2 rounded ${
                          isSelected ? 'bg-white/20 text-white' : isTech ? 'text-blue-600 bg-blue-50' : 'text-amber-600 bg-amber-50'
                        }`}>
                          {isTech ? 'Tech' : 'Non-Tech'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* General Site Information */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    General Site Information
                  </h3>
                  <button
                    onClick={handleSaveSettings}
                    className="px-3 py-1 bg-slate-900 hover:bg-amber-600 text-white text-xs font-semibold rounded-md transition-colors"
                  >
                    Save Info
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Auditorium / Campus Venue Name
                    </label>
                    <input
                      type="text"
                      value={settingsDraft.venueName}
                      onChange={(e) => setSettingsDraft({ ...settingsDraft, venueName: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Event Date & Day
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={settingsDraft.eventDate}
                        onChange={(e) => setSettingsDraft({ ...settingsDraft, eventDate: e.target.value })}
                        placeholder="26 October 2026"
                        className="p-2 bg-slate-50 border border-slate-200 rounded-md text-slate-800"
                      />
                      <input
                        type="text"
                        value={settingsDraft.eventDay}
                        onChange={(e) => setSettingsDraft({ ...settingsDraft, eventDay: e.target.value })}
                        placeholder="Monday"
                        className="p-2 bg-slate-50 border border-slate-200 rounded-md text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Google Form URL
                    </label>
                    <input
                      type="url"
                      value={settingsDraft.googleFormUrl}
                      onChange={(e) => setSettingsDraft({ ...settingsDraft, googleFormUrl: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md font-mono text-[11px] text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-medium mb-1">
                      Top Announcement Message
                    </label>
                    <textarea
                      rows={2}
                      value={settingsDraft.announcementText}
                      onChange={(e) => setSettingsDraft({ ...settingsDraft, announcementText: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-slate-800"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Detailed Card Editor */}
            <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-mono font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded uppercase">
                    Editing Arena #{eventDraft.number}
                  </span>
                  <h3 className="text-xl font-bold text-slate-900 mt-1">
                    {eventDraft.title}
                  </h3>
                </div>

                <button
                  onClick={handleSaveEvent}
                  className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Update Live Website</span>
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Competition Name
                    </label>
                    <input
                      type="text"
                      value={eventDraft.title}
                      onChange={(e) => setEventDraft({ ...eventDraft, title: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Category
                    </label>
                    <select
                      value={eventDraft.category}
                      onChange={(e) =>
                        setEventDraft({
                          ...eventDraft,
                          category: e.target.value as 'technical' | 'non-technical',
                          accent: e.target.value === 'technical' ? 'blue' : 'orange',
                        })
                      }
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-slate-900"
                    >
                      <option value="technical">Technical</option>
                      <option value="non-technical">Non-technical</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Short Tagline / Card Summary
                  </label>
                  <input
                    type="text"
                    value={eventDraft.shortDesc}
                    onChange={(e) => setEventDraft({ ...eventDraft, shortDesc: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Full Description / Overview
                  </label>
                  <textarea
                    rows={3}
                    value={eventDraft.overview}
                    onChange={(e) => setEventDraft({ ...eventDraft, overview: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Team Size
                    </label>
                    <input
                      type="text"
                      value={eventDraft.teamSize}
                      onChange={(e) => setEventDraft({ ...eventDraft, teamSize: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Venue
                    </label>
                    <input
                      type="text"
                      value={eventDraft.venue || ''}
                      onChange={(e) => setEventDraft({ ...eventDraft, venue: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">
                      Duration
                    </label>
                    <input
                      type="text"
                      value={eventDraft.duration || ''}
                      onChange={(e) => setEventDraft({ ...eventDraft, duration: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-slate-800"
                    />
                  </div>
                </div>

                {/* Rules List */}
                <div>
                  <label className="block text-slate-700 font-semibold mb-2">
                    Official Rules & Guidelines ({eventDraft.rules.length})
                  </label>
                  <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1 mb-2.5">
                    {eventDraft.rules.map((rule, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200/80">
                        <span className="font-mono text-[11px] font-bold text-slate-400 w-5">
                          #{idx + 1}
                        </span>
                        <input
                          type="text"
                          value={rule}
                          onChange={(e) => {
                            const copy = [...eventDraft.rules];
                            copy[idx] = e.target.value;
                            setEventDraft({ ...eventDraft, rules: copy });
                          }}
                          className="flex-1 bg-white px-2 py-1 border border-slate-200 rounded text-xs text-slate-800"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setEventDraft({
                              ...eventDraft,
                              rules: eventDraft.rules.filter((_, i) => i !== idx),
                            });
                          }}
                          className="p-1 text-slate-400 hover:text-red-600 rounded"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newRule}
                      onChange={(e) => setNewRule(e.target.value)}
                      placeholder="Add a new rule..."
                      className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newRule.trim()) {
                          setEventDraft({
                            ...eventDraft,
                            rules: [...eventDraft.rules, newRule.trim()],
                          });
                          setNewRule('');
                        }
                      }}
                      className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs rounded-md flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Rule
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: SUPABASE CLOUD SETUP */}
        {/* ======================================================== */}
        {activeTab === 'database' && (
          <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center gap-3.5 pb-5 border-b border-slate-100">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Supabase Cloud Database
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  https://spowdisyvuvaicasewdf.supabase.co
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-600">
              <p>Registrations and content changes are saved through the site backend.</p>
              <p>Connection status: {dbConnected ? 'Connected' : 'Unavailable. Contact the site administrator.'}</p>
            </div>
          </div>
        )}
      </main>

      {/* Clean Admin Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-400">
          Talent Hunt 2K26 Organizer Dashboard · Department of Computer Science & Engineering, Crescent Institute
        </div>
      </footer>
    </div>
  );
};
