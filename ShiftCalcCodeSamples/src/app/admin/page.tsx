"use client";

import Link from "next/link";
import AdminLayout from "@/components/admin/AdminLayout";
import { useState, useEffect } from "react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    schedules: 0,
    shiftCodes: 0
  });
  
  useEffect(() => {
    // Optionally fetch stats if you want to display them
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/admin/data-stats", {
          credentials: "same-origin",
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };
    
    fetchStats();
  }, []);

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Admin Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DashboardCard 
            title="User Management" 
            description="Manage user accounts, roles, and permissions."
            linkText="Manage Users"
            linkHref="/admin/users"
          />
          
          <DashboardCard 
            title="Data Management" 
            description="Import and manage schedules and shift codes."
            linkText="Manage Data"
            linkHref="/admin/data"
          />
          
          <DashboardCard 
            title="System Settings" 
            description="Configure application settings and defaults."
            linkText="View Settings"
            linkHref="/admin/settings"
          />
          
          <DashboardCard 
            title="System Logs" 
            description="View system logs and activity history."
            linkText="View Logs"
            linkHref="/admin/logs"
          />
          
          <DashboardCard 
            title="Employee Assignments" 
            description="Upload and manage employee-to-schedule assignments."
            linkText="Manage Employees"
            linkHref="/admin/employees"
          />
        </div>
      </div>
    </AdminLayout>
  );
}

function DashboardCard({ title, description, linkText, linkHref }: { 
  title: string; 
  description: string; 
  linkText: string; 
  linkHref: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">{title}</h2>
      <p className="text-gray-600 dark:text-gray-300 mb-4">
        {description}
      </p>
      <Link 
        href={linkHref} 
        className="inline-block bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
      >
        {linkText}
      </Link>
    </div>
  );
}
