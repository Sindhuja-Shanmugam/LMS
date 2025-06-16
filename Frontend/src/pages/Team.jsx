import React, { useEffect, useState } from "react";
import axios from "axios";
import {jwtDecode} from "jwt-decode";

const Team = () => {
  const [team, setTeam] = useState([]);
  const [managerId, setManagerId] = useState(null);
  const [loading, setLoading] = useState(true); 
  useEffect(() => {
    // Get managerId from JWT token
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setManagerId(decoded.id); // Change to decoded.manager_id if your token has that field
      } catch (err) {
        console.error("Invalid token", err);
      }
    }
  }, []);

  useEffect(() => {
    if (!managerId) return;
    const token = localStorage.getItem("token");
    setLoading(true); 
    axios
      .get(`http://localhost:5000/api/v1/team/manager/${managerId}`,{
        headers: {
        Authorization: `Bearer ${token}`, // ✅ Include token
      },
      })
      .then((res) =>{console.log("Team response:", res.data);
       setTeam(res.data);})
      .catch((err) => console.error("Error fetching team", err))
      .finally(() => {
        setLoading(false); // ✅ Ends loading no matter what
      });
  }, [managerId]);

  return (
    <div className="container mt-3">
      <h4>My Team</h4>
      <div className="row">
        {team.length === 0 ? (
          <p>No team members found.</p>
        ) : (
          team.map((member) => (
            <div className="col-md-4 mb-3" key={member.id}>
              <div className="card h-100 shadow">
                <img
                  src={member.profile_pic || "/default-profile.png"}
                  className="card-img-top"
                  alt={member.name}
                />
                <div className="card-body">
                  <h5 className="card-title">{member.name}</h5>
                  <p className="card-text">{member.email}</p>
                  <p className="text-muted">
                    {member.role}
                    {member.id === managerId && (
                      <span className="badge bg-primary ms-2">Manager</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Team;
