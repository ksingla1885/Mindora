'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FiX, FiSave, FiClock } from 'react-icons/fi';

export default function DPPConfigModal({ isOpen, onClose, onSubmit, initialConfig }) {
  const { register, handleSubmit, reset, formState: { isSubmitting, errors } } = useForm();
  const [subjects, setSubjects] = useState([
    { id: 'physics', name: 'Physics' },
    { id: 'chemistry', name: 'Chemistry' },
    { id: 'mathematics', name: 'Mathematics' },
    { id: 'biology', name: 'Biology' },
  ]);

  const difficulties = [
    { id: 'easy', name: 'Easy' },
    { id: 'medium', name: 'Medium' },
    { id: 'hard', name: 'Hard' },
  ];

  useEffect(() => {
    if (initialConfig) {
      reset({
        dailyLimit: initialConfig.dailyLimit,
        timeOfDay: initialConfig.timeOfDay,
        notifications: initialConfig.notifications,
      });
    }
  }, [initialConfig, reset]);

  const handleFormSubmit = (data) => {
    const selectedSubjects = subjects
      .filter(subject => data[`subject_${subject.id}`])
      .map(subject => subject.id);
    
    const selectedDifficulties = difficulties
      .filter(diff => data[`difficulty_${diff.id}`])
      .map(diff => diff.id);

    onSubmit({
      ...data,
      subjects: selectedSubjects,
      difficulty: selectedDifficulties,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">DPP Configuration</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <FiX className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-6">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Subjects</h4>
            <div className="grid grid-cols-2 gap-3">
              {subjects.map((subject) => (
                <div key={subject.id} className="flex items-center">
                  <input
                    id={`subject-${subject.id}`}
                    type="checkbox"
                    defaultChecked={initialConfig?.subjects?.includes(subject.id) || false}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    {...register(`subject_${subject.id}`)}
                  />
                  <label htmlFor={`subject-${subject.id}`} className="ml-2 text-sm text-gray-700">
                    {subject.name}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Difficulty Level</h4>
            <div className="space-y-2">
              {difficulties.map((difficulty) => (
                <div key={difficulty.id} className="flex items-center">
                  <input
                    id={`difficulty-${difficulty.id}`}
                    type="checkbox"
                    defaultChecked={initialConfig?.difficulty?.includes(difficulty.id) || false}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    {...register(`difficulty_${difficulty.id}`)}
                  />
                  <label htmlFor={`difficulty-${difficulty.id}`} className="ml-2 text-sm text-gray-700">
                    {difficulty.name}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="dailyLimit" className="block text-sm font-medium text-gray-700 mb-1">
              Questions Per Day
            </label>
            <select
              id="dailyLimit"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              defaultValue={initialConfig?.dailyLimit || 5}
              {...register('dailyLimit', { required: true })}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <option key={num} value={num}>
                  {num} {num === 1 ? 'question' : 'questions'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="timeOfDay" className="block text-sm font-medium text-gray-700 mb-1">
              Preferred Time
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiClock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="time"
                id="timeOfDay"
                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                defaultValue={initialConfig?.timeOfDay || '09:00'}
                {...register('timeOfDay', { required: true })}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              When you'd like to receive your daily questions
            </p>
          </div>

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="notifications"
                type="checkbox"
                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                defaultChecked={initialConfig?.notifications !== false}
                {...register('notifications')}
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="notifications" className="font-medium text-gray-700">
                Email Notifications
              </label>
              <p className="text-gray-500">
                Get notified when new DPPs are available
              </p>
            </div>
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <FiSave className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
