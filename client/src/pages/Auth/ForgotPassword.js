import React, { useState } from "react";
import Layout from "./../../components/Layout";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import "../../styles/AuthStyles.css";

// Nigel Lee, A0259264W
const ForgotPassword = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    answer: "",
    newPassword: "",
  });

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post("/api/v1/auth/forgot-password", formData);
      if (data?.success) {
        toast.success(data.message, {
          duration: 5000,
          icon: "🙏",
          style: { background: "green", color: "white" },
        });
        navigate("/login");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
        if (error.response && error.response.data && error.response.data.message) {
          toast.error(error.response.data.message);
        } else {
          toast.error("Something went wrong");
        }
    }
  };

  const fields = [
    { key: "email", type: "email", placeholder: "Enter Your Email", autoFocus: true },
    { key: "answer", type: "text", placeholder: "Enter Your Answer" },
    { key: "newPassword", type: "password", placeholder: "Enter Your New Password" },
  ];

  return (
    <Layout title="Forgot Password - Ecommerce App">
      <div className="form-container" style={{ minHeight: "90vh" }}>
        <form onSubmit={handleSubmit}>
          <h4 className="title">RESET YOUR PASSWORD</h4>
          {fields.map(({ key, type, placeholder, autoFocus }) => (
            <div className="mb-3" key={key}>
              <input
                type={type}
                value={formData[key]}
                onChange={handleChange(key)}
                className="form-control"
                placeholder={placeholder}
                autoFocus={autoFocus}
                required
              />
            </div>
          ))}
          <button type="submit" className="btn btn-primary">
            RESET PASSWORD
          </button>
        </form>
      </div>
    </Layout>
  );
};

export default ForgotPassword;