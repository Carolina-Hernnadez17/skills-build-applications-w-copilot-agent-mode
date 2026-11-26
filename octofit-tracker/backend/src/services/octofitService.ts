import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function httpError(status: number, message: string) {
  return Object.assign(new Error(message), { status });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!isRecord(input)) throw httpError(400, 'Activity input is required');
  const { userId, teamId, type, minutes } = input;
  if (
    typeof userId !== 'string'
    || typeof teamId !== 'string'
    || typeof type !== 'string'
    || typeof minutes !== 'number'
  ) {
    throw httpError(400, 'Valid userId, teamId, type, and minutes are required');
  }
  if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(teamId) || !type.trim() || minutes < 1) {
    throw httpError(400, 'Invalid activity input');
  }
  const [user, team] = await Promise.all([
    User.findById(userId),
    Team.findById(teamId),
  ]);
  if (!user || !team) throw httpError(404, 'User or team not found');

  return Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isRecord(input)) throw httpError(400, 'Team input is required');
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const mascot = typeof input.mascot === 'string' ? input.mascot.trim() : '';
  if (!name) throw httpError(400, 'Team name is required');

  const memberIds = Array.isArray(input.members)
    ? input.members.filter((member): member is string => typeof member === 'string')
    : [];
  if (memberIds.some((member) => !mongoose.isValidObjectId(member))) {
    throw httpError(400, 'Team contains an invalid member ID');
  }
  if (memberIds.length > 0) {
    const existingCount = await User.countDocuments({ _id: { $in: memberIds } });
    if (existingCount !== memberIds.length) throw httpError(404, 'One or more team members were not found');
  }
  try {
    return await Team.create({ name, mascot, members: memberIds });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) throw httpError(400, error.message);
    throw error;
  }
}

export async function getLeaderboard() {
  const [teams, activities] = await Promise.all([
    Team.find().lean(),
    Activity.find().lean(),
  ]);
  const totals = new Map<string, number>();
  for (const activity of activities) {
    const teamId = activity.team.toString();
    totals.set(teamId, (totals.get(teamId) ?? 0) + activity.points);
  }
  return teams
    .map((team) => ({
      teamName: team.name,
      totalPoints: totals.get(team._id.toString()) ?? 0,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints || a.teamName.localeCompare(b.teamName))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(_userEmail: string) {
  const userEmail = decodeURIComponent(_userEmail);
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) throw httpError(404, 'User not found');

  const recent = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(1).lean();
  const goal = user.fitnessGoal?.trim();
  const activityType = recent[0]?.type?.toLowerCase();
  const activityFocus = activityType === 'run' || activityType === 'cycle'
    ? 'endurance'
    : activityType === 'strength'
      ? 'strength'
      : activityType === 'walk'
        ? 'mobility'
        : undefined;
  const focus = goal || activityFocus;

  const workouts = await Workout.find(focus ? { focus } : {}).sort({ title: 1 }).lean();
  const suggestions = workouts.length > 0
    ? workouts
    : await Workout.find().sort({ title: 1 }).lean();

  return suggestions.map((workout) => ({
    ...workout,
    reason: recent[0]
      ? `Matched to ${recent[0].type} activity and ${focus || 'your'} fitness goal`
      : `Matched to your ${focus || 'current'} fitness goal`,
  }));
}

export { User };
