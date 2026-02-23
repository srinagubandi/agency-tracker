import React, { useEffect, useState } from 'react';
import styled from '@emotion/styled';
import { Button, Icon, Table, TableHead, TableBody, TableRow, TableCell, TableCellHeader } from '../../components/ui';
import api from '../../api/client';

const PageHeader = styled.div`display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;`;
const PageTitle = styled.h2`font-size:20px;font-weight:700;color:#1a1a2e;margin:0;`;
const Card = styled.div`background:#fff;border-radius:12px;box-shadow:0 1px 4px rgba(0,0,0,0.06);overflow:hidden;`;
const RoleBadge = styled.span<{role:string}>`font-size:11px;font-weight:600;padding:3px 10px;border-radius:20px;background:${({role})=>role==='super_admin'?'#dbeafe':role==='manager'?'#e0f2fe':role==='worker'?'#dcfce7':'#f3f4f6'};color:${({role})=>role==='super_admin'?'#2563eb':role==='manager'?'#0284c7':role==='worker'?'#16a34a':'#6b7280'};`;
const StatusBadge = styled.span<{active:boolean}>`font-size:11px;font-weight:600;padding:3px 10px;border-radius:20px;background:${({active})=>active?'#dcfce7':'#f3f4f6'};color:${({active})=>active?'#16a34a':'#6b7280'};`;
const ActionBtn = styled.button`background:none;border:none;cursor:pointer;padding:4px 6px;border-radius:6px;color:#6b7280;&:hover{background:#f3f4f6;}`;
const Overlay = styled.div`position:fixed;inset:0;background:rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;z-index:1000;`;
const ModalBox = styled.div`background:#fff;border-radius:16px;min-width:440px;max-width:520px;padding:28px;box-shadow:0 20px 60px rgba(0,0,0,0.2);`;
const ModalTitle = styled.h3`font-size:18px;font-weight:600;margin:0 0 20px;`;
const FieldGroup = styled.div`display:flex;flex-direction:column;gap:6px;margin-bottom:16px;`;
const FieldLabel = styled.label`font-size:13px;font-weight:500;color:#374151;`;
const StyledInput = styled.input`width:100%;padding:9px 12px;border:1.5px solid #d1d5db;border-radius:8px;font-size:14px;outline:none;box-sizing:border-box;&:focus{border-color:#2E6DA4;}`;
const StyledSelect = styled.select`width:100%;padding:9px 12px;border:1.5px solid #d1d5db;border-radius:8px;font-size:14px;outline:none;background:#fff;box-sizing:border-box;&:focus{border-color:#2E6DA4;}`;
const ModalFooter = styled.div`display:flex;gap:10px;justify-content:flex-end;margin-top:16px;`;
const InviteLinkBox = styled.div`background:#f0f9ff;border:1.5px solid #bae6fd;border-radius:8px;padding:14px;margin-bottom:16px;`;
const InviteLinkLabel = styled.div`font-size:12px;font-weight:600;color:#0369a1;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px;`;
const InviteLinkText = styled.div`font-size:12px;color:#1e40af;word-break:break-all;font-family:monospace;background:#fff;border:1px solid #bae6fd;border-radius:6px;padding:8px 10px;margin-bottom:8px;`;
const CopyBtn = styled.button`background:#0ea5e9;color:#fff;border:none;border-radius:6px;padding:6px 14px;font-size:12px;font-weight:600;cursor:pointer;width:100%;&:hover{background:#0284c7;}`;
const SuccessNote = styled.p`font-size:13px;color:#16a34a;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:8px 12px;margin:0 0 14px;`;

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ email: '', role: 'worker', name: '' });
  const [saving, setSaving] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [copyMsg, setCopyMsg] = useState('');
  const [invitedName, setInvitedName] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const r = await api.get('/users');
      setUsers(r.data.users || r.data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleInvite = async () => {
    if (!form.email || !form.name) return;
    setSaving(true);
    try {
      const r = await api.post('/auth/invite', form);
      // Backend returns inviteLink — display it so admin can copy & share manually
      setInviteLink(r.data.inviteLink || '');
      setInvitedName(form.name);
      fetchUsers();
    } catch (e: any) {
      alert(e.response?.data?.error || e.response?.data?.message || 'Failed to create invite.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopyMsg('Copied!');
      setTimeout(() => setCopyMsg(''), 2500);
    });
  };

  const handleClose = () => {
    setShowModal(false);
    setInviteLink('');
    setCopyMsg('');
    setInvitedName('');
    setForm({ email: '', role: 'worker', name: '' });
  };

  const handleDeactivate = async (id: number) => {
    if (!window.confirm('Deactivate this user?')) return;
    await api.patch(`/users/${id}/status`, { status: 'inactive' });
    fetchUsers();
  };

  return (
    <div>
      <PageHeader>
        <PageTitle>Users</PageTitle>
        <Button
          variant="primary"
          startIcon={<Icon name="plus" size={16} />}
          onClick={() => {
            setForm({ email: '', role: 'worker', name: '' });
            setInviteLink('');
            setCopyMsg('');
            setShowModal(true);
          }}
        >
          Invite User
        </Button>
      </PageHeader>

      <Card>
        <Table>
          <TableHead>
            <TableRow>
              <TableCellHeader>Name</TableCellHeader>
              <TableCellHeader>Email</TableCellHeader>
              <TableCellHeader>Role</TableCellHeader>
              <TableCellHeader>Status</TableCellHeader>
              <TableCellHeader>Joined</TableCellHeader>
              <TableCellHeader>Actions</TableCellHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={6} style={{ textAlign: 'center', color: '#9ca3af', padding: '32px' }}>
                  Loading...
                </TableCell>
              </TableRow>
            )}
            {!loading && users.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} style={{ textAlign: 'center', color: '#9ca3af', padding: '32px' }}>
                  No users yet. Click "Invite User" to add someone.
                </TableCell>
              </TableRow>
            )}
            {users.map((u: any) => (
              <TableRow key={u.id}>
                <TableCell style={{ fontWeight: 500 }}>{u.name || '—'}</TableCell>
                <TableCell style={{ fontSize: 13 }}>{u.email}</TableCell>
                <TableCell><RoleBadge role={u.role}>{u.role?.replace('_', ' ')}</RoleBadge></TableCell>
                <TableCell>
                  <StatusBadge active={u.status === 'active' || u.status === 'invited'}>
                    {u.status}
                  </StatusBadge>
                </TableCell>
                <TableCell style={{ fontSize: 13, color: '#6b7280' }}>
                  {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                </TableCell>
                <TableCell>
                  {(u.status === 'active' || u.status === 'invited') && (
                    <ActionBtn onClick={() => handleDeactivate(u.id)} title="Deactivate user">
                      <Icon name="ban-user" size={16} />
                    </ActionBtn>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {showModal && (
        <Overlay>
          <ModalBox>
            <ModalTitle>{inviteLink ? 'Share Invite Link' : 'Invite User'}</ModalTitle>

            {/* Step 1: Fill in user details */}
            {!inviteLink && (
              <>
                <FieldGroup>
                  <FieldLabel>Full Name</FieldLabel>
                  <StyledInput
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="Jane Smith"
                  />
                </FieldGroup>
                <FieldGroup>
                  <FieldLabel>Email Address</FieldLabel>
                  <StyledInput
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="jane@example.com"
                  />
                </FieldGroup>
                <FieldGroup>
                  <FieldLabel>Role</FieldLabel>
                  <StyledSelect value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                    <option value="worker">Worker</option>
                    <option value="manager">Manager</option>
                    <option value="client">Client</option>
                  </StyledSelect>
                </FieldGroup>
                <ModalFooter>
                  <Button variant="secondary" onClick={handleClose}>Cancel</Button>
                  <Button
                    variant="primary"
                    onClick={handleInvite}
                    isDisabled={saving || !form.email || !form.name}
                  >
                    {saving ? 'Creating…' : 'Generate Invite Link'}
                  </Button>
                </ModalFooter>
              </>
            )}

            {/* Step 2: Show the generated invite link for manual sharing */}
            {inviteLink && (
              <>
                <SuccessNote>
                  ✓ Invite created for <strong>{invitedName}</strong>. Copy the link below and send it to them — it expires in 72 hours.
                </SuccessNote>
                <InviteLinkBox>
                  <InviteLinkLabel>Invite Link (valid 72 hours)</InviteLinkLabel>
                  <InviteLinkText>{inviteLink}</InviteLinkText>
                  <CopyBtn onClick={handleCopy}>
                    {copyMsg ? `✓ ${copyMsg}` : 'Copy Link to Clipboard'}
                  </CopyBtn>
                </InviteLinkBox>
                <ModalFooter>
                  <Button variant="primary" onClick={handleClose}>Done</Button>
                </ModalFooter>
              </>
            )}
          </ModalBox>
        </Overlay>
      )}
    </div>
  );
};

export default UsersPage;
