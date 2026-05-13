'use client'

import { useState, useRef, useCallback } from 'react'

/* ─── Types ─────────────────────────────────────────────── */

type RunType = 'long' | 'build' | 'tempo' | 'easy' | 'race'

interface Run {
  date: string
  name: string
  distKm: number
  paceMinKm: number
  hr: number | null
  elev: number
  type: RunType
}

interface Monthly {
  month: string
  km: number
}

interface Summary {
  totalRuns: number
  totalKm: number
  longestKm: number
  bestPace: string
  bestPaceDate: string
}

interface AnalysisData {
  narrative: string
  runs: Run[]
  monthly: Monthly[]
  summary: Summary
  insights: string[]
}

interface Phase {
  name: string
  weeks: string
  bg: string
  tc: string
}

interface KeyWorkout {
  name: string
  description: string
  frequency: string
}

interface PlanData {
  duration: string
  goalTime: string
  overview: string
  phases: Phase[]
  sampleWeek: Record<string, string>
  keyWorkouts: KeyWorkout[]
  nutritionTips: string[]
  recoveryTips: string[]
  strengthsToLeverage: string[]
  gapsToAddress: string[]
}

/* ─── Helpers ────────────────────────────────────────────── */

function paceStr(p: number): string {
  const mins = Math.floor(p)
  const secs = Math.round((p - mins) * 60)
  return `${mins}:${String(secs).padStart(2, '0')}`
}

function getBadgeClass(t: RunType): string {
  const map: Record<RunType, string> = {
    long: 'badge badge-long',
    build: 'badge badge-build',
    tempo: 'badge badge-tempo',
    easy: 'badge badge-easy',
    race: 'badge badge-race',
  }
  return map[t] ?? 'badge badge-easy'
}

function getBadgeLabel(t: RunType): string {
  const map: Record<RunType, string> = {
    long: 'Long run',
    build: 'Build run',
    tempo: 'Tempo',
    easy: 'Easy run',
    race: 'Race',
  }
  return map[t] ?? 'Run'
}

async function callGemini(prompt: string): Promise<string> {
  const res = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  })
  const data = await res.json()
  if (data.error) throw new Error(String(data.error))
  return String(data.text ?? '')
}

function safeParseJSON<T>(text: string): T {
  const clean = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim()
  return JSON.parse(clean) as T
}

/* ─── RunCard ────────────────────────────────────────────── */

function RunCard({ run }: { run: Run }) {
  return (
    <div className="run-card">
      <div className="rch">
        <span className="rct">{run.date} — {run.name}</span>
        <span className={getBadgeClass(run.type)}>{getBadgeLabel(run.type)}</span>
      </div>
      <div className="rcs">
        <span><b>{run.distKm.toFixed(1)}</b> km</span>
        <span><b>{paceStr(run.paceMinKm)}</b>/km</span>
        {run.hr !== null && <span><b>{run.hr}</b> bpm</span>}
        <span><b>{run.elev}</b>m elev</span>
      </div>
    </div>
  )
}

/* ─── UploadScreen ───────────────────────────────────────── */

function UploadScreen({
  onAnalyze,
  errorMsg,
}: {
  onAnalyze: (text: string) => void
  errorMsg: string
}) {
  const [dragging, setDragging] = useState(false)
  const [fileText, setFileText] = useState('')
  const [fileName, setFileName] = useState('')
  const [paste, setPaste] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function readFile(file: File) {
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      setFileText((e.target?.result as string) ?? '')
    }
    reader.readAsText(file)
  }

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) readFile(file)
  }, [])

  function handleAnalyze() {
    const input = fileText || paste
    if (!input.trim()) {
      alert('Please upload a file or describe your training first.')
      return
    }
    onAnalyze(input)
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700 }}>🏃 Training Story &amp; Race Planner</h1>
          <span className="free-badge">✓ 100% Free</span>
        </div>
        <p style={{ fontSize: '15px', color: 'var(--text2)' }}>
          Upload your Strava export for an AI training analysis and personalized race plan. Powered by Google Gemini — no cost, no credit card.
        </p>
      </div>

      {errorMsg && <div className="error-box">⚠️ {errorMsg}</div>}

      <div
        className={dragging ? 'upload-zone drag' : 'upload-zone'}
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        style={{ marginBottom: '1rem' }}
      >
        <div style={{ fontSize: '42px', marginBottom: '12px' }}>📂</div>
        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px', color: 'var(--text)' }}>
          Drop your Strava export here
        </h3>
        <p style={{ fontSize: '13px' }}>Accepts activities.csv, .gpx, .fit, or any text format</p>
        {fileName && (
          <p style={{ marginTop: '10px', color: '#166534', fontWeight: 600, fontSize: '13px' }}>
            ✓ {fileName} ready to analyze
          </p>
        )}
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.gpx,.fit,.json,.txt"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) readFile(f)
          }}
        />
      </div>

      <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text3)', marginBottom: '8px' }}>
        — or describe your training in plain English below —
      </p>

      <textarea
        value={paste}
        onChange={(e) => setPaste(e.target.value)}
        placeholder="E.g. I ran 3-4 times per week for 16 weeks. Long runs up to 18km. My half marathon finish time was 1:52. Easy pace was around 6:30/km..."
        style={{
          width: '100%',
          height: '110px',
          padding: '12px',
          border: '1px solid var(--border2)',
          borderRadius: 'var(--radius-lg)',
          fontFamily: 'inherit',
          fontSize: '13px',
          color: 'var(--text)',
          background: 'var(--bg)',
          resize: 'vertical',
          marginBottom: '12px',
          outline: 'none',
        }}
      />

      <button
        className="btn btn-primary"
        onClick={handleAnalyze}
        style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: '15px' }}
      >
        ✨ Analyze my training — free
      </button>

      <div style={{ marginTop: '2rem', padding: '1.25rem', background: 'var(--bg2)', borderRadius: 'var(--radius-lg)' }}>
        <p style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: 'var(--text)' }}>
          📥 How to export from Strava
        </p>
        <ol style={{ paddingLeft: '18px', fontSize: '13px', color: 'var(--text2)', lineHeight: 2 }}>
          <li>Go to <b>strava.com</b> → your profile photo → <b>Settings</b></li>
          <li>Scroll to <b>My Account</b> → <b>Download or Delete Your Account</b></li>
          <li>Click <b>Get Started</b> → <b>Request Your Archive</b></li>
          <li>Strava emails you a download link (usually within an hour)</li>
          <li>Unzip the file and upload <b>activities.csv</b> here</li>
        </ol>
      </div>
    </div>
  )
}

/* ─── StoryTab ───────────────────────────────────────────── */

function StoryTab({ data }: { data: AnalysisData }) {
  const ICONS = ['📈', '📅', '❤️', '🏔️']
  const featured = [
    ...data.runs.filter((r) => r.type === 'long' || r.type === 'race'),
    ...data.runs.filter((r) => r.type !== 'long' && r.type !== 'race'),
  ].slice(0, 5)

  return (
    <div>
      <div className="g4" style={{ marginBottom: '1.5rem' }}>
        <div className="metric-card">
          <div className="lbl">Total runs</div>
          <div className="val">{data.summary.totalRuns}</div>
          <div className="sub">logged activities</div>
        </div>
        <div className="metric-card">
          <div className="lbl">Distance</div>
          <div className="val">{data.summary.totalKm.toFixed(0)} km</div>
          <div className="sub">total</div>
        </div>
        <div className="metric-card">
          <div className="lbl">Longest run</div>
          <div className="val">{data.summary.longestKm.toFixed(1)} km</div>
          <div className="sub">single effort</div>
        </div>
        <div className="metric-card">
          <div className="lbl">Best pace</div>
          <div className="val">{data.summary.bestPace}</div>
          <div className="sub">{data.summary.bestPaceDate}</div>
        </div>
      </div>

      <div className="narrative">{data.narrative}</div>

      <div className="stitle">⭐ Key runs</div>
      {featured.map((run, i) => (
        <RunCard key={i} run={run} />
      ))}

      <div className="stitle" style={{ marginTop: '1.5rem' }}>💡 Training insights</div>
      {data.insights.map((insight, i) => (
        <div className="insight" key={i}>
          <span style={{ fontSize: '16px', flexShrink: 0 }}>{ICONS[i % 4]}</span>
          <span dangerouslySetInnerHTML={{ __html: insight.replace(/\*\*(.*?)\*\*/g, '<b style="color:var(--text)">$1</b>') }} />
        </div>
      ))}
    </div>
  )
}

/* ─── StatsTab ───────────────────────────────────────────── */

function StatsTab({ data }: { data: AnalysisData }) {
  const maxKm = Math.max(...data.monthly.map((m) => m.km), 1)
  const paceRuns = [...data.runs].filter((r) => r.distKm >= 5).reverse()
  const paces = paceRuns.map((r) => r.paceMinKm)
  const maxP = Math.max(...paces, 1)
  const minP = Math.min(...paces, 0)
  const paceColors = ['#ef4444', '#f97316', '#3b82f6', '#22c55e', '#10b981']

  const hrZones = [
    { label: 'Z1 <140', pct: 12, color: '#86efac' },
    { label: 'Z2 140-155', pct: 35, color: '#3b82f6' },
    { label: 'Z3 155-168', pct: 38, color: '#f97316' },
    { label: 'Z4 168-180', pct: 13, color: '#ef4444' },
    { label: 'Z5 >180', pct: 2, color: '#991b1b' },
  ]

  return (
    <div>
      <div className="stitle">📊 Monthly volume</div>
      <div style={{ marginBottom: '1.5rem' }}>
        {data.monthly.map((m, i) => (
          <div className="bar-row" key={i}>
            <div className="bar-lbl">{m.month}</div>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{ width: `${Math.round((m.km / maxKm) * 100)}%`, background: '#3b82f6' }}
              />
            </div>
            <div className="bar-val">{m.km.toFixed(0)}km</div>
          </div>
        ))}
      </div>

      <div className="stitle">⚡ Pace trend (runs 5km+)</div>
      <div style={{ marginBottom: '1.5rem' }}>
        {paceRuns.map((r, i) => {
          const norm = maxP === minP ? 0.5 : 1 - (r.paceMinKm - minP) / (maxP - minP)
          const ci = Math.min(4, Math.floor(norm * 5))
          return (
            <div className="bar-row" key={i}>
              <div className="bar-lbl" style={{ fontSize: '10px' }}>{r.date}</div>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{ width: `${Math.round(norm * 100)}%`, background: paceColors[ci] }}
                />
              </div>
              <div className="bar-val" style={{ fontSize: '10px' }}>{paceStr(r.paceMinKm)}/km</div>
            </div>
          )
        })}
      </div>

      <div className="stitle">❤️ Estimated HR zones</div>
      <div style={{ marginBottom: '1.5rem' }}>
        {hrZones.map((z, i) => (
          <div className="bar-row" key={i}>
            <div className="bar-lbl">{z.label}</div>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${z.pct}%`, background: z.color }} />
            </div>
            <div className="bar-val">{z.pct}%</div>
          </div>
        ))}
      </div>

      <div className="g4">
        <div className="metric-card">
          <div className="lbl">Avg run length</div>
          <div className="val">{(data.summary.totalKm / Math.max(data.summary.totalRuns, 1)).toFixed(1)} km</div>
          <div className="sub">per session</div>
        </div>
        <div className="metric-card">
          <div className="lbl">Best pace</div>
          <div className="val">{data.summary.bestPace}/km</div>
          <div className="sub">{data.summary.bestPaceDate}</div>
        </div>
      </div>
    </div>
  )
}

/* ─── RunsTab ────────────────────────────────────────────── */

type FilterType = 'all' | 'long' | 'short' | 'fast'

function RunsTab({ data }: { data: AnalysisData }) {
  const [filter, setFilter] = useState<FilterType>('all')

  function getFiltered(): Run[] {
    if (filter === 'long') return data.runs.filter((r) => r.distKm >= 12)
    if (filter === 'short') return data.runs.filter((r) => r.distKm < 7)
    if (filter === 'fast') return [...data.runs].sort((a, b) => a.paceMinKm - b.paceMinKm).slice(0, 10)
    return data.runs
  }

  const filtered = getFiltered()
  const filters: { id: FilterType; label: string }[] = [
    { id: 'all', label: 'All runs' },
    { id: 'long', label: '🏃 Long runs' },
    { id: 'short', label: '⚡ Short runs' },
    { id: 'fast', label: '🥇 Fastest' },
  ]

  return (
    <div>
      <div className="filter-row">
        {filters.map((f) => (
          <button
            key={f.id}
            className={filter === f.id ? 'fpill on' : 'fpill'}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text2)' }}>
          No runs match this filter.
        </p>
      ) : (
        filtered.map((run, i) => <RunCard key={i} run={run} />)
      )}
    </div>
  )
}

/* ─── PlanTab ────────────────────────────────────────────── */

type GoalType = 'hm' | 'fm' | 'tri'

function PlanTab({ data }: { data: AnalysisData }) {
  const [goal, setGoal] = useState<GoalType>('hm')
  const [plan, setPlan] = useState<PlanData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  const goalLabels: Record<GoalType, string> = {
    hm: 'half marathon — targeting sub-1:50',
    fm: 'full marathon — targeting sub-4:00',
    tri: 'Olympic triathlon',
  }

  const goalOptions: { id: GoalType; icon: string; name: string; desc: string }[] = [
    { id: 'hm', icon: '🏃', name: 'Half marathon', desc: 'Target: sub-1:50' },
    { id: 'fm', icon: '🏆', name: 'Full marathon', desc: 'Target: sub-4:00' },
    { id: 'tri', icon: '🏊', name: 'Triathlon', desc: 'Olympic or 70.3' },
  ]

  async function buildPlan() {
    setLoading(true)
    setPlan(null)
    setError('')

    const prompt = `You are an expert running coach. Build a personalized training plan for this athlete.

ATHLETE DATA:
- Total runs: ${data.summary.totalRuns}
- Total distance: ${data.summary.totalKm.toFixed(0)} km
- Longest run: ${data.summary.longestKm.toFixed(1)} km
- Best pace: ${data.summary.bestPace}/km on ${data.summary.bestPaceDate}
- Monthly volumes: ${data.monthly.map((m) => `${m.month}: ${m.km.toFixed(0)}km`).join(', ')}
- Goal: ${goalLabels[goal]}

Return ONLY a valid JSON object. No markdown. No explanation. Just the JSON:
{
  "duration": "16 weeks",
  "goalTime": "1:47:00",
  "overview": "3 sentences referencing the athlete actual numbers and goal",
  "phases": [
    {"name": "Base", "weeks": "Weeks 1-4", "bg": "#dbeafe", "tc": "#1e40af"},
    {"name": "Build", "weeks": "Weeks 5-10", "bg": "#fef3c7", "tc": "#92400e"},
    {"name": "Peak", "weeks": "Weeks 11-14", "bg": "#fee2e2", "tc": "#991b1b"},
    {"name": "Taper", "weeks": "Weeks 15-16", "bg": "#d1fae5", "tc": "#065f46"}
  ],
  "sampleWeek": {
    "Mon": "Rest or gentle yoga",
    "Tue": "Easy 8km at 6:00/km",
    "Wed": "Cross-train 45min",
    "Thu": "Tempo 6km at 5:10/km",
    "Fri": "Rest",
    "Sat": "Easy 10km",
    "Sun": "Long run 16km easy"
  },
  "keyWorkouts": [
    {"name": "Tempo run", "description": "Two sentences about this workout for this athlete.", "frequency": "Once per week"},
    {"name": "Long run", "description": "Two sentences about this workout for this athlete.", "frequency": "Every Sunday"},
    {"name": "Easy recovery run", "description": "Two sentences about this workout.", "frequency": "2-3x per week"}
  ],
  "nutritionTips": [
    "Tip one specific to their goal.",
    "Tip two.",
    "Tip three."
  ],
  "recoveryTips": [
    "Recovery tip one.",
    "Recovery tip two."
  ],
  "strengthsToLeverage": [
    "Strength based on their data.",
    "Another strength."
  ],
  "gapsToAddress": [
    "Gap to work on.",
    "Another gap."
  ]
}`

    try {
      const text = await callGemini(prompt)
      const parsed = safeParseJSON<PlanData>(text)
      setPlan(parsed)
    } catch (e) {
      console.error(e)
      setError('Could not generate plan. Gemini may be rate-limited — please wait a moment and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="narrative" style={{ borderLeftColor: '#22c55e' }}>
        <strong style={{ color: 'var(--text)' }}>Ready to race 🎯</strong> — You have {data.summary.totalRuns} runs
        and {data.summary.totalKm.toFixed(0)}km logged, with a best pace of {data.summary.bestPace}/km.
        Pick your goal and get a plan built around your actual fitness.
      </div>

      <div className="stitle">Choose your goal race</div>
      <div className="goal-grid">
        {goalOptions.map((g) => (
          <button
            key={g.id}
            className={goal === g.id ? 'goal-card sel' : 'goal-card'}
            onClick={() => { setGoal(g.id); setPlan(null); setError('') }}
          >
            <div className="gi">{g.icon}</div>
            <div className="gn">{g.name}</div>
            <div className="gd">{g.desc}</div>
          </button>
        ))}
      </div>

      {error && <div className="error-box">⚠️ {error}</div>}

      <button
        className="btn btn-primary"
        onClick={buildPlan}
        disabled={loading}
        style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: '15px', marginBottom: '1.5rem' }}
      >
        {loading ? '⏳ Building your plan…' : '✨ Build my free personalized plan'}
      </button>

      {loading && (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="spinner" />
          <p style={{ color: 'var(--text2)', fontSize: '14px' }}>
            Analyzing your {data.summary.totalRuns} runs and crafting your plan…
          </p>
        </div>
      )}

      {plan && (
        <div>
          <div className="g4" style={{ marginBottom: '1.5rem' }}>
            <div className="metric-card">
              <div className="lbl">Plan length</div>
              <div className="val" style={{ fontSize: '20px' }}>{plan.duration}</div>
            </div>
            <div className="metric-card">
              <div className="lbl">Goal time</div>
              <div className="val" style={{ fontSize: '20px' }}>{plan.goalTime}</div>
            </div>
          </div>

          <div className="narrative" style={{ borderLeftColor: '#22c55e' }}>{plan.overview}</div>

          <div className="stitle">📅 Training phases</div>
          <div className="phase-row">
            {plan.phases.map((ph, i) => (
              <div key={i} className="phase-blk" style={{ background: ph.bg, color: ph.tc }}>
                <div className="pn">{ph.name}</div>
                <div className="pw">{ph.weeks}</div>
              </div>
            ))}
          </div>

          <div className="stitle">🗓️ Sample training week</div>
          <div className="week-grid">
            {DAYS.map((d) => {
              const w = plan.sampleWeek[d] ?? 'Rest'
              const isRest = w.toLowerCase().includes('rest')
              return (
                <div key={d} className={isRest ? 'day-cell rest' : 'day-cell'}>
                  <div className="dl">{d}</div>
                  <div className="dw">{w}</div>
                </div>
              )
            })}
          </div>

          <div className="stitle">⚡ Key workouts</div>
          {plan.keyWorkouts.map((k, i) => (
            <div key={i} className="plan-card">
              <h4>
                {k.name}{' '}
                <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text2)' }}>
                  — {k.frequency}
                </span>
              </h4>
              <p>{k.description}</p>
            </div>
          ))}

          <div className="g2" style={{ marginTop: '1.5rem' }}>
            <div>
              <div className="stitle" style={{ fontSize: '14px' }}>🚀 Your strengths</div>
              {plan.strengthsToLeverage.map((s, i) => <div key={i} className="tip">{s}</div>)}
            </div>
            <div>
              <div className="stitle" style={{ fontSize: '14px' }}>🎯 Focus areas</div>
              {plan.gapsToAddress.map((s, i) => <div key={i} className="tip">{s}</div>)}
            </div>
          </div>

          <div className="g2" style={{ marginTop: '1.5rem' }}>
            <div>
              <div className="stitle" style={{ fontSize: '14px' }}>🥗 Nutrition</div>
              {plan.nutritionTips.map((t, i) => <div key={i} className="tip">{t}</div>)}
            </div>
            <div>
              <div className="stitle" style={{ fontSize: '14px' }}>🌙 Recovery</div>
              {plan.recoveryTips.map((t, i) => <div key={i} className="tip">{t}</div>)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Main App ───────────────────────────────────────────── */

type AppState = 'upload' | 'analyzing' | 'results'
type TabType = 'story' | 'stats' | 'runs' | 'plan'

const LOADING_MSGS = [
  'Reading your activity data…',
  'Identifying key workouts…',
  'Calculating your pace progression…',
  'Building your training story…',
]

export default function Home() {
  const [appState, setAppState] = useState<AppState>('upload')
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('story')
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MSGS[0])
  const [analyzeError, setAnalyzeError] = useState('')

  const tabs: { id: TabType; label: string }[] = [
    { id: 'story', label: '📖 Story' },
    { id: 'stats', label: '📊 Stats' },
    { id: 'runs', label: '📋 All runs' },
    { id: 'plan', label: '🗺️ Race plan' },
  ]

  async function analyze(input: string) {
    setAppState('analyzing')
    setAnalyzeError('')
    let mi = 0
    const interval = setInterval(() => {
      mi = (mi + 1) % LOADING_MSGS.length
      setLoadingMsg(LOADING_MSGS[mi])
    }, 2000)

    const prompt = `You are an expert running coach and data analyst. Analyze this Strava training data and return ONLY a valid JSON object. No markdown fences, no text before or after — just the raw JSON.

Training data:
${input.substring(0, 8000)}

Return exactly this structure:
{
  "narrative": "3-4 sentences telling a personal story about this training block. Be specific: mention actual distances, paces, and dates found in the data.",
  "runs": [
    {
      "date": "Apr 26",
      "name": "Long Run",
      "distKm": 17.3,
      "paceMinKm": 5.37,
      "hr": 167,
      "elev": 16,
      "type": "long"
    }
  ],
  "monthly": [
    {"month": "Jan 26", "km": 80}
  ],
  "summary": {
    "totalRuns": 31,
    "totalKm": 257,
    "longestKm": 21.1,
    "bestPace": "4:56",
    "bestPaceDate": "Apr 24"
  },
  "insights": [
    "**Pace improvement** — you improved from 6:24/km in January to 5:02/km by May.",
    "**Consistency** — you averaged 4 runs per week in your peak month.",
    "**Long run progression** — your long run grew from 10km to 21km over 16 weeks.",
    "**Heart rate** — average HR of 160-172 shows solid aerobic base building."
  ]
}

Rules:
- type must be one of: long, build, tempo, easy, race
- Sort runs newest first
- Include all runs found in the data
- paceMinKm is a decimal number (e.g. 5.5 = 5:30 per km)
- hr can be null if not available
- Return ONLY the JSON object, nothing else`

    try {
      const text = await callGemini(prompt)
      const parsed = safeParseJSON<AnalysisData>(text)
      parsed.runs = parsed.runs.map((r) => ({
        ...r,
        type: (['long', 'build', 'tempo', 'easy', 'race'].includes(r.type) ? r.type : 'easy') as RunType,
      }))
      clearInterval(interval)
      setAnalysisData(parsed)
      setAppState('results')
    } catch (e) {
      clearInterval(interval)
      console.error(e)
      setAnalyzeError('Could not analyze the data. Please try again — Gemini may be temporarily busy.')
      setAppState('upload')
    }
  }

  function reset() {
    setAppState('upload')
    setAnalysisData(null)
    setActiveTab('story')
    setAnalyzeError('')
  }

  return (
    <div className="container">
      {appState === 'upload' && (
        <UploadScreen onAnalyze={analyze} errorMsg={analyzeError} />
      )}

      {appState === 'analyzing' && (
        <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
          <div style={{ fontSize: '52px', marginBottom: '20px' }}>🏃</div>
          <div className="spinner" />
          <p style={{ fontSize: '15px', color: 'var(--text2)' }}>{loadingMsg}</p>
          <p style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '8px' }}>
            Powered by Google Gemini — free
          </p>
        </div>
      )}

      {appState === 'results' && analysisData && (
        <div>
          <div
            style={{
              marginBottom: '1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>
                🏃 Your Training Story
              </h1>
              <p style={{ fontSize: '14px' }}>
                {analysisData.summary.totalRuns} runs · {analysisData.summary.totalKm.toFixed(0)} km total
              </p>
            </div>
            <span className="free-badge">✓ Powered by Gemini</span>
          </div>

          <div className="tab-bar">
            {tabs.map((t) => (
              <button
                key={t.id}
                className={activeTab === t.id ? 'tab-btn active' : 'tab-btn'}
                onClick={() => setActiveTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {activeTab === 'story' && <StoryTab data={analysisData} />}
          {activeTab === 'stats' && <StatsTab data={analysisData} />}
          {activeTab === 'runs' && <RunsTab data={analysisData} />}
          {activeTab === 'plan' && <PlanTab data={analysisData} />}

          <div className="footer">
            <button className="btn" onClick={reset}>
              🔄 Analyze new data
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
