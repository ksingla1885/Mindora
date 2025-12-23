import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BookOpen, CheckCircle, Clock, Award, BarChart3 } from 'lucide-react';

export function ProgressTracker({ progressData }) {
  if (!progressData) return null;

  const { overall, subjects = [] } = progressData;

  // Sort subjects by completion percentage
  const sortedSubjects = [...subjects].sort((a, b) => b.completion - a.completion);

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            <span>Overall Learning Progress</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <span>Course Completion</span>
              <span>{overall?.completion || 0}%</span>
            </div>
            <Progress value={overall?.completion || 0} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="flex items-center space-x-2 rounded-md border p-3">
              <BookOpen className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Topics</p>
                <p className="text-2xl font-bold">{overall?.completedTopics || 0}<span className="text-sm font-normal text-muted-foreground">/{overall?.totalTopics || 0}</span></p>
              </div>
            </div>
            <div className="flex items-center space-x-2 rounded-md border p-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Accuracy</p>
                <p className="text-2xl font-bold">{overall?.accuracy || 0}%</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 rounded-md border p-3">
              <Clock className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-sm font-medium">Questions</p>
                <p className="text-2xl font-bold">{overall?.totalAttempts || 0}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 rounded-md border p-3">
              <Award className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Mastery</p>
                <p className="text-2xl font-bold">
                  {overall?.totalTopics && overall.completedTopics 
                    ? Math.round((overall.completedTopics / overall.totalTopics) * 100) 
                    : 0}%
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subject-wise Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Subject-wise Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {sortedSubjects.map((subject) => (
            <div key={subject.subject} className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span>{subject.subject}</span>
                <span>{subject.completion}%</span>
              </div>
              <div className="flex items-center space-x-2">
                <Progress value={subject.completion} className="h-2 flex-1" />
                <span className="text-xs text-muted-foreground w-16 text-right">
                  {subject.completedTopics}/{subject.totalTopics}
                </span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Accuracy: {subject.accuracy}%</span>
                <span>{subject.attempts} attempts</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      {progressData.recentActivity?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {progressData.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-4">
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {activity.topic}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {activity.subject} • {activity.status}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(activity.lastStudied).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Deadlines */}
      {progressData.upcomingDeadlines?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Deadlines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {progressData.upcomingDeadlines.map((deadline) => (
                <div key={deadline.id} className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{deadline.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Due: {new Date(deadline.dueDate).toLocaleString()}
                    </p>
                  </div>
                  <span className="text-sm font-medium">
                    {deadline.duration} min
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ProgressTracker;
