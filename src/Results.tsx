import {choices, days, labels, leaders} from './data'
import type {Choice, Response} from './data'

export function Guest({guest}:{guest: Pick<Response,'name'|'color'>}) {
  return <span className="guest"><i style={{background:guest.color}} aria-hidden="true"/>{guest.name}</span>
}

export function Results({rows,status}:{rows:Response[]; status:string}) {
  const groups = Object.keys(choices) as Choice[]
  const guestsOn = (day:number) => rows.filter(guest => guest.days.includes(day))
  const topDays = leaders(days, day => guestsOn(day).length)
  const winners = (group:Choice) => leaders(choices[group].map(([value]) => value as string), value => rows.filter(guest => guest[group] === value).length)
  const contributions = rows.filter(guest => guest.contribution)

  return <section id="results" className="section results">
    <div className="section-heading"><p className="eyebrow">The group vote</p><h2>Everyone’s responses</h2><p>See which dates and dinner ideas are getting the most votes.</p></div>
    <p role="status" className="status">{status || (rows.length ? `${rows.length} guest${rows.length === 1 ? '' : 's'} responded` : 'No RSVPs yet. The first vote is yours.')}</p>
    <div className="panel current-plan"><div><p className="eyebrow">Tentative</p><h3>The current plan</h3></div><dl>
      <div><dt>December date</dt><dd>{topDays.length ? topDays.join(', ') : 'Awaiting votes'}</dd></div>
      {groups.map(group => <div key={group}><dt>{labels[group]}</dt><dd>{winners(group).join(' / ') || 'Awaiting votes'}</dd></div>)}
    </dl></div>
    <div className="panel">
      <h3>December 1–15 availability</h3>
      {!!rows.length && <div className="legend" aria-label="Guest color legend">{rows.map(guest => <Guest key={guest.id} guest={guest}/>)}</div>}
      <div className="shared-calendar">
        {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day => <span className="weekday" key={day}>{day}</span>)}
        <div className="calendar-spacer" aria-hidden="true"/>
        {days.map(day => {
          const guests = guestsOn(day)
          return <div className={'day-result' + (topDays.includes(day) ? ' leading' : '')} key={day}>
            <div><strong>{day}</strong><span>{guests.length} free</span></div>
            {guests.map(guest => <Guest key={guest.id} guest={guest}/>)}
          </div>
        })}
      </div>
    </div>
    <div className="result-grid">
      {groups.map(group => <div className="panel" key={group}><h3>{labels[group]} votes</h3>
        {choices[group].map(([value]) => {
          const voters = rows.filter(guest => guest[group] === value)
          return <div className={'vote' + (winners(group).includes(value) ? ' leading' : '')} key={value}>
            <div><strong>{value}</strong><span>{voters.length} {voters.length === 1 ? 'vote' : 'votes'}</span></div>
            <progress aria-label={value + ' votes'} value={voters.length} max={rows.length || 1}/>
            <div className="legend">{voters.map(guest => <Guest key={guest.id} guest={guest}/>)}</div>
          </div>
        })}
      </div>)}
    </div>
    <div className="panel"><h3>What everyone is bringing</h3>{contributions.length
      ? contributions.map(guest => <div className="contribution" key={guest.id}><Guest guest={guest}/><p>{guest.contribution}</p></div>)
      : <p>No contributions listed yet.</p>}
    </div>
  </section>
}
