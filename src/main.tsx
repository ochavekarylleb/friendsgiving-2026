import {useEffect,useState} from 'react'
import {createRoot} from 'react-dom/client'
import {eventDate} from './data'
import {Planner} from './Planner'
import './style.css'

const menu = [
  ['♨','Food','A proper dinner with lots of food. Nobody is leaving hungry.'],
  ['♢','Drinks','Plenty of drinks to keep the conversations flowing.'],
  ['♠','Games','Card games, drinking games, and a little friendly competition.'],
  ['✧','Conversations','Talks, laughter, stories, and probably some things that should stay at the dinner table.'],
]

function App() {
  const [remaining,setRemaining] = useState(() => Math.ceil((+eventDate - Date.now()) / 86400000))
  useEffect(() => {
    const timer = window.setInterval(() => setRemaining(Math.ceil((+eventDate - Date.now()) / 86400000)), 60000)
    return () => window.clearInterval(timer)
  },[])
  return <>
    <a href="#invitation" className="skip">Skip to invitation</a>
    <header className="masthead"><a className="wordmark" href="#invitation"><span aria-hidden="true">✦</span> Friendsgiving <em>2026</em></a>
      <nav aria-label="Main navigation"><a href="#plan">The plan</a><a href="#planner">RSVP</a></nav>
    </header>
    <main>
      <section id="invitation" className="hero">
        <div className="hero-copy">
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
        <div className="section-heading"><p className="eyebrow">The dinner party</p><h2>So, what are we getting ourselves into?</h2>
        <p>Friendsgiving is our excuse to get everyone together for one night of good food, endless drinks, questionable card game strategies, and conversations that somehow last until midnight.</p>
        <p>Think of it as Thanksgiving, minus the family interrogation.</p></div>
        <dl className="details panel"><div><dt>Occasion</dt><dd>Friendsgiving dinner</dd></div><div><dt>Month</dt><dd>December 2026</dd></div><div><dt>Exact date</dt><dd>Tentative · December 1–15</dd></div><div><dt>Time</dt><dd>8:00 PM–12:00 AM</dd></div></dl>
        <h3 className="menu-title">What’s on the menu?</h3>
        <div className="menu">{menu.map(([icon,title,description]) => <article key={title} className="panel"><span aria-hidden="true">{icon}</span><h4>{title}</h4><p>{description}</p></article>)}</div>
        <div className="closing"><p>Come hungry, come thirsty, and come prepared to expose your competitive side.</p><a className="button" href="#planner">Let’s figure out the details</a></div>
      </section>
      <Planner/>
    </main>
    <footer><span aria-hidden="true">✦</span><p>Made with love, questionable decisions, and a lot of food.</p><small>Friendsgiving 2026 | Good food. Good drinks. Good company.</small></footer>
  </>
}

createRoot(document.getElementById('root')!).render(<App/>)
