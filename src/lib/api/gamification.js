import { getSession } from 'next-auth/react';

const API_BASE_URL = '/api/gamification';

async function fetchWithAuth(url, options = {}) {
  const session = await getSession();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (session?.accessToken) {
    headers['Authorization'] = `Bearer ${session.accessToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Something went wrong');
  }

  return response.json();
}

export const gamificationAPI = {
  // Badges
  getBadges: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.search) params.append('search', filters.search);
    
    return fetchWithAuth(`/badges?${params.toString()}`);
  },

  // Challenges
  getChallenges: async (type = 'daily') => {
    return fetchWithAuth(`/challenges?type=${type}`);
  },

  claimChallengeReward: async (challengeId) => {
    return fetchWithAuth(`/challenges/${challengeId}/claim`, {
      method: 'POST',
    });
  },

  // User Progress
  getUserProgress: async (userId) => {
    return fetchWithAuth(`/progress?userId=${userId || ''}`);
  },

  // Leaderboard
  getLeaderboard: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.subjectId) params.append('subjectId', filters.subjectId);
    if (filters.classLevel) params.append('classLevel', filters.classLevel);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);
    
    return fetchWithAuth(`/leaderboard?${params.toString()}`);
  },

  // Activity
  logActivity: async (activity) => {
    return fetchWithAuth('/activity', {
      method: 'POST',
      body: JSON.stringify(activity),
    });
  },

  // Streak
  updateStreak: async () => {
    return fetchWithAuth('/streak', {
      method: 'POST',
    });
  },
};
