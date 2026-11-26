import { useEffect, useState } from 'react';
import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';

type Workout = { title: string; reason?: string; focus?: string; minutes?: number; difficulty?: string };

export default function Workouts() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getJson<{ suggestions: Workout[] }>('/api/workouts/suggestions/mona%40example.com')
      .then((data) => setWorkouts(data.suggestions))
      .catch((caught) => setError(caught instanceof Error ? caught.message : 'Unknown error'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns." loading={loading} error={error} empty={workouts.length === 0} emptyText="No workout suggestions yet">
      <ul className="list-group">
        {workouts.map((workout, index) => (
          <li className="list-group-item" key={`${workout.title}-${index}`}>
            <strong>{workout.title}</strong>{workout.reason ? ` - ${workout.reason}` : ''}
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
