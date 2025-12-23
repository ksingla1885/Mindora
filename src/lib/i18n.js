// i18n configuration for the application
import { createI18n } from 'next-international';

// English (default) translations
const en = {
  // Common
  'common.loading': 'Loading...',
  'common.error': 'An error occurred',
  'common.retry': 'Retry',
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.close': 'Close',
  'common.yes': 'Yes',
  'common.no': 'No',
  'common.confirm': 'Are you sure?',
  
  // Navigation
  'nav.events': 'Events',
  'nav.leaderboard': 'Leaderboard',
  'nav.achievements': 'Achievements',
  'nav.profile': 'Profile',
  'nav.settings': 'Settings',
  
  // Events
  'events.title': 'Seasonal Events',
  'events.subtitle': 'Participate in limited-time events and earn exclusive rewards',
  'events.upcoming': 'Upcoming',
  'events.active': 'Active',
  'events.completed': 'Completed',
  'events.registrationClosed': 'Registration Closed',
  'events.join': 'Join Event',
  'events.viewDetails': 'View Details',
  'events.participants': 'Participants',
  'events.endsIn': 'Ends in {days} days',
  'events.startsIn': 'Starts in {days} days',
  'events.ended': 'Event ended',
  'events.noEvents': 'No events found',
  'events.clearFilters': 'Clear filters',
  'events.filterByType': 'Filter by type',
  'events.filterByStatus': 'Filter by status',
  'events.searchPlaceholder': 'Search events...',
  'events.leaderboard': 'Leaderboard',
  'events.rewards': 'Rewards',
  'events.rules': 'Rules',
  'events.about': 'About This Event',
  'events.eventDetails': 'Event Details',
  'events.quickStats': 'Quick Stats',
  'events.starts': 'Starts',
  'events.ends': 'Ends',
  'events.registrationCloses': 'Registration Closes',
  'events.difficulty': 'Difficulty',
  'events.tags': 'Tags',
  'events.howToEarnRewards': 'How to earn rewards',
  'events.rewardUnlocked': 'Reward Unlocked!',
  'events.completeChallenges': 'Complete challenges to earn rewards',
  'events.completedAllChallenges': 'Completed all challenges!',
  'events.progress': 'Progress',
  'events.complete': 'Complete',
  'events.points': 'points',
  'events.communityRanking': 'Community Ranking',
  'events.yourRank': 'Your Rank',
  'events.topPerformers': 'Top Performers',
  'events.participation': 'Participation',
  'events.completion': 'Completion',
  'events.achievements': 'Achievements',
  'events.recentActivity': 'Recent Activity',
  'events.share': 'Share',
  'events.shareMessage': 'Check out this event: {eventTitle}',
  'events.shareSuccess': 'Event shared successfully!',
  'events.shareError': 'Failed to share event',
  
  // Leaderboard
  'leaderboard.title': 'Leaderboard',
  'leaderboard.overall': 'Overall',
  'leaderboard.friends': 'Friends',
  'leaderboard.region': 'Region',
  'leaderboard.rank': 'Rank',
  'leaderboard.name': 'Name',
  'leaderboard.score': 'Score',
  'leaderboard.xp': 'XP',
  'leaderboard.you': 'You',
  'leaderboard.loadMore': 'Load More',
  'leaderboard.noData': 'No data available',
  'leaderboard.lastUpdated': 'Last updated: {time}',
  'leaderboard.filter': 'Filter',
  'leaderboard.timeframe': 'Timeframe',
  'leaderboard.timeframe.allTime': 'All Time',
  'leaderboard.timeframe.weekly': 'This Week',
  'leaderboard.timeframe.monthly': 'This Month',
  'leaderboard.timeframe.yearly': 'This Year',
  'leaderboard.viewProfile': 'View Profile',
  
  // Achievements
  'achievements.title': 'Achievements',
  'achievements.earned': 'Earned',
  'achievements.locked': 'Locked',
  'achievements.progress': '{current} of {total} completed',
  'achievements.viewAll': 'View All',
  'achievements.rarity': '{percentage}% of users have this',
  'achievements.share': 'Share Achievement',
  'achievements.shareMessage': 'I just earned the "{name}" achievement!',
  'achievements.categories.all': 'All Categories',
  'achievements.categories.learning': 'Learning',
  'achievements.categories.community': 'Community',
  'achievements.categories.streak': 'Streak',
  'achievements.categories.special': 'Special',
  
  // Streaks
  'streak.title': 'Daily Streak',
  'streak.current': 'Current Streak',
  'streak.days': '{count} days',
  'streak.day': 'day',
  'streak.keepGoing': 'Keep it up!',
  'streak.best': 'Best Streak',
  'streak.claimReward': 'Claim Reward',
  'streak.rewardClaimed': 'Reward Claimed!',
  'streak.nextReward': 'Next reward in {days} days',
  'streak.completeChallenge': 'Complete a challenge to maintain your streak',
  'streak.week': ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  'streak.months': [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ],
  
  // User Profile
  'profile.stats': 'Stats',
  'profile.completed': 'Completed',
  'profile.inProgress': 'In Progress',
  'profile.points': 'Points',
  'profile.level': 'Level',
  'profile.badges': 'Badges',
  'profile.recentActivity': 'Recent Activity',
  'profile.editProfile': 'Edit Profile',
  'profile.followers': 'Followers',
  'profile.following': 'Following',
  'profile.follow': 'Follow',
  'profile.unfollow': 'Unfollow',
  'profile.message': 'Message',
  
  // Settings
  'settings.title': 'Settings',
  'settings.account': 'Account',
  'settings.notifications': 'Notifications',
  'settings.privacy': 'Privacy',
  'settings.language': 'Language',
  'settings.theme': 'Theme',
  'settings.language.select': 'Select Language',
  'settings.theme.select': 'Select Theme',
  'settings.saveChanges': 'Save Changes',
  'settings.saved': 'Settings saved successfully',
  'settings.error': 'Failed to save settings',
  
  // Errors
  'error.network': 'Network error. Please check your connection.',
  'error.unauthorized': 'Please log in to continue.',
  'error.forbidden': 'You do not have permission to perform this action.',
  'error.notFound': 'The requested resource was not found.',
  'error.server': 'Server error. Please try again later.',
  'error.unknown': 'An unknown error occurred.',
};

// Add more languages as needed
const es = {
  // Spanish translations would go here
};

const fr = {
  // French translations would go here
};

// Export the i18n instance
export const { useI18n, I18nProvider, getLocaleProps } = createI18n({
  en: () => import('./locales/en'),
  // Add other languages here
  // es: () => import('./locales/es'),
  // fr: () => import('./locales/fr'),
}, {
  // Default language
  defaultLocale: 'en',
  // Enable SSR support
  ssr: true,
});

// Helper function to get translated text with replacements
export const t = (key, replacements = {}) => {
  let text = en[key] || key;
  
  // Replace placeholders with values
  Object.entries(replacements).forEach(([k, v]) => {
    text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
  });
  
  return text;
};

// Format numbers with locale
export const formatNumber = (number, locale = 'en-US') => {
  return new Intl.NumberFormat(locale).format(number);
};

// Format dates with locale
export const formatDate = (date, options = {}, locale = 'en-US') => {
  const defaultOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    ...options 
  };
  
  return new Date(date).toLocaleDateString(locale, defaultOptions);
};

// Format time with locale
export const formatTime = (date, options = {}, locale = 'en-US') => {
  const defaultOptions = { 
    hour: '2-digit', 
    minute: '2-digit',
    ...options 
  };
  
  return new Date(date).toLocaleTimeString(locale, defaultOptions);
};
