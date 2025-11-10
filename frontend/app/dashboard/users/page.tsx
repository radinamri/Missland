"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/utils/api";

interface UserListItem {
  id: number;
  email: string;
  username: string;
  role: "USER" | "ANNOTATOR" | "ADMIN" | "SUPERUSER";
  is_staff: boolean;
  is_superuser: boolean;
  date_joined: string;
}

export default function UserManagementPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const isAdmin = user?.is_superuser || user?.role === "ADMIN";

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get<UserListItem[]>("/api/dashboard/users/");
      setUsers(response.data);
      setError(null);
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: number, newRole: string) => {
    try {
      const response = await api.patch(`/api/dashboard/users/${userId}/role/`, {
        role: newRole,
      });
      
      // Update the users list with the new data
      setUsers((prevUsers) =>
        prevUsers.map((u) => (u.id === userId ? { ...u, ...response.data } : u))
      );
      
      showToast("User role updated successfully", "success");
    } catch (err) {
      const error = err as { response?: { data?: { role?: string[]; detail?: string } } };
      const errorMsg = error.response?.data?.role?.[0] || error.response?.data?.detail || "Failed to update role";
      showToast(errorMsg, "error");
    }
  };

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
            toast.type === "success"
              ? "bg-green-500 text-white"
              : "bg-red-500 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-600 mt-1">
            Manage user roles and permissions
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Permissions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                {isAdmin && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {u.username}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{u.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {isAdmin ? (
                      <select
                        value={u.role}
                        onChange={(e) => updateUserRole(u.id, e.target.value)}
                        disabled={u.is_superuser || u.id === user?.id}
                        className={`text-sm rounded-full px-3 py-1 font-semibold ${
                          u.role === "ADMIN"
                            ? "bg-purple-100 text-purple-800"
                            : u.role === "ANNOTATOR"
                            ? "bg-blue-100 text-blue-800"
                            : u.role === "SUPERUSER"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        } ${
                          u.is_superuser || u.id === user?.id
                            ? "cursor-not-allowed opacity-60"
                            : "cursor-pointer hover:opacity-80"
                        }`}
                      >
                        <option value="USER">USER</option>
                        <option value="ANNOTATOR">ANNOTATOR</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    ) : (
                      <span
                        className={`inline-block text-sm rounded-full px-3 py-1 font-semibold ${
                          u.role === "ADMIN"
                            ? "bg-purple-100 text-purple-800"
                            : u.role === "ANNOTATOR"
                            ? "bg-blue-100 text-blue-800"
                            : u.role === "SUPERUSER"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {u.role}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      {u.is_superuser && (
                        <span className="inline-block text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                          Superuser
                        </span>
                      )}
                      {u.is_staff && (
                        <span className="inline-block text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                          Staff
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(u.date_joined)}
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {u.is_superuser || u.id === user?.id ? (
                        <span className="text-gray-400">No actions</span>
                      ) : (
                        <span className="text-gray-600">
                          Role editable above
                        </span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No users found
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Role Descriptions:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>
            <strong>USER:</strong> Regular app user, no dashboard access
          </li>
          <li>
            <strong>ANNOTATOR:</strong> Can review and manage annotations data
          </li>
          <li>
            <strong>ADMIN:</strong> Full dashboard access including user management
          </li>
          <li>
            <strong>SUPERUSER:</strong> Full system access (managed via Django admin or command line)
          </li>
        </ul>
      </div>
    </div>
  );
}
