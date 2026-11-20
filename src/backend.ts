import {createClient} from '@supabase/supabase-js'
import type {Answers, EditKey, Response} from './data'
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
export const db = url && key ? createClient(url,key) : null
export const table = 'friendsgiving_responses'
export const columns = 'id,name,color,days,food,drink,dress,contribution,location,revision'
export function createEditKey(): EditKey {
  return {
    id: crypto.randomUUID(),
    token: Array.from(crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2,'0')).join(''),
  }
}
export function keyFromUrl(): EditKey | null {
  const match = /^#edit=([0-9a-f-]{36})\.([0-9a-f]{64})$/.exec(location.hash)
  return match ? {id:match[1],token:match[2]} : null
}
export function editUrl(key:EditKey) {
  return location.origin + location.pathname + '#edit=' + key.id + '.' + key.token
}
export async function save(answers:Answers, edit:EditKey, revision:number) {
  if (!db) throw new Error('RSVPs will open once the shared database is connected.')
  const {data,error} = await db.rpc('save_friendsgiving_rsvp',{
    p_id:edit.id,p_token:edit.token,p_revision:revision,p_name:answers.name,
    p_days:answers.days,p_food:answers.food,p_drink:answers.drink,p_dress:answers.dress,
    p_contribution:answers.contribution,p_location:answers.location,
  }).single()
  if (error) throw new Error(error.code === 'P0001' ? error.message : 'We couldn’t save your answers. Please try again.')
  return data as Response
}
