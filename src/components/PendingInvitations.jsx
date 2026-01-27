import { useState, useEffect } from 'react';
import { organizationsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './PendingInvitations.css';

const PendingInvitations = () => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const { refreshUser } = useAuth();

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    try {
      const response = await organizationsAPI.getMyPendingInvitations();
      setInvitations(response.invitations || []);
    } catch (error) {
      console.error('Error loading invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (invitationId) => {
    setProcessingId(invitationId);
    try {
      await organizationsAPI.acceptInvitationById(invitationId);
      // Remove from list
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
      // Refresh user data to update organization info
      await refreshUser();
    } catch (error) {
      console.error('Error accepting invitation:', error);
      alert(error.message || 'Erreur lors de l\'acceptation de l\'invitation');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (invitationId) => {
    if (!confirm('Êtes-vous sûr de vouloir refuser cette invitation ?')) {
      return;
    }

    setProcessingId(invitationId);
    try {
      await organizationsAPI.declineInvitationById(invitationId);
      // Remove from list
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
    } catch (error) {
      console.error('Error declining invitation:', error);
      alert(error.message || 'Erreur lors du refus de l\'invitation');
    } finally {
      setProcessingId(null);
    }
  };

  const getRoleLabel = (role) => {
    const labels = {
      admin: 'Admin',
      member: 'Membre'
    };
    return labels[role] || role;
  };

  if (loading) {
    return null;
  }

  if (invitations.length === 0) {
    return null;
  }

  return (
    <div className="pending-invitations">
      <div className="invitations-header">
        <span className="invitations-icon">📬</span>
        <h3>Invitations en attente ({invitations.length})</h3>
      </div>
      <div className="invitations-list">
        {invitations.map((invitation) => (
          <div key={invitation.id} className="invitation-card">
            <div className="invitation-content">
              <div className="invitation-org">
                <span className="org-icon">🏢</span>
                <span className="org-name">{invitation.organization?.name}</span>
              </div>
              <p className="invitation-role">
                Vous êtes invité en tant que <strong>{getRoleLabel(invitation.role)}</strong>
              </p>
              <p className="invitation-expires">
                Expire le {new Date(invitation.expires_at).toLocaleDateString('fr-FR')}
              </p>
            </div>
            <div className="invitation-actions">
              <button
                className="btn-accept"
                onClick={() => handleAccept(invitation.id)}
                disabled={processingId === invitation.id}
              >
                {processingId === invitation.id ? '...' : 'Accepter'}
              </button>
              <button
                className="btn-decline"
                onClick={() => handleDecline(invitation.id)}
                disabled={processingId === invitation.id}
              >
                Refuser
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PendingInvitations;
