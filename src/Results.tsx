import {Sticker} from './Sticker'
import {choices, days, labels, leaders} from './data'
import type {Choice, Response} from './data'

export function Guest({guest}:{guest: Pick<Response,'name'|'color'>}) {
  return <span className="guest"><i style={{background:guest.color}} aria-hidden="true"/>{guest.name}</span>
}

export function VoteResults({group,rows}:{group:Choice;rows:Response[]}) {
  const options = choices[group].map(([value]) => ({
    value,voters:rows.filter(guest => guest[group] === value),
  }))
  const leading = leaders(options, option => option.voters.length)
  return <div className="vote-results">
    {options.map(option => <div className={'vote' + (leading.includes(option) ? ' leading' : '')} key={option.value}>
      <div><strong>{option.value}</strong><span>{option.voters.length} {option.voters.length === 1 ? 'vote' : 'votes'}</span></div>
      <progress aria-label={option.value + ' votes'} value={option.voters.length} max={rows.length || 1}/>
      {!!option.voters.length && <div className="legend">{option.voters.map(guest => <Guest key={guest.id} guest={guest}/>)}</div>}
    </div>)}
  </div>
}

function withHostAvailability(rows: Response[]): Pick<Response, 'id' | 'name' | 'color' | 'days'>[] {
  const kai = rows.find(guest => guest.name.trim().toLowerCase() === 'kai')
  if (kai) {
    return rows.map(guest => guest.id === kai.id
      ? {...guest, days: [...new Set([...guest.days, 1])]}
      : guest)
  }
  return [...rows, {id:'host-kai', name:'Kai', color:'#B99273', days:[1]}]
}

export function AvailabilityResults({rows}:{rows:Response[]}) {
  const availability = withHostAvailability(rows)
  const guestsOn = (day:number) => availability.filter(guest => guest.days.includes(day))
  const topDays = leaders(days, day => guestsOn(day).length)
  return <>
    <div className="legend" aria-label="Guest color legend">{availability.map(guest => <Guest key={guest.id} guest={guest}/>)}</div>
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
  </>
}

export function Contributions({rows}:{rows:Response[]}) {
  const contributions = rows.filter(guest => guest.contribution)
  return contributions.length
    ? contributions.map(guest => <div className="contribution" key={guest.id}><Guest guest={guest}/><p>{guest.contribution}</p></div>)
    : <p>No contributions listed yet.</p>
}

export function Results({rows,status}:{rows:Response[]; status:string}) {
  const groups = Object.keys(choices) as Choice[]
  const availability = withHostAvailability(rows)
  const topDays = leaders(days, day => availability.filter(guest => guest.days.includes(day)).length)
  const winners = (group:Choice) => leaders(choices[group].map(([value]) => value as string), value => rows.filter(guest => guest[group] === value).length)

  return <section id="results" className="section results">
    <div className="section-heading"><p className="eyebrow">The group vote</p><h2>Everyone’s responses</h2><p>See which dates and dinner ideas are getting the most votes.</p></div>
    <p role="status" className="status">{status || (rows.length ? `${rows.length} guest${rows.length === 1 ? '' : 's'} responded` : 'No RSVPs yet. The first vote is yours.')}</p>
    <div className="panel current-plan"><div><p className="eyebrow">Tentative</p><h3>The current plan</h3></div><dl>
      <div><dt>December date</dt><dd>{topDays.length ? topDays.join(', ') : 'Awaiting votes'}</dd></div>
      {groups.map(group => <div key={group}><dt>{labels[group]}</dt><dd>{winners(group).join(' / ') || 'Awaiting votes'}</dd></div>)}
    </dl></div>
    <div className="panel">
      <h3>December 1–15 availability</h3>
      <AvailabilityResults rows={rows}/>
    </div>
    <div className="result-grid">
      {groups.map(group => <div className="panel" key={group}><h3>{labels[group]} votes</h3>
        <VoteResults group={group} rows={rows}/>
      </div>)}
    </div>
    <div className="panel contribution-panel"><Sticker name="rocks" placement="sticker-contributions"/><h3>What everyone is bringing</h3><Contributions rows={rows}/></div>
  </section>
}
