import React, { useEffect, useState } from 'react';
import { getLeavesForApprover, approveLeave, rejectLeave } from '../services/leaveService';
import { useAuth } from "../context/AuthContext";



const ApprovalTable = () => {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);

  useEffect(() => {
    loadLeaves();
  }, []);

  const loadLeaves = async () => {
    try {
      const data = await getLeavesForApprover(user.id);
      setLeaves(data);
    } catch (error) {
      toast.error('Failed to load leave requests');
    }
  };

  const handleAction = async (leaveId, action) => {
    try {
      if (action === 'approve') {
        await approveLeave(leaveId);
        toast.success('Leave approved');
      } else {
        await rejectLeave(leaveId);
        toast.warn('Leave rejected');
      }
      loadLeaves(); // refresh after action
    } catch (error) {
      toast.error('Action failed');
    }
  };

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-3">Pending Leave Requests</h3>
      <table className="min-w-full bg-white border">
        <thead>
          <tr className="bg-gray-100 text-sm">
            <th className="border p-2">Employee</th>
            <th className="border p-2">Leave Type</th>
            <th className="border p-2">From</th>
            <th className="border p-2">To</th>
            <th className="border p-2">Reason</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {leaves.length === 0 ? (
            <tr>
              <td colSpan="6" className="text-center p-4">No pending leaves</td>
            </tr>
          ) : (
            leaves.map((leave) => (
              <tr key={leave.id} className="text-sm">
                <td className="border p-2">{leave.employee?.name}</td>
                <td className="border p-2">{leave.type}</td>
                <td className="border p-2">{leave.startDate}</td>
                <td className="border p-2">{leave.endDate}</td>
                <td className="border p-2">{leave.reason}</td>
                <td className="border p-2 flex space-x-2">
                  <button
                    onClick={() => handleAction(leave.id, 'approve')}
                    className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleAction(leave.id, 'reject')}
                    className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ApprovalTable;
