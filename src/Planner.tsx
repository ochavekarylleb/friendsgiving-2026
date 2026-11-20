import {Sticker} from './Sticker'
import {useEffect, useRef, useState} from 'react'
import {choiceSteps, choices, days, empty, labels, steps} from './data'
import type {Answers, Choice, Response} from './data'
import {columns, createEditKey, db, editUrl, keyFromUrl, save, table} from './backend'
import {AvailabilityResults, Contributions, Guest, VoteResults} from './Results'

function whatsappUrl(answers:Answers) {
  const message = [
    'Hi Kai! Here’s my Friendsgiving RSVP.',
    'Name: ' + answers.name.trim(),
    'Available dates: December ' + answers.days.join(', '),
    ...Object.entries(labels).map(([key,label]) => label + ': ' + answers[key as Choice]),
    'What I can bring: ' + (answers.contribution.trim() || 'Nothing listed'),
  ].join('\n')
  return 'https://wa.me/971524806236?text=' + encodeURIComponent(message)
}

function restore(): Answers {
  try { return {...empty,...JSON.parse(sessionStorage.getItem('friendsgiving-draft') || '{}')} }
  catch { return empty }
}

export function Planner({onSave,rows,status}:{onSave:(row:Response)=>void;rows:Response[];status:string}) {
  const [incoming] = useState(keyFromUrl)
  const [editKey] = useState(() => incoming ?? createEditKey())
  const [answers,setAnswers] = useState<Answers>(() => incoming ? empty : restore())
  const [editing,setEditing] = useState<Response|null>(null)
  const [step,setStep] = useState(0)
  const [error,setError] = useState('')
  const [busy,setBusy] = useState(!!incoming && !!db)
  const [saved,setSaved] = useState<Response|null>(null)
  const [copied,setCopied] = useState(false)
  const heading = useRef<HTMLHeadingElement>(null)
  const changeStep = (next:number) => {setStep(next);setError('');requestAnimationFrame(() => heading.current?.focus())}
  const update = <K extends keyof Answers>(key:K,value:Answers[K]) => {setAnswers(previous => ({...previous,[key]:value}));setError('')}
  const group = choiceSteps[step]

  useEffect(() => {
    if (!incoming || !db) return
    const client = db
    let active = true
    document.getElementById('planner')?.scrollIntoView()
    client.from(table).select(columns).eq('id',incoming.id).maybeSingle().then(({data,error}) => {
      if (!active) return
      if (error || !data) setError('We couldn’t load the RSVP for this edit link. Check the link and reload.')
      else {setEditing(data as Response);setAnswers(data as Response)}
      setBusy(false)
    })
    return () => {active = false}
  },[incoming])
  useEffect(() => {
    if (incoming || saved) return
    try {sessionStorage.setItem('friendsgiving-draft', JSON.stringify(answers))} catch { /* Storage is optional. */ }
  },[answers,incoming,saved])
  useEffect(() => {
    if (!editing || saved) return
    const warn = (event:BeforeUnloadEvent) => {event.preventDefault();event.returnValue = ''}
    window.addEventListener('beforeunload',warn)
    return () => window.removeEventListener('beforeunload',warn)
  },[editing,saved])

  async function submit() {
    const validation = [
      answers.name.trim().length < 2 ? 'Enter a name with at least two characters.' : '',
      !answers.days.length ? 'Pick at least one available date.' : '',
      !answers.food ? 'Choose one dinner theme.' : '',
      !answers.drink ? 'Choose one drink preference.' : '',
      !answers.dress ? 'Choose one dress code.' : '',
      '',
      !answers.location ? 'Choose one location.' : '',
    ]
    const invalid = validation.findIndex(Boolean)
    if (invalid !== -1 && (step === 7 || invalid <= step)) {
      changeStep(invalid)
      setError(validation[invalid])
      return
    }
    if (step < 7) {changeStep(step + 1);return}
    if (!db || (incoming && !editing)) return
    if (editing && !window.confirm('Replace your previously submitted answers?')) return
    setBusy(true)
    setError('')
    try {
      const row = await save(answers,editKey,editing?.revision ?? 0)
      setSaved(row)
      onSave(row)
      try {sessionStorage.removeItem('friendsgiving-draft')} catch { /* Storage is optional. */ }
      requestAnimationFrame(() => heading.current?.focus())
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'We couldn’t save your answers.')
    } finally {setBusy(false)}
  }

  return <section id="planner" className="section planner">
    <Sticker name="goblet" placement="sticker-rsvp"/>
    <div className="section-heading"><p className="eyebrow">The RSVP</p><h2>Friendsgiving planner</h2><p>Help pick the date and what goes on the table.</p></div>
    {saved ? <div className="panel form-panel">
      <p className="eyebrow"><Guest guest={saved}/></p>
      <h3 ref={heading} tabIndex={-1}>You’re officially part of the plan.</h3>
      <p>Your answers have been saved. Now let’s see if we can get everyone in the same room at the same time.</p>
      <label htmlFor="edit-link">Private edit link</label>
      <p>Save this link so you can change your RSVP from any device. Anyone with the link can edit your answers.</p>
      <div className="copy"><input id="edit-link" readOnly value={editUrl(editKey)} onFocus={event => event.target.select()}/>
      <button className="button secondary" onClick={async () => {
        try {await navigator.clipboard.writeText(editUrl(editKey));setCopied(true)}
        catch {document.getElementById('edit-link')?.focus()}
      }}>{copied ? 'Copied' : 'Copy link'}</button></div>
      <div className="form-actions"><a className="button secondary" href={whatsappUrl(saved)} target="_blank" rel="noopener noreferrer">Message Kai</a><a className="button" href="#results">View everyone’s responses</a></div>
    </div> : <form className="panel form-panel" onSubmit={event => {event.preventDefault();void submit()}} noValidate>
      <div className="step-label"><span>{editing ? 'Editing your RSVP' : steps[step][0]}</span><span>Step {step + 1} of {steps.length}</span></div>
      <progress aria-label="RSVP progress" value={step + 1} max={steps.length}/>
      <h3 ref={heading} tabIndex={-1}>{steps[step][1]}</h3>
      <p>{steps[step][2]}</p>
      {!db && <p className="notice">Shared RSVPs are pending. You can still review your answers and send them privately to Kai.</p>}
      {step === 0 && <label className="field">Your name<input value={answers.name} required maxLength={50} autoComplete="name" placeholder="First name or nickname" onChange={event => update('name',event.target.value)}/></label>}
      {step === 1 && <div>
        <p className="eyebrow">December 2026</p>
        <div className="pick-calendar">
          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day => <span className="weekday" key={day}>{day}</span>)}
          <span aria-hidden="true"/>
          {days.map(day => <button type="button" key={day} aria-label={`December ${day}`} aria-pressed={answers.days.includes(day)} onClick={() => update('days',answers.days.includes(day) ? answers.days.filter(value => value !== day) : [...answers.days,day].sort((a,b) => a-b))}>{day}</button>)}
          {Array.from({length:15},(_,index) => index + 16).map(day => <button type="button" key={day} disabled aria-label={`December ${day}, outside voting window`}>{day}</button>)}
          <button type="button" disabled aria-label="December 31, outside voting window">31</button>
        </div>
        <p>Pick every date that works for you. More options mean a better chance of getting everyone together!</p>
        <p aria-live="polite">{answers.days.length} selected</p>
      </div>}
      {step === 3 && <Sticker name="tumbler" placement="sticker-drink-step"/>}
      {group && <fieldset className="options"><legend className="sr-only">{labels[group]}</legend>
        {choices[group].map(([value,description,icon]) => <label className="option" key={value}>
          <input type="radio" name={group} value={value} checked={answers[group] === value} onChange={() => update(group,value)}/>
          <span className="option-icon" aria-hidden="true">{icon}</span><span><strong>{value}</strong><small>{description}</small></span>
        </label>)}
      </fieldset>}
      {step === 5 && <label className="field">What can you bring? (optional)<textarea value={answers.contribution} maxLength={600} rows={5} onChange={event => update('contribution',event.target.value)} placeholder="Maybe decorations, card games, snacks, desserts, extra food, drinks, or anything else you think would make the night better..."/></label>}
      {step === 7 && <><dl className="review">
        <div><dt>Name</dt><dd>{editing ? <Guest guest={{...editing,name:answers.name}}/> : answers.name}</dd></div>
        <div><dt>Guest color</dt><dd>{editing ? editing.color : 'Assigned when you submit'}</dd></div>
        <div><dt>Available dates</dt><dd>December {answers.days.join(', ')}</dd></div>
        {(Object.keys(labels) as Choice[]).map(key => <div key={key}><dt>{labels[key]}</dt><dd>{answers[key]}</dd></div>)}
        <div><dt>What you can bring</dt><dd>{answers.contribution || 'Nothing listed'}</dd></div>
      </dl><p>{db ? 'Submitting publishes your name and answers in the shared results.' : 'WhatsApp sends your answers to Kai. They won’t appear in the shared dashboard until shared RSVPs are connected.'}</p></>}
      {(step === 1 || group || step === 5) && <section className="inline-results" aria-label="Responses so far">
        <h4>{step === 1 ? 'Who’s free so far?' : step === 5 ? 'What people are bringing' : labels[group!] + ' votes so far'}</h4>
        {status && <p>{status}</p>}
        {!!rows.length && (step === 1 ? <AvailabilityResults rows={rows}/> : group ? <VoteResults group={group} rows={rows}/> : <Contributions rows={rows}/>)}
        {!status && !rows.length && <p>No responses yet.</p>}
      </section>}
      {step === 7 && <a className="button secondary" href={whatsappUrl(answers)} target="_blank" rel="noopener noreferrer">{db ? 'Message Kai privately' : 'Open WhatsApp to send to Kai'}</a>}
      {error && <p role="alert" className="notice">{error}</p>}
      <div className="form-actions">
        {step > 0 && <button className="button secondary" type="button" disabled={busy} onClick={() => changeStep(step - 1)}>Back</button>}
        <button className="button" disabled={busy || (!!incoming && !editing) || (step === 7 && !db)}>{busy ? (step === 7 ? 'Saving…' : 'Loading…') : step === 7 ? (editing ? 'Save my changes' : 'Submit my answers') : 'Continue'}</button>
      </div>
    </form>}
  </section>
}
