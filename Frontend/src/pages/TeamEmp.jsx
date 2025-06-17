import React, { useEffect, useState } from "react";
import axios from "axios";

const TeamEmp = () => {
  const [team, setTeam] = useState({ manager: null, teammates: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("No token found");
      setLoading(false);
      return;
    }

    axios
      .get("http://localhost:5000/api/v1/team/my-team", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        console.log("Team data:", res.data);
        setTeam(res.data);
      })
      .catch((err) => {
        console.error("Failed to load team", err);
        setError("Failed to load team");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-3">Loading team info...</div>;
  if (error) return <div className="p-3 text-danger">{error}</div>;

  return (
    <div className="container mt-3">
      <h4 className="mb-3">👥 My Team</h4>

      <div className="mb-4">
        <h5>👔 Manager</h5>
        {team.manager ? (
          <div className="card p-3 bg-light">
            <p><strong>Name:</strong> {team.manager.name}</p>
            <p><strong>Email:</strong> {team.manager.email}</p>
          </div>
        ) : (
          <p className="text-muted">No manager assigned.</p>
        )}
      </div>

      <div>
        <h5>🤝 Teammates</h5>
        {team.teammates.length === 0 ? (
          <p className="text-muted">No teammates found.</p>
        ) : (
          <div className="row">
            {team.teammates.map((member) => (
              <div className="col-md-4 mb-3" key={member.id}>
                <div className="card h-100 shadow-sm">
                  <div className="card-body">
                    <h6 className="card-title">{member.name}</h6>
                    <p className="card-text">{member.email}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamEmp;
