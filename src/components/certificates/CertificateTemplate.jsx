'use client';

import { forwardRef } from 'react';
import { format } from 'date-fns';
import { FaAward, FaGraduationCap, FaUserGraduate, FaSignature } from 'react-icons/fa';
import { SiOpenbadges } from 'react-icons/si';

const CertificateTemplate = forwardRef(({ certificate }, ref) => {
  if (!certificate) return null;

  const {
    studentName = 'Student Name',
    courseName = 'Course Name',
    completionDate = new Date(),
    certificateId = `CERT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    score,
    instructor = 'Mindora Academy',
    issueDate = new Date(),
    showWatermark = true,
  } = certificate;

  // Format dates
  const formattedIssueDate = format(new Date(issueDate), 'MMMM d, yyyy');
  const formattedCompletionDate = format(new Date(completionDate), 'MMMM d, yyyy');

  return (
    <div 
      ref={ref}
      className="w-full max-w-5xl mx-auto bg-gradient-to-br from-blue-50 to-indigo-50 border-4 border-blue-200 p-10 rounded-lg shadow-2xl relative overflow-hidden"
      style={{
        minHeight: '700px',
        position: 'relative',
      }}
    >
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
      
      {/* Watermark */}
      {showWatermark && (
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
          <div className="text-8xl font-bold text-blue-200 transform rotate-[-15deg]">
            MINDORA
          </div>
        </div>
      )}
      
      {/* Border decoration */}
      <div className="absolute inset-4 border-2 border-blue-200 rounded pointer-events-none"></div>
      
      {/* Certificate content */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <header className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full text-white">
              <FaGraduationCap className="h-8 w-8" />
            </div>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-blue-900 mb-2">CERTIFICATE OF ACHIEVEMENT</h2>
          <div className="w-32 h-1 bg-gradient-to-r from-blue-400 to-indigo-500 mx-auto my-4"></div>
          <p className="text-gray-600 text-sm uppercase tracking-wider">This is to certify that</p>
        </header>

        {/* Student name */}
        <div className="my-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 font-serif">
            {studentName}
          </h1>
          <div className="w-48 h-1 bg-gradient-to-r from-amber-400 to-amber-600 mx-auto my-6"></div>
        </div>

        {/* Course details */}
        <div className="flex-grow flex flex-col justify-center">
          <p className="text-lg text-center text-gray-700 mb-2">
            has successfully completed the course of study in
          </p>
          <h3 className="text-2xl md:text-3xl font-bold text-center text-blue-800 mb-6">
            {courseName}
          </h3>
          
          {score !== undefined && (
            <div className="mt-4 flex items-center justify-center">
              <div className="bg-amber-100 border-l-4 border-amber-500 p-3 rounded-r">
                <div className="flex items-center">
                  <FaAward className="text-amber-600 mr-2" />
                  <span className="font-medium">Achievement Score: <span className="font-bold">{score}%</span></span>
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-8 text-sm text-gray-500 text-center">
            <p>Completed on: {formattedCompletionDate}</p>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div className="text-center">
            <div className="h-20 border-t-2 border-gray-200 pt-4">
              <p className="text-gray-500">Date of Issue</p>
              <p className="font-medium text-gray-800">{formattedIssueDate}</p>
            </div>
          </div>
          
          <div className="text-center">
            <div className="h-20 border-t-2 border-gray-200 pt-4">
              <p className="text-gray-500">Certificate ID</p>
              <p className="font-mono text-xs text-gray-600 tracking-wider">{certificateId}</p>
            </div>
          </div>
          
          <div className="text-center">
            <div className="h-20 border-t-2 border-gray-200 pt-4">
              <p className="text-gray-500">Authorized by</p>
              <div className="mt-1">
                <FaSignature className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                <p className="font-medium text-gray-800">{instructor}</p>
              </div>
            </div>
          </div>
        </footer>
        
        {/* Verification badge */}
        <div className="absolute bottom-2 right-2 flex items-center text-xs text-gray-400">
          <SiOpenbadges className="mr-1" />
          <span>Verify at mindora.academy/verify/{certificateId}</span>
        </div>
      </div>
    </div>
  );
});

CertificateTemplate.displayName = 'CertificateTemplate';

export default CertificateTemplate;
        