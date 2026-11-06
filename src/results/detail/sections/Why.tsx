import type { Match } from '../../../types';
import { Section } from './Parts';

export function Why({ match }: { match: Match }) {
  return (
    <Section title="Why it fits">
      <ul className="detail-why">
        {match.reasons.map((r, i) => (
          <li className="detail-why__row" key={`${i}-${r.because}`}>
            <span className="detail-why__because">{r.because}</span>
            <span className="detail-why__finding">{r.finding}</span>
          </li>
        ))}
        {match.caveat ? (
          <li className="detail-why__row">
            <span className="detail-why__because detail-why__note">
              <span className="detail-why__sq" aria-hidden="true" />
              <span className="label">Note</span>
            </span>
            <span className="detail-why__finding">{match.caveat}</span>
          </li>
        ) : null}
      </ul>
    </Section>
  );
}
