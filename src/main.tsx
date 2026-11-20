import {Sticker} from './Sticker'
import {useEffect,useState} from 'react'
import {createRoot} from 'react-dom/client'
import {columns,db,table} from './backend'
import {eventDate,type Response} from './data'
import {Planner} from './Planner'
import {Results} from './Results'
import './style.css'

const menu = [
  ['♨','Food','A proper dinner with lots of food. Nobody is leaving hungry.'],
  ['♢','Drinks','Plenty of drinks to keep the conversations flowing.'],
  ['♠','Games','Card games, drinking games, and a little friendly competition.'],
  ['✧','Conversations','Talks, laughter, stories, and probably some things that should stay at the dinner table.'],
]

function App() {
  const [rows,setRows] = useState<Response[]>([])
  const [status,setStatus] = useState(db ? 'Loading responses…' : 'Shared results will open once the RSVP database is connected.')
  const [remaining,setRemaining] = useState(() => Math.ceil((+eventDate - Date.now()) / 86400000))
  useEffect(() => {
    const timer = window.setInterval(() => setRemaining(Math.ceil((+eventDate - Date.now()) / 86400000)), 60000)
    return () => window.clearInterval(timer)
  },[])
  useEffect(() => {
    const client = db
    if (!client) return
    let active = true
    let request = 0
    async function refresh() {
      const latest = ++request
      const {data,error} = await client!.from(table).select(columns).order('name')
      if (!active || latest !== request) return
      if (error) setStatus('We couldn’t load the shared results. We’ll retry shortly.')
      else {setRows(data as Response[]);setStatus('')}
    }
    const channel = client.channel('friendsgiving-results')
      .on('postgres_changes',{event:'*',schema:'public',table},() => void refresh())
      .subscribe(state => {if (state === 'SUBSCRIBED') void refresh()})
    void refresh()
    const timer = window.setInterval(refresh,15000)
    window.addEventListener('focus',refresh)
    return () => {
      active = false
      window.clearInterval(timer)
      window.removeEventListener('focus',refresh)
      void client.removeChannel(channel)
    }
  },[])
  function onSave(row:Response) {
    setRows(previous => [...previous.filter(guest => guest.id !== row.id),row].sort((a,b) => a.name.localeCompare(b.name)))
  }
  return <>
    <a href="#invitation" className="skip">Skip to invitation</a>
    <header className="masthead"><a className="wordmark" href="#invitation"><span aria-hidden="true">✦</span> Friendsgiving <em>2026</em></a>
      <nav aria-label="Main navigation"><a href="#plan">The plan</a><a href="#planner">RSVP</a><a href="#results">Results</a></nav>
    </header>
    <main>
      <section id="invitation" className="hero">
        <div className="hero-copy">
          <Sticker name="friends" placement="sticker-hero"/>
          <p className="eyebrow"><span aria-hidden="true">✦</span> You’re invited to <span aria-hidden="true">✦</span></p>
          <h1>Friendsgiving</h1>
          <p className="hero-subtitle">Dinner with friends</p>
          <p className="hero-description">An evening of good food, questionable decisions, and even better company.</p>
          <div className="event-strip"><span>December 2026</span><span>8:00 PM–12:00 AM</span></div>
          <p className="tentative">Exact date to be decided by the group</p>
          <a className="button" href="#plan">Count me in</a>
          {remaining > 0 && <p className="countdown">{remaining} {remaining === 1 ? 'day' : 'days'} until December</p>}
        </div>
        <div className="art"><img src={import.meta.env.BASE_URL + 'invitation.png'} width="1240" height="1748" alt="Cream ink illustration of a holiday dinner table and Christmas tree on a burgundy invitation." /></div>
      </section>
      <section id="plan" className="section plan">
        <Sticker name="table" placement="sticker-plan"/>
        <div className="section-heading"><p className="eyebrow">The dinner party</p><h2>So, what are we getting ourselves into?</h2>
        <p>Friendsgiving is our excuse to get everyone together for one night of good food, endless drinks, questionable card game strategies, and conversations that somehow last until midnight.</p>
        <p>Think of it as Thanksgiving, minus the family interrogation.</p></div>
        <dl className="details panel"><div><dt>Occasion</dt><dd>Friendsgiving dinner</dd></div><div><dt>Month</dt><dd>December 2026</dd></div><div><dt>Exact date</dt><dd>Group vote · December 1–15</dd></div><div><dt>Time</dt><dd>8:00 PM–12:00 AM</dd></div></dl>
        <h3 className="menu-title">What’s on the menu?</h3>
        <div className="menu">{menu.map(([icon,title,description]) => <article key={title} className="panel"><span aria-hidden="true">{icon}</span><h4>{title}</h4>{title === 'Food' && <Sticker name="cutlery" placement="sticker-cutlery"/>}{title === 'Drinks' && <Sticker name="martini" placement="sticker-menu"/>}<p>{description}</p></article>)}</div>
        <div className="closing"><Sticker name="supper" placement="sticker-closing"/><p>Come hungry, come thirsty, and come prepared to expose your competitive side.</p><a className="button" href="#planner">Let’s figure out the details</a></div>
      </section>
      <Planner onSave={onSave} rows={rows} status={status}/>
      <Results rows={rows} status={status}/>
    </main>
    <footer><Sticker name="stools" placement="sticker-footer"/><span aria-hidden="true">✦</span><p>A gathering of people who should probably not be left unsupervised.</p><small>FRIENDSGIVING DINNER | ONE TABLE. ENDLESS FOOD. TOO MANY PERSONALITIES.</small></footer>
  </>
}

createRoot(document.getElementById('root')!).render(<App/>)
