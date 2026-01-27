const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function to get auth token
const getAuthToken = () => {
  const user = sessionStorage.getItem('user');
  if (user) {
    try {
      const userData = JSON.parse(user);
      return userData.token;
    } catch {
      return null;
    }
  }
  return null;
};

// Helper function to handle 401 errors (token expired/invalid)
const handleUnauthorized = () => {
  sessionStorage.removeItem('user');
  // Rediriger vers la page de connexion
  window.location.href = '/';
};

// Helper function to make authenticated requests
const fetchWithAuth = async (url, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    headers,
  });

  // Si token expiré ou invalide, déconnecter et rediriger
  if (response.status === 401) {
    handleUnauthorized();
    throw new Error('Session expirée. Veuillez vous reconnecter.');
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
};

// Auth API
export const authAPI = {
  register: async (email, password, accountType = 'individual', organizationName = null) => {
    const body = { email, password, accountType };
    if (accountType === 'organization' && organizationName) {
      body.organizationName = organizationName;
    }
    return fetchWithAuth('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  login: async (email, password) => {
    return fetchWithAuth('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  resetPassword: async (email, newPassword) => {
    return fetchWithAuth('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, newPassword }),
    });
  },

  getCurrentUser: async () => {
    return fetchWithAuth('/auth/me');
  },

  changePassword: async (currentPassword, newPassword) => {
    return fetchWithAuth('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  updateProfile: async (profileData) => {
    return fetchWithAuth('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  deleteAccount: async (password) => {
    return fetchWithAuth('/auth/delete-account', {
      method: 'DELETE',
      body: JSON.stringify({ password }),
    });
  },

  changeEmail: async (newEmail, password) => {
    return fetchWithAuth('/auth/change-email', {
      method: 'POST',
      body: JSON.stringify({ newEmail, password }),
    });
  },
};

// Articles API
export const articlesAPI = {
  getAll: async () => {
    return fetchWithAuth('/articles');
  },

  getOne: async (id) => {
    return fetchWithAuth(`/articles/${id}`);
  },

  create: async (articleData) => {
    return fetchWithAuth('/articles', {
      method: 'POST',
      body: JSON.stringify(articleData),
    });
  },

  update: async (id, articleData) => {
    return fetchWithAuth(`/articles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(articleData),
    });
  },

  delete: async (id) => {
    return fetchWithAuth(`/articles/${id}`, {
      method: 'DELETE',
    });
  },
};

// Projects API
export const projectsAPI = {
  getAll: async () => {
    return fetchWithAuth('/projects');
  },

  getOne: async (id) => {
    return fetchWithAuth(`/projects/${id}`);
  },

  create: async (projectData) => {
    return fetchWithAuth('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  },

  update: async (id, projectData) => {
    return fetchWithAuth(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(projectData),
    });
  },

  delete: async (id) => {
    return fetchWithAuth(`/projects/${id}`, {
      method: 'DELETE',
    });
  },
};

// Users API (admin)
export const usersAPI = {
  getAll: async () => {
    return fetchWithAuth('/users');
  },

  getAdminStats: async () => {
    return fetchWithAuth('/users/admin/stats');
  },

  updateRole: async (userId, role) => {
    return fetchWithAuth(`/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  },

  deleteUser: async (userId) => {
    return fetchWithAuth(`/users/${userId}`, {
      method: 'DELETE',
    });
  },

  // Project members
  getProjectMembers: async (projectId) => {
    return fetchWithAuth(`/users/projects/${projectId}/members`);
  },

  addProjectMember: async (projectId, userId, role = 'member') => {
    return fetchWithAuth(`/users/projects/${projectId}/members`, {
      method: 'POST',
      body: JSON.stringify({ userId, role }),
    });
  },

  inviteToProject: async (projectId, email, role = 'member') => {
    return fetchWithAuth(`/users/projects/${projectId}/invite`, {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    });
  },

  updateProjectMemberRole: async (projectId, memberId, role) => {
    return fetchWithAuth(`/users/projects/${projectId}/members/${memberId}`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  },

  removeProjectMember: async (projectId, memberId) => {
    return fetchWithAuth(`/users/projects/${projectId}/members/${memberId}`, {
      method: 'DELETE',
    });
  },

  // Organization members assignment to projects
  getOrgMembersForAssignment: async (projectId) => {
    return fetchWithAuth(`/users/projects/${projectId}/org-members`);
  },

  assignOrgMemberToProject: async (projectId, userId, role = 'member') => {
    return fetchWithAuth(`/users/projects/${projectId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ userId, role }),
    });
  },
};

// SEO Criteria API
export const seoCriteriaAPI = {
  getAll: async () => {
    return fetchWithAuth('/seo-criteria');
  },

  initialize: async () => {
    return fetchWithAuth('/seo-criteria/initialize', {
      method: 'POST',
    });
  },

  upsert: async (criterionData) => {
    return fetchWithAuth('/seo-criteria/upsert', {
      method: 'POST',
      body: JSON.stringify(criterionData),
    });
  },

  batchUpdate: async (criteria) => {
    return fetchWithAuth('/seo-criteria/batch', {
      method: 'PUT',
      body: JSON.stringify({ criteria }),
    });
  },

  toggle: async (criterionId) => {
    return fetchWithAuth(`/seo-criteria/${criterionId}/toggle`, {
      method: 'PATCH',
    });
  },

  delete: async (criterionId) => {
    return fetchWithAuth(`/seo-criteria/${criterionId}`, {
      method: 'DELETE',
    });
  },

  resetToDefault: async () => {
    return fetchWithAuth('/seo-criteria/reset', {
      method: 'POST',
    });
  },
};

// Organizations API
export const organizationsAPI = {
  getMine: async () => {
    return fetchWithAuth('/organizations/mine');
  },

  getAll: async () => {
    return fetchWithAuth('/organizations');
  },

  getOne: async (id) => {
    return fetchWithAuth(`/organizations/${id}`);
  },

  create: async (organizationData) => {
    return fetchWithAuth('/organizations', {
      method: 'POST',
      body: JSON.stringify(organizationData),
    });
  },

  update: async (id, organizationData) => {
    return fetchWithAuth(`/organizations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(organizationData),
    });
  },

  delete: async (id) => {
    return fetchWithAuth(`/organizations/${id}`, {
      method: 'DELETE',
    });
  },

  // Organization members
  getMembers: async (organizationId) => {
    return fetchWithAuth(`/organizations/${organizationId}/members`);
  },

  addMember: async (organizationId, userId, role = 'member') => {
    return fetchWithAuth(`/organizations/${organizationId}/members`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, role }),
    });
  },

  inviteMember: async (organizationId, email, role = 'member') => {
    return fetchWithAuth(`/organizations/${organizationId}/invite`, {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    });
  },

  updateMemberRole: async (organizationId, memberId, role) => {
    return fetchWithAuth(`/organizations/${organizationId}/members/${memberId}`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  },

  removeMember: async (organizationId, memberId) => {
    return fetchWithAuth(`/organizations/${organizationId}/members/${memberId}`, {
      method: 'DELETE',
    });
  },

  // Invitations
  getInvitations: async (organizationId) => {
    return fetchWithAuth(`/organizations/${organizationId}/invitations`);
  },

  cancelInvitation: async (organizationId, invitationId) => {
    return fetchWithAuth(`/organizations/${organizationId}/invitations/${invitationId}`, {
      method: 'DELETE',
    });
  },

  acceptInvitation: async (token) => {
    return fetchWithAuth(`/organizations/invitations/${token}/accept`, {
      method: 'POST',
    });
  },

  // My pending invitations (for invited users)
  getMyPendingInvitations: async () => {
    return fetchWithAuth('/organizations/my/invitations');
  },

  acceptInvitationById: async (invitationId) => {
    return fetchWithAuth(`/organizations/my/invitations/${invitationId}/accept`, {
      method: 'POST',
    });
  },

  declineInvitationById: async (invitationId) => {
    return fetchWithAuth(`/organizations/my/invitations/${invitationId}`, {
      method: 'DELETE',
    });
  },

  // Logo
  uploadLogo: async (organizationId, logoBase64) => {
    return fetchWithAuth(`/organizations/${organizationId}/logo`, {
      method: 'POST',
      body: JSON.stringify({ logo_base64: logoBase64 }),
    });
  },

  deleteLogo: async (organizationId) => {
    return fetchWithAuth(`/organizations/${organizationId}/logo`, {
      method: 'DELETE',
    });
  },
};
