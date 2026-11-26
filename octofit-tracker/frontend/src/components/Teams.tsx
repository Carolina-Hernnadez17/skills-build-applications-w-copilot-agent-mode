import { useEffect, useState } from 'react';
import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';

type Team = { name: string; mascot?: string; members: string[] };

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getJson<{ teams: Team[] }>('/api/teams')
      .then((data) => setTeams(data.teams))
      .catch((caught) => setError(caught instanceof Error ? caught.message : 'Unknown error'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <CapabilityCard title="Teams" description="Manage teams and members." loading={loading} error={error} empty={teams.length === 0} emptyText="No teams yet">
      <ul className="list-group">
        {teams.map((team, index) => (
          <li className="list-group-item" key={`${team.name}-${index}`}>
            {team.name}{team.mascot ? ` - ${team.mascot}` : ''}
            {team.members.length > 0 && ` (${team.members.length} members)`}
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
