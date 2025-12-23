'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { 
  FiAward, 
  FiCheckCircle, 
  FiClock, 
  FiX, 
  FiZap, 
  FiCalendar,
  FiStar,
  FiArrowRight,
  FiGift,
  FiAlertCircle,
  FiRotateCw
} from 'react-icons/fi';
import { gamificationAPI } from '@/lib/api/gamification';
import { toast } from 'react-hot-toast';

const ChallengeCard = ({ challenge, onClaimReward }) => {
  const isCompleted = challenge.progress >= challenge.requiredValue;
  const progressPercentage = Math.min(100, (challenge.progress / challenge.requiredValue) * 100);
  
  const getChallengeIcon = () => {
    switch(challenge.type) {
      case 'STREAK':
        return <FiZap className="h-5 w-5 text-yellow-500" />;
      case 'PERFORMANCE':
        return <FiStar className="h-5 w-5 text-blue-500" />;
      default:
        return <FiAward className="h-5 w-5 text-indigo-500" />;
    }
  };

  return (
    <div className={`bg-white rounded-lg border ${
      isCompleted ? 'border-green-200 bg-green-50' : 'border-gray-200'
    } overflow-hidden transition-all duration-200 hover:shadow-md`}>
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${
                isCompleted ? 'bg-green-100 text-green-600' : 'bg-indigo-100 text-indigo-600'
              }`}>
                {getChallengeIcon()}
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900">{challenge.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{challenge.description}</p>
              </div>
            </div>
            
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Progress</span>
                <span>{challenge.progress} / {challenge.requiredValue}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    isCompleted ? 'bg-green-500' : 'bg-indigo-500'
                  }`}
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
            
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center text-xs text-gray-500">
                <FiCalendar className="mr-1 h-3.5 w-3.5" />
                <span>{challenge.duration === 'DAILY' ? 'Today' : 'This Week'}</span>
              </div>
              
              {challenge.rewards?.xp > 0 && (
                <div className="flex items-center text-xs font-medium text-amber-600">
                  <span className="mr-1">+{challenge.rewards.xp} XP</span>
                  {challenge.rewards.badge && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 ml-2">
                      <FiAward className="mr-1 h-3 w-3" />
                      {challenge.rewards.badge.name}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="ml-4 flex-shrink-0">
            {isCompleted ? (
              challenge.rewardClaimed ? (
                <div className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <FiCheckCircle className="mr-1 h-4 w-4" />
                  Claimed
                </div>
              ) : (
                <button
                  onClick={() => onClaimReward(challenge.id)}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <FiGift className="mr-1 h-3.5 w-3.5" />
                  Claim
                </button>
              )
            ) : (
              <div className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                <FiClock className="mr-1 h-3.5 w-3.5" />
                In Progress
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ChallengesList() {
  const { data: session } = useSession();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('daily');
  const [showCompleted, setShowCompleted] = useState(false);
  const [isClaiming, setIsClaiming] = useState({});

  const fetchChallenges = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch challenges from API
      const data = await gamificationAPI.getChallenges(activeTab);
      setChallenges(data.challenges);
    } catch (err) {
      console.error('Error fetching challenges:', err);
      setError('Failed to load challenges. Please try again.');
      toast.error('Failed to load challenges');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (session) {
      fetchChallenges();
    }
  }, [session, fetchChallenges]);

  const handleClaimReward = async (challengeId) => {
    try {
      setIsClaiming(prev => ({ ...prev, [challengeId]: true }));
      
      // Call API to claim reward
      await gamificationAPI.claimChallengeReward(challengeId);
      
      // Update local state
      setChallenges(challenges.map(challenge => 
        challenge.id === challengeId 
          ? { ...challenge, rewardClaimed: true } 
          : challenge
      ));
      
      // Show success message
      toast.success('Reward claimed successfully!');
      
      // Refresh user progress to update XP/level
      // This would be handled by a global state or context in a real app
    } catch (error) {
      console.error('Error claiming reward:', error);
      toast.error(error.message || 'Failed to claim reward');
    } finally {
      setIsClaiming(prev => ({ ...prev, [challengeId]: false }));
    }
  };

  const handleClaimAllRewards = async () => {
    try {
      const unclaimedChallenges = getCompletedChallenges()
        .filter(challenge => !challenge.rewardClaimed)
        .map(challenge => challenge.id);
      
      if (unclaimedChallenges.length === 0) return;
      
      // Show loading state for all unclaimed challenges
      const claimingStates = {};
      unclaimedChallenges.forEach(id => { claimingStates[id] = true; });
      setIsClaiming(prev => ({ ...prev, ...claimingStates }));
      
      // Claim all rewards
      await Promise.all(
        unclaimedChallenges.map(id => gamificationAPI.claimChallengeReward(id))
      );
      
      // Update local state
      setChallenges(challenges.map(challenge => 
        unclaimedChallenges.includes(challenge.id)
          ? { ...challenge, rewardClaimed: true }
          : challenge
      ));
      
      toast.success(`Successfully claimed ${unclaimedChallenges.length} rewards!`);
    } catch (error) {
      console.error('Error claiming all rewards:', error);
      toast.error(error.message || 'Failed to claim some rewards');
    } finally {
      setIsClaiming({});
    }
  };

  const filteredChallenges = challenges.filter(challenge => {
    const matchesTab = activeTab === 'all' || 
                      (activeTab === 'daily' && challenge.duration === 'DAILY') ||
                      (activeTab === 'weekly' && challenge.duration === 'WEEKLY');
    
    const matchesCompletion = showCompleted 
      ? challenge.progress >= challenge.requiredValue
      : challenge.progress < challenge.requiredValue;
    
    return matchesTab && matchesCompletion;
  });

  const getCompletedChallenges = () => {
    return challenges.filter(challenge => 
      challenge.progress >= challenge.requiredValue
    );
  };

  const getInProgressChallenges = () => {
    return challenges.filter(challenge => 
      challenge.progress < challenge.requiredValue
    );
  };

  const getTotalXP = () => {
    return getCompletedChallenges()
      .filter(challenge => !challenge.rewardClaimed)
      .reduce((sum, challenge) => sum + (challenge.rewards?.xp || 0), 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <FiAward className="h-5 w-5 text-red-500" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Challenges</h2>
            <p className="mt-1 text-sm text-gray-500">
              Complete challenges to earn XP and badges
            </p>
          </div>
          
          <div className="mt-3 sm:mt-0 flex items-center">
            <div className="inline-flex rounded-md shadow-sm" role="group">
              <button
                type="button"
                onClick={() => setActiveTab('daily')}
                className={`px-4 py-2 text-sm font-medium rounded-l-lg border ${
                  activeTab === 'daily'
                    ? 'bg-indigo-100 text-indigo-700 border-indigo-300'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Daily
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('weekly')}
                className={`px-4 py-2 text-sm font-medium border-t border-b ${
                  activeTab === 'weekly'
                    ? 'bg-indigo-100 text-indigo-700 border-indigo-300'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Weekly
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 text-sm font-medium rounded-r-lg border ${
                  activeTab === 'all'
                    ? 'bg-indigo-100 text-indigo-700 border-indigo-300'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                All
              </button>
            </div>
            
            <div className="ml-3">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={showCompleted}
                  onChange={() => setShowCompleted(!showCompleted)}
                />
                <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                <span className="ml-2 text-sm font-medium text-gray-700">
                  {showCompleted ? 'Show In Progress' : 'Show Completed'}
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats Summary */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-indigo-100 text-indigo-600 mr-3">
                <FiAward className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Challenges</p>
                <p className="text-xl font-semibold text-gray-900">{challenges.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-green-100 text-green-600 mr-3">
                <FiCheckCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</p>
                <p className="text-xl font-semibold text-gray-900">
                  {getCompletedChallenges().length} / {challenges.length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-amber-100 text-amber-600 mr-3">
                <FiZap className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">XP Available</p>
                <p className="text-xl font-semibold text-gray-900">
                  {getTotalXP()} XP
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Challenges List */}
      <div className="divide-y divide-gray-200">
        {filteredChallenges.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
            {filteredChallenges.map((challenge) => (
              <ChallengeCard 
                key={challenge.id} 
                challenge={challenge} 
                onClaimReward={handleClaimReward}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="mx-auto h-16 w-16 text-gray-400">
              {showCompleted ? (
                <FiCheckCircle className="h-16 w-16 mx-auto" />
              ) : (
                <FiAward className="h-16 w-16 mx-auto" />
              )}
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {showCompleted ? 'No completed challenges yet' : 'All challenges completed!'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {showCompleted 
                ? 'Complete some challenges to see them here.'
                : 'Check back later for new challenges.'}
            </p>
            {!showCompleted && getInProgressChallenges().length > 0 && (
              <button
                onClick={() => setShowCompleted(true)}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                View In Progress
                <FiArrowRight className="ml-2 h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Claim All Button - Only show if there are unclaimed rewards */}
      {getCompletedChallenges().some(challenge => !challenge.rewardClaimed) && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-right">
          <button
            onClick={handleClaimAllRewards}
            disabled={Object.values(isClaiming).some(Boolean)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {Object.values(isClaiming).some(Boolean) ? (
              <>
                <FiRotateCw className="animate-spin mr-2 h-4 w-4" />
                Claiming...
              </>
            ) : (
              <>
                <FiGift className="mr-2 h-4 w-4" />
                Claim All Rewards ({getCompletedChallenges().filter(c => !c.rewardClaimed).length})
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
