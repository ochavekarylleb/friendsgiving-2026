import {useEffect, useRef, useState} from 'react'
import {choiceSteps, choices, days, empty, labels, steps} from './data'
import type {Answers, Choice} from './data'

function restore(): Answers {
  try { return {...empty,...JSON.parse(sessionStorage.getItem('friendsgiving-draft') || '{}')} }
  catch { return empty }
}

export function Planner() {
  const [answers,setAnswers] = useState(restore)
  const [step,setStep] = useState(0)
  const [error,setError] = useState('')
  const [message,setMessage] = useState('')
  const [copied,setCopied] = useState(false)
  const heading = useRef<HTMLHeadingElement>(null)
  const changeStep = (next:number) => {setStep(next);setError('');requestAnimationFrame(() => heading.current?.focus())}
  const update = <K extends keyof Answers>(key:K,value:Answers[K]) => {setAnswers(previous => ({...previous,[key]:value}));setError('')}
  const group = choiceSteps[step]

  useEffect(() => {
    try {sessionStorage.setItem('friendsgiving-draft', JSON.stringify(answers))} catch { /* Storage is optional. */ }
  },[answers])

  function submit() {
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
    setMessage([
      'Hi Kai! Here’s my Friendsgiving RSVP.',
      '',
      'Name: ' + answers.name.trim(),
      'Available dates: December ' + answers.days.join(', '),
      'Food: ' + answers.food,
      'Drinks: ' + answers.drink,
      'Dress code: ' + answers.dress,
      'What I can bring: ' + (answers.contribution.trim() || 'Nothing listed'),
      'Location: ' + answers.location,
    ].join('\n'))
    setCopied(false)
    requestAnimationFrame(() => heading.current?.focus())
  }

  return <section id="planner" className="section planner">
    <div className="section-heading"><p className="eyebrow">The RSVP</p><h2>Friendsgiving planner</h2><p>Pick what works for you, then send your answers privately to Kai.</p></div>
    {message ? <div className="panel form-panel">
      <h3 ref={heading} tabIndex={-1}>Your RSVP message is ready.</h3>
      <p>Open WhatsApp and tap Send to deliver your answers to Kai.</p>
      <label className="field">Your message<textarea id="rsvp-message" rows={10} readOnly value={message} onFocus={event => event.target.select()}/></label>
      <div className="form-actions">
        <button className="button secondary" onClick={() => {setMessage('');changeStep(7)}}>Edit answers</button>
        <button className="button secondary" onClick={async () => {
          try {await navigator.clipboard.writeText(message);setCopied(true)}
          catch {document.getElementById('rsvp-message')?.focus()}
        }}>{copied ? 'Copied' : 'Copy message'}</button>
        <a className="button" href={'https://wa.me/971524806236?text=' + encodeURIComponent(message)} target="_blank" rel="noopener noreferrer">Open WhatsApp</a>
      </div>
    </div> : <form className="panel form-panel" onSubmit={event => {event.preventDefault();submit()}} noValidate>
      <div className="step-label"><span>{steps[step][0]}</span><span>Step {step + 1} of {steps.length}</span></div>
      <progress aria-label="RSVP progress" value={step + 1} max={steps.length}/>
      <h3 ref={heading} tabIndex={-1}>{steps[step][1]}</h3>
      <p>{steps[step][2]}</p>
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
      {group && <fieldset className="options"><legend className="sr-only">{labels[group]}</legend>
        {choices[group].map(([value,description,icon]) => <label className="option" key={value}>
          <input type="radio" name={group} value={value} checked={answers[group] === value} onChange={() => update(group,value)}/>
          <span className="option-icon" aria-hidden="true">{icon}</span><span><strong>{value}</strong><small>{description}</small></span>
        </label>)}
      </fieldset>}
      {step === 5 && <label className="field">What can you bring? (optional)<textarea value={answers.contribution} maxLength={600} rows={5} onChange={event => update('contribution',event.target.value)} placeholder="Maybe decorations, card games, snacks, desserts, extra food, drinks, or anything else you think would make the night better..."/></label>}
      {step === 7 && <><dl className="review">
        <div><dt>Name</dt><dd>{answers.name}</dd></div>
        <div><dt>Available dates</dt><dd>December {answers.days.join(', ')}</dd></div>
        {(Object.keys(labels) as Choice[]).map(key => <div key={key}><dt>{labels[key]}</dt><dd>{answers[key]}</dd></div>)}
        <div><dt>What you can bring</dt><dd>{answers.contribution || 'Nothing listed'}</dd></div>
      </dl><p>Your answers go to Kai in a private WhatsApp message.</p></>}
      {error && <p role="alert" className="notice">{error}</p>}
      <div className="form-actions">
        {step > 0 && <button className="button secondary" type="button" onClick={() => changeStep(step - 1)}>Back</button>}
        <button className="button">{step === 7 ? 'Prepare my message' : 'Continue'}</button>
      </div>
    </form>}
  </section>
}
