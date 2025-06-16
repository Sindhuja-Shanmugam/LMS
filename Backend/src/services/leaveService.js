export const getLeavesForApprover = async (approverId) => {
  const res = await axios.get(`${BASE_URL}/leaves/approver/${approverId}`);
  return res.data;
};

export const approveLeave = async (leaveId) => {
  return await axios.put(`${BASE_URL}/leaves/${leaveId}/approve`);
};

export const rejectLeave = async (leaveId) => {
  return await axios.put(`${BASE_URL}/leaves/${leaveId}/reject`);
};
