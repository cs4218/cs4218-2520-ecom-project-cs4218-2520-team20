import React, { useState, useEffect } from "react";
import axios from "axios";
import Layout from '../../components/Layout';
import AdminMenu from '../../components/AdminMenu';
import { useAuth } from "../../context/auth";
import moment from "moment";

const enum_role = ["User", "Admin"];

function role_to_str(role) {
  if (role !== 0 && role !== 1) {
    console.error(`Unknown role ${role} found in response.`);
    return "Unknown";
  }
  return enum_role[role];
}

const Users = () => {
  const [userData, setUserData] = useState([]);
  const [auth, _] = useAuth();
  const getUsers = async () => {
    try {
      const { data } = await axios.get("/api/v1/auth/all-users");
      if (data.success) {
        setUserData(data.data);
        return;
      } 
      console.error(data.message)
    } catch (error) {
      console.error(error.message);
    }
  };

  useEffect(() => {
    if (auth?.token) getUsers();
  }, [auth?.token]);

  return (
    <Layout title={"Dashboard - All Users"}>
      <div className="container-fluid m-3 p-3">
        <div className="row">
          <div className="col-md-3">
            <AdminMenu />
          </div>
          <div className="col-md-9">
            <h1>All Users</h1>
            <div className="border shadow">
              {userData?.length === 0 && (<h3>Loading list of users...</h3>)}
              <table className="table">
                  {userData?.length > 0 && (
                    <thead>
                      <tr>
                        <th scope="col">Name</th>
                        <th scope="col">Email</th>
                        <th scope="col">Phone</th>
                        <th scope="col">Address</th>
                        <th scope="col">Role</th>
                        <th scope="col">Date Created</th>
                      </tr>
                    </thead>
                  )}
                <tbody>
                  {userData?.map((o, i) => (
                    <tr key={`${o._id}_${i}`}>
                      <td>{o?.name}</td>
                      <td>{o?.email}</td>
                      <td>{o?.phone}</td>
                      <td>{o?.address}</td>
                      <td>{role_to_str(o?.role)}</td>
                      <td>{moment(o?.createdAt).calendar()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div> 
    </Layout>
  );
};

export default Users;