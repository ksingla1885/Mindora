'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiSave, FiX, FiPlus, FiTrash2, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { format, addMinutes, parseISO } from 'date-fns';
import { toast } from 'react-hot-toast';

const QUESTION_TYPES = {
  MCQ: 'mcq',
  SHORT_ANSWER: 'short_answer',
  LONG_ANSWER: 'long_answer',
  TRUE_FALSE: 'true_false'
};

export default function TestForm({ test = null, onSuccess }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    isPaid: false,
    price: 0,
    duration: 60, // in minutes
    startTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    endTime: format(addMinutes(new Date(), 65), "yyyy-MM-dd'T'HH:mm"),
    status: 'draft',
    questions: [],
    subjects: [],
    classes: [],
    passingScore: 50,
    maxAttempts: 1,
    showAnswers: 'after_submission', // after_submission, after_test_end, never
    instructions: '',
    isTimed: true,
    shuffleQuestions: false,
    shuffleOptions: false,
    requireWebcam: false,
    requireFullscreen: true,
    showScore: true
  });

  const [questionForm, setQuestionForm] = useState({
    type: QUESTION_TYPES.MCQ,
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    points: 1,
    explanation: '',
    difficulty: 'medium',
    tags: []
  });

  useEffect(() => {
    if (test) {
      // If editing an existing test, populate the form
      setFormData({
        ...test,
        startTime: test.startTime ? format(parseISO(test.startTime), "yyyy-MM-dd'T'HH:mm") : '',
        endTime: test.endTime ? format(parseISO(test.endTime), "yyyy-MM-dd'T'HH:mm") : '',
      });
    }
  }, [test]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleQuestionChange = (e) => {
    const { name, value } = e.target;
    setQuestionForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...questionForm.options];
    newOptions[index] = value;
    setQuestionForm(prev => ({
      ...prev,
      options: newOptions
    }));
  };

  const addOption = () => {
    setQuestionForm(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const removeOption = (index) => {
    const newOptions = questionForm.options.filter((_, i) => i !== index);
    setQuestionForm(prev => ({
      ...prev,
      options: newOptions,
      correctAnswer: prev.correctAnswer >= index && prev.correctAnswer !== 0 ? 
        prev.correctAnswer - 1 : prev.correctAnswer
    }));
  };

  const addQuestion = () => {
    if (!questionForm.question.trim()) {
      toast.error('Question text is required');
      return;
    }

    if (questionForm.type === QUESTION_TYPES.MCQ && questionForm.options.some(opt => !opt.trim())) {
      toast.error('All options must be filled');
      return;
    }

    const newQuestion = {
      ...questionForm,
      id: Date.now().toString(),
      options: [...questionForm.options],
      points: parseInt(questionForm.points) || 1
    };

    if (editingQuestionIndex !== null) {
      // Update existing question
      const updatedQuestions = [...formData.questions];
      updatedQuestions[editingQuestionIndex] = newQuestion;
      setFormData(prev => ({
        ...prev,
        questions: updatedQuestions
      }));
      setEditingQuestionIndex(null);
    } else {
      // Add new question
      setFormData(prev => ({
        ...prev,
        questions: [...prev.questions, newQuestion]
      }));
    }

    // Reset question form
    setQuestionForm({
      type: QUESTION_TYPES.MCQ,
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      points: 1,
      explanation: '',
      difficulty: 'medium',
      tags: []
    });
    
    setShowQuestionForm(false);
  };

  const editQuestion = (index) => {
    const question = formData.questions[index];
    setQuestionForm({
      ...question,
      options: [...question.options]
    });
    setEditingQuestionIndex(index);
    setShowQuestionForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const removeQuestion = (index) => {
    if (window.confirm('Are you sure you want to remove this question?')) {
      const updatedQuestions = formData.questions.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        questions: updatedQuestions
      }));
    }
  };

  const moveQuestion = (index, direction) => {
    const newQuestions = [...formData.questions];
    if (direction === 'up' && index > 0) {
      [newQuestions[index - 1], newQuestions[index]] = [newQuestions[index], newQuestions[index - 1]];
    } else if (direction === 'down' && index < newQuestions.length - 1) {
      [newQuestions[index], newQuestions[index + 1]] = [newQuestions[index + 1], newQuestions[index]];
    }
    setFormData(prev => ({
      ...prev,
      questions: newQuestions
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = test ? `/api/tests/${test.id}` : '/api/tests';
      const method = test ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save test');
      }

      const data = await response.json();
      toast.success(test ? 'Test updated successfully' : 'Test created successfully');
      
      if (onSuccess) {
        onSuccess(data);
      } else {
        router.push('/admin/tests');
      }
    } catch (error) {
      console.error('Error saving test:', error);
      toast.error(error.message || 'Failed to save test');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-6">
            {test ? 'Edit Test' : 'Create New Test'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Test Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isPaid"
                  checked={formData.isPaid}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">This is a paid test</span>
              </label>
              {formData.isPaid && (
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Price (INR)
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Start Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                End Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                min={formData.startTime}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Duration (minutes) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Passing Score (%)
              </label>
              <input
                type="number"
                name="passingScore"
                value={formData.passingScore}
                onChange={handleChange}
                min="0"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Maximum Attempts
              </label>
              <input
                type="number"
                name="maxAttempts"
                value={formData.maxAttempts}
                onChange={handleChange}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                When to show answers
              </label>
              <select
                name="showAnswers"
                value={formData.showAnswers}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="after_submission">After submission</option>
                <option value="after_test_end">After test ends</option>
                <option value="never">Never show answers</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isTimed"
                  checked={formData.isTimed}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Enable time limit</span>
              </label>
            </div>

            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="shuffleQuestions"
                  checked={formData.shuffleQuestions}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Shuffle questions</span>
              </label>
            </div>

            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="shuffleOptions"
                  checked={formData.shuffleOptions}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Shuffle answer options</span>
              </label>
            </div>

            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="requireWebcam"
                  checked={formData.requireWebcam}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Require webcam monitoring</span>
              </label>
            </div>

            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="requireFullscreen"
                  checked={formData.requireFullscreen}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Require fullscreen mode</span>
              </label>
            </div>

            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="showScore"
                  checked={formData.showScore}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Show score after submission</span>
              </label>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Instructions for Test Takers
              </label>
              <textarea
                name="instructions"
                value={formData.instructions}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter instructions that will be shown to test takers before they start the test..."
              />
            </div>
          </div>
        </div>

        {/* Questions Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Questions</h2>
            <button
              type="button"
              onClick={() => setShowQuestionForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FiPlus className="-ml-1 mr-2 h-5 w-5" />
              Add Question
            </button>
          </div>

          {formData.questions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No questions added yet. Click the button above to add your first question.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {formData.questions.map((q, index) => (
                <div key={q.id || index} className="border rounded-lg p-4 relative group">
                  <div className="absolute top-2 right-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => editQuestion(index)}
                      className="p-1 text-gray-500 hover:text-blue-600"
                      title="Edit"
                    >
                      <FiEdit className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeQuestion(index)}
                      className="p-1 text-gray-500 hover:text-red-600"
                      title="Delete"
                    >
                      <FiTrash2 className="h-4 w-4" />
                    </button>
                    <div className="flex flex-col">
                      <button
                        type="button"
                        onClick={() => moveQuestion(index, 'up')}
                        disabled={index === 0}
                        className={`p-0.5 ${index === 0 ? 'text-gray-300' : 'text-gray-500 hover:text-blue-600'}`}
                        title="Move up"
                      >
                        <FiChevronUp className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveQuestion(index, 'down')}
                        disabled={index === formData.questions.length - 1}
                        className={`p-0.5 ${index === formData.questions.length - 1 ? 'text-gray-300' : 'text-gray-500 hover:text-blue-600'}`}
                        title="Move down"
                      >
                        <FiChevronDown className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mr-3 mt-0.5 flex-shrink-0">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{q.question}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            {q.type === 'mcq' ? 'Multiple Choice' : 
                             q.type === 'true_false' ? 'True/False' : 
                             q.type === 'short_answer' ? 'Short Answer' : 'Long Answer'} • 
                            {q.points} point{q.points !== 1 ? 's' : ''} • 
                            Difficulty: {q.difficulty}
                          </p>
                        </div>
                      </div>
                      
                      {q.type === 'mcq' || q.type === 'true_false' ? (
                        <div className="mt-2 space-y-2">
                          {q.options.map((option, optIndex) => (
                            <div 
                              key={optIndex} 
                              className={`flex items-center p-2 rounded ${q.correctAnswer === optIndex ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}
                            >
                              <div className={`h-4 w-4 rounded-full border ${q.correctAnswer === optIndex ? 'border-green-500 bg-green-500' : 'border-gray-400'} flex items-center justify-center mr-2 flex-shrink-0`}>
                                {q.correctAnswer === optIndex && (
                                  <div className="h-2 w-2 rounded-full bg-white"></div>
                                )}
                              </div>
                              <span className={q.correctAnswer === optIndex ? 'font-medium text-green-800' : 'text-gray-700'}>
                                {option}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : null}
                      
                      {q.explanation && (
                        <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-800">
                          <span className="font-medium">Explanation:</span> {q.explanation}
                        </div>
                      )}
                      
                      {q.tags && q.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {q.tags.map((tag, tagIndex) => (
                            <span key={tagIndex} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.push('/admin/tests')}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || formData.questions.length === 0}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${(loading || formData.questions.length === 0) ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              'Saving...'
            ) : test ? (
              'Update Test'
            ) : (
              'Create Test'
            )}
          </button>
        </div>
      </form>

      {/* Question Form Modal */}
      {showQuestionForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">
                  {editingQuestionIndex !== null ? 'Edit Question' : 'Add New Question'}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowQuestionForm(false);
                    setEditingQuestionIndex(null);
                    setQuestionForm({
                      type: QUESTION_TYPES.MCQ,
                      question: '',
                      options: ['', '', '', ''],
                      correctAnswer: 0,
                      points: 1,
                      explanation: '',
                      difficulty: 'medium',
                      tags: []
                    });
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Close</span>
                  <FiX className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Question Type
                  </label>
                  <select
                    name="type"
                    value={questionForm.type}
                    onChange={handleQuestionChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={QUESTION_TYPES.MCQ}>Multiple Choice</option>
                    <option value={QUESTION_TYPES.TRUE_FALSE}>True/False</option>
                    <option value={QUESTION_TYPES.SHORT_ANSWER}>Short Answer</option>
                    <option value={QUESTION_TYPES.LONG_ANSWER}>Long Answer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Question Text <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="question"
                    value={questionForm.question}
                    onChange={handleQuestionChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter the question text..."
                    required
                  />
                </div>

                {(questionForm.type === QUESTION_TYPES.MCQ || questionForm.type === QUESTION_TYPES.TRUE_FALSE) && (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Options <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={addOption}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        + Add Option
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      {questionForm.options.map((option, index) => (
                        <div key={index} className="flex items-center">
                          <input
                            type="radio"
                            name="correctAnswer"
                            value={index}
                            checked={questionForm.correctAnswer === index}
                            onChange={() => setQuestionForm(prev => ({
                              ...prev,
                              correctAnswer: index
                            }))}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => handleOptionChange(index, e.target.value)}
                            className="ml-2 flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder={`Option ${index + 1}`}
                            required
                          />
                          {questionForm.options.length > 2 && (
                            <button
                              type="button"
                              onClick={() => removeOption(index)}
                              className="ml-2 p-1 text-gray-400 hover:text-red-600"
                            >
                              <FiTrash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Points
                    </label>
                    <input
                      type="number"
                      name="points"
                      value={questionForm.points}
                      onChange={handleQuestionChange}
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Difficulty
                    </label>
                    <select
                      name="difficulty"
                      value={questionForm.difficulty}
                      onChange={handleQuestionChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Explanation (optional)
                  </label>
                  <textarea
                    name="explanation"
                    value={questionForm.explanation}
                    onChange={handleQuestionChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter explanation or solution..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    name="tags"
                    value={questionForm.tags.join(', ')}
                    onChange={(e) => {
                      const tags = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean);
                      setQuestionForm(prev => ({
                        ...prev,
                        tags
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., algebra, geometry, calculus"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowQuestionForm(false);
                    setEditingQuestionIndex(null);
                    setQuestionForm({
                      type: QUESTION_TYPES.MCQ,
                      question: '',
                      options: ['', '', '', ''],
                      correctAnswer: 0,
                      points: 1,
                      explanation: '',
                      difficulty: 'medium',
                      tags: []
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {editingQuestionIndex !== null ? 'Update Question' : 'Add Question'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
