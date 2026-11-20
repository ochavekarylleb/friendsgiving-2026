export const choices = {
  food: [['Italian','Pasta, pizza & tiramisu','🍝'],['Mexican','Tacos, quesadillas, birria & churros','🌮'],['Filipino','Filipino dishes and comfort food','🍲'],['Japanese','Sushi, bentos & cheesecake','🍣']],
  drink: [['Mocktails'],['Matcha & Coffee'],['Wine']],
  dress: [['Pajamas','Cozy, comfortable, and absolutely no judgment.','☾'],['Color Coded','Everyone chooses or gets assigned a color.','✦'],['Costumes','Go all out. The more ridiculous, the better.','✧']],
  location: [['Kai’s Place','I’m good with hosting at Kai’s.','⌂'],['Hotel','I’d prefer a hotel or private accommodation.','◇'],['My House','We can also do it at my house!','♡']],
} as const
export type Choice = keyof typeof choices
export type Answers = {name:string; days:number[]; food:string; drink:string; dress:string; contribution:string; location:string}
export type Response = Answers & { id:string; color:string; revision:number }
export type EditKey = {id:string; token:string}
export const days = Array.from({length:15}, (_, index) => index + 1)
export const labels: Record<Choice,string> = {food:'Food',drink:'Drinks',dress:'Dress code',location:'Location'}
export const steps = [
  ['Name','First things first. Who’s coming?','We need to know who’s behind these very important dinner decisions.'],
  ['Dates','When are you free?','Help us find a date when most of us can actually show up. Revolutionary concept, we know.'],
  ['Food','What are we eating?','Because the most important part of this entire gathering is obviously the food.'],
  ['Drinks','Let’s talk drinks.','Hydration, but make it a little more interesting.'],
  ['Dress code','But what are we wearing?','Because showing up is mandatory. Looking good is optional. Well, sort of.'],
  ['Contributions','Are you bringing anything to the table?','Contributions are welcome. Showing up empty-handed is also a personality trait we can discuss.'],
  ['Location','Where are we hosting this little gathering?','We need a place to eat, drink, play games, and potentially make questionable decisions.'],
  ['Review','Shall we make it official?','Check your answers before sending them to the table.'],
] as const
export const empty: Answers = {name:'',days:[],food:'',drink:'',dress:'',contribution:'',location:''}
export const choiceSteps: Partial<Record<number,Choice>> = {2:'food',3:'drink',4:'dress',6:'location'}
export const eventDate = new Date('2026-12-01T00:00:00+04:00')
export function leaders<T>(items:T[], score:(item:T)=>number) {
  const high = Math.max(0,...items.map(score))
  return high ? items.filter(item => score(item) === high) : []
}
