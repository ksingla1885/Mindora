export class GamificationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'GamificationError';
  }
}

export class BadgeAwardedError extends GamificationError {
  constructor(message = 'Badge already awarded to user') {
    super(message);
    this.name = 'BadgeAwardedError';
    this.statusCode = 400;
  }
}

export class InsufficientXPError extends GamificationError {
  constructor(message = 'Insufficient XP for this action') {
    super(message);
    this.name = 'InsufficientXPError';
    this.statusCode = 400;
  }
}

export class ChallengeNotFoundError extends GamificationError {
  constructor(message = 'Challenge not found') {
    super(message);
    this.name = 'ChallengeNotFoundError';
    this.statusCode = 404;
  }
}

export class ChallengeAlreadyCompletedError extends GamificationError {
  constructor(message = 'Challenge already completed') {
    super(message);
    this.name = 'ChallengeAlreadyCompletedError';
    this.statusCode = 400;
  }
}

export class LeaderboardError extends GamificationError {
  constructor(message = 'Leaderboard error') {
    super(message);
    this.name = 'LeaderboardError';
    this.statusCode = 500;
  }
}
