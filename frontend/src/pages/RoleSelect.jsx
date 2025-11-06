import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function RoleSelect() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="p-8 bg-white rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">Choose Your Role</h2>
        <div className="space-y-4">
          <button 
            onClick={() => navigate('/login?role=manager')} 
            className="btn"
          >
            Manager Login
          </button>
          <button 
            onClick={() => navigate('/login?role=employee')} 
            className="btn-secondary"
          >
            Employee Login
          </button>
        </div>
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">New manager?</p>
          <button 
            onClick={() => navigate('/register-manager')} 
            className="text-blue-500 hover:text-blue-700 font-medium"
          >
            Register as Manager
          </button>
        </div>
      </div>
    </div>
  );
}