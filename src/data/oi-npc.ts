import type { Decision, Grade, NpcLine, Scenario, StageKey } from './oi-types'

// ---------------------------------------------------------------------------
// NPC conversations (#45). Three short encounters that test how you talk to
// people, not just how you read data:
//  - hypothesis stage:     an embarrassed case who doesn't want to answer
//  - control stage:        a defensive manager of the implicated site
//  - communication stage:  a persistent reporter demanding a name and a number
//
// Each is a normal graded decision (one best reply, two poor ones), and the
// character reacts the moment you pick a reply. The wording is deliberately
// generic so it works for every scenario, and the hypothesis-stage one comes
// before the source is known, so none of them leak the answer.
//
// Mood describes the character's cooperation afterwards. Note that a reply
// that placates someone is not the same as a good reply: two of the poor
// answers leave the character "guarded" rather than angry, because being
// liked and being effective are different things.
// ---------------------------------------------------------------------------

export const NPC_DECISION_IDS = ['npc_reluctant_case', 'npc_site_operator', 'npc_reporter'] as const

const CASE_NAMES = ['Priya', 'Marcus', 'Elena', 'Tomas', 'Aisha', 'Daniel']
const OPERATOR_NAMES = ['Mr. Okafor', 'Ms. Lindqvist', 'Mr. Delgado', 'Ms. Haruki', 'Mr. Brennan', 'Ms. Adeyemi']
const REPORTER_NAMES = ['Jordan Blake', 'Sam Iyer', 'Riley Chen', 'Casey Moreno', 'Alex Novak', 'Morgan Reyes']

// Stable pick: the same scenario always gets the same character.
function pick(names: string[], seed: string, salt: number): string {
  let h = salt
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0
  return names[Math.abs(h) % names.length]
}

function npc(name: string, role: string, line: string): NpcLine {
  return { name, role, line }
}

export function npcDecisions(scenario: Scenario, stage: StageKey): Decision[] {
  if (stage === 'hypothesis') {
    return [{
      id: 'npc_reluctant_case', stage, title: 'Interview a reluctant case',
      prompt: 'One of the ill people is hesitating in the first interview. How do you respond?',
      npc: npc(pick(CASE_NAMES, scenario.id, 1), 'Ill person, first interview', "I really don't want to go into all of that. It's embarrassing, and I don't see why you need to know what I ate or how I've been. Can we just skip it?"),
      options: [
        { id: 'reassure_and_explain', label: 'Acknowledge the discomfort, explain that the answers are kept confidential and that even small details help protect other people, then start with open questions before the specific ones', detail: 'People share more when they understand why it matters and feel safe. Starting open and moving to specifics keeps the interview comfortable while still getting the details the investigation needs.', reaction: { mood: 'cooperative', text: "Okay. Put like that, it makes sense. If it helps somebody else, I'll tell you. Where do you want me to start?" } },
        { id: 'press_for_answers', label: 'Tell them the interview is required and press for every answer right away', detail: 'Pressure tends to shut people down or produce short, guarded answers, and the exposure history you get is less complete and less reliable.', reaction: { mood: 'hostile', text: "Fine. Whatever you want me to say. I'm done talking after this." } },
        { id: 'skip_sensitive_questions', label: 'Skip the sensitive questions to keep things comfortable and move on', detail: 'It keeps the moment pleasant, but the missing answers leave a gap in the line listing, and an exposure history with holes is a weaker basis for the study.', reaction: { mood: 'guarded', text: "Thanks, that's easier. Honestly, I'm not sure how much use what I've told you will be, though." } },
      ],
    }]
  }
  if (stage === 'control') {
    return [{
      id: 'npc_site_operator', stage, title: 'Face a defensive site manager',
      prompt: 'The manager responsible for the implicated site or product is resisting the control measure. How do you respond?',
      npc: npc(pick(OPERATOR_NAMES, scenario.id, 2), 'Manager of the implicated site or product', "You want us to change how we operate based on statistics? We've done it this way for years and nobody complained. Surely you can wait until you have absolute proof."),
      options: [
        { id: 'firm_and_supportive', label: 'Explain the evidence plainly, be clear the control measure cannot wait for absolute proof, and offer practical help with how to do it quickly and how to resume safely', detail: 'Being firm about the action and generous about the help protects the public while keeping the person on side. Cooperation is far more likely when the path back to normal is clear.', reaction: { mood: 'cooperative', text: "I don't like it. But I'd rather fix it now than be the reason more people get sick. What do you need from me first?" } },
        { id: 'back_down_and_wait', label: 'Agree to wait for more proof before requiring any changes', detail: 'Waiting for certainty that may never come leaves the source in place while people keep being exposed. Real investigations act on the balance of evidence, then refine.', reaction: { mood: 'guarded', text: "Good. Come back when you've got proof and we'll talk." } },
        { id: 'threaten_penalties', label: 'Warn that any resistance will bring immediate legal penalties', detail: 'Leading with threats turns a person who could help into an opponent. Authority is a last resort, not an opening move, and an adversarial start slows the response.', reaction: { mood: 'hostile', text: "Is that a threat? Then you can talk to my lawyer, and you'll get nothing else from me." } },
      ],
    }]
  }
  if (stage === 'communication') {
    return [{
      id: 'npc_reporter', stage, title: 'Answer a persistent reporter',
      prompt: 'A local reporter is pressing you for the story tonight. How do you respond?',
      npc: npc(pick(REPORTER_NAMES, scenario.id, 3), 'Local reporter', "People are scared. Give me a name and a number for tonight's story: who's to blame, and how many more will get sick? If you won't, I'll print what my sources tell me."),
      options: [
        { id: 'facts_and_next_update', label: 'Share what is confirmed and what people should do, decline to speculate on blame or future numbers, and commit to a specific time for the next update', detail: 'Sticking to confirmed facts and a firm update schedule gives the reporter something real to print and keeps you the most reliable source, without promises you cannot back.', reaction: { mood: 'cooperative', text: "That's more than I usually get. I'll run it as you've said it. What time is the next update?" } },
        { id: 'name_and_predict', label: 'Give them the suspected source and your best guess at the final number', detail: 'A named suspect and a predicted count can do real harm if they turn out wrong, and they will be quoted back at you. Speculation is not a substitute for confirmed findings.', reaction: { mood: 'guarded', text: "Now that's a story. I'll run it as fact. And if you turn out to be wrong, I'll run that too." } },
        { id: 'refuse_to_comment', label: 'Decline to say anything until the investigation is finished', detail: 'Silence leaves a vacuum that rumor and unnamed sources fill, and it withholds practical advice people need right now.', reaction: { mood: 'hostile', text: "So you're hiding something. Fine. I'll go with my sources, and I won't be checking anything with you." } },
      ],
    }]
  }
  return []
}

type Judged = { verdict: Grade['verdict']; explanation: string; reference: string }

export function judgeNpc(decisionId: string, chosen: string): Judged | null {
  const REF_CASE = 'Interviewing with empathy and confidentiality'
  const REF_OPERATOR = 'Firm but respectful engagement with a resistant stakeholder'
  const REF_MEDIA = 'Media communication under pressure'
  switch (decisionId) {
    case 'npc_reluctant_case':
      if (chosen === 'reassure_and_explain') return { verdict: 'best', reference: REF_CASE, explanation: 'People share more when they understand why it matters and feel safe. Reassuring on confidentiality and moving from open to specific questions gets the complete exposure history the study depends on.' }
      if (chosen === 'press_for_answers') return { verdict: 'poor', reference: REF_CASE, explanation: 'Pressure shuts people down and produces short, guarded answers, so the exposure history is less complete and less reliable.' }
      return { verdict: 'poor', reference: REF_CASE, explanation: 'Skipping the sensitive questions keeps the moment comfortable but leaves gaps in the line listing. A placated interviewee is not the same as a useful interview.' }
    case 'npc_site_operator':
      if (chosen === 'firm_and_supportive') return { verdict: 'best', reference: REF_OPERATOR, explanation: 'Being firm about the action and generous about the help protects the public while keeping the manager on side. Cooperation is far more likely when the path back to normal is clear.' }
      if (chosen === 'back_down_and_wait') return { verdict: 'poor', reference: REF_OPERATOR, explanation: 'Waiting for certainty leaves the source in place while people are still being exposed. Investigations act on the balance of evidence, then refine.' }
      return { verdict: 'poor', reference: REF_OPERATOR, explanation: 'Leading with threats turns someone who could help into an opponent. Legal authority is a last resort, and an adversarial start slows the response.' }
    case 'npc_reporter':
      if (chosen === 'facts_and_next_update') return { verdict: 'best', reference: REF_MEDIA, explanation: 'Confirmed facts, practical advice, and a firm update time give the reporter something real to print and keep you the most reliable source, without promises you cannot back.' }
      if (chosen === 'name_and_predict') return { verdict: 'poor', reference: REF_MEDIA, explanation: 'Naming an unconfirmed source and predicting a number can do real harm if wrong, and both will be quoted back at you. Speculation is not a substitute for confirmed findings.' }
      return { verdict: 'poor', reference: REF_MEDIA, explanation: 'Saying nothing leaves a vacuum that rumor and unnamed sources fill, and it withholds advice people need now.' }
    default:
      return null
  }
}
