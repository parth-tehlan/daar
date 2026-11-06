import type { Developer, Project } from '../../../types';
import type { HandoverTiming } from '../finance';
import { HandoverTimeline } from '../charts/HandoverTimeline';
import { DelayStrip } from '../charts/DelayStrip';
import { Section, StatRow } from './Parts';

export function Handover({ t, project, developer }: { t: HandoverTiming; project: Project; developer: Developer }) {
  const n = developer.pastProjects.length;
  const months = Math.round(developer.avgDelayMonths);
  const sentence = months > 0
    ? `${developer.name} has delivered ${developer.deliveredCount} projects. The ${n} most recent ran ${months} months late on average, so plan for ${t.estLabel}.`
    : `${developer.name} has delivered ${developer.deliveredCount} projects. The ${n} most recent arrived on time, so ${t.promisedLabel} looks realistic.`;
  return (
    <Section n="03" title="Handover">
      <StatRow size="display" items={[
        { label: 'Promised', value: t.promisedLabel },
        { label: 'Our estimate', value: t.estLabel },
      ]} />
      <p className="detail-note detail-handover__text">{sentence}</p>
      <HandoverTimeline t={t} builtPct={project.constructionPct} />
      <DelayStrip projects={developer.pastProjects} />
    </Section>
  );
}
